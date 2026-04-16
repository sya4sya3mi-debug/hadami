import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import {
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

function loadEnv() {
  const env = { ...process.env };
  const envPath = path.join(process.cwd(), ".env.local");

  if (!fs.existsSync(envPath)) {
    return env;
  }

  const text = fs.readFileSync(envPath, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const match = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    if (env[key]) continue;

    const value =
      rawValue.startsWith('"') && rawValue.endsWith('"')
        ? rawValue.slice(1, -1)
        : rawValue;

    env[key] = value;
  }

  return env;
}

function requireEnv(env, key) {
  const value = env[key];
  if (!value) {
    throw new Error(`Missing required env: ${key}`);
  }
  return value;
}

function parseArgs(argv) {
  const args = {
    apply: false,
    limit: null,
    verbose: false,
  };

  for (const arg of argv) {
    if (arg === "--apply") {
      args.apply = true;
      continue;
    }

    if (arg === "--verbose") {
      args.verbose = true;
      continue;
    }

    if (arg.startsWith("--limit=")) {
      const value = Number(arg.slice("--limit=".length));
      if (Number.isFinite(value) && value > 0) {
        args.limit = value;
      }
    }
  }

  return args;
}

function isDirectImageUrl(value) {
  return (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("/") ||
    value.startsWith("data:")
  );
}

function normalizeStoredPath(value, r2PublicUrl) {
  if (!value) return null;

  if (!isDirectImageUrl(value)) {
    return value;
  }

  if (value.startsWith("/") || value.startsWith("data:")) {
    return null;
  }

  try {
    const url = new URL(value);

    if (
      r2PublicUrl &&
      value.startsWith(`${r2PublicUrl}/`)
    ) {
      return value.slice(`${r2PublicUrl}/`.length);
    }

    const supabaseMatch = url.pathname.match(
      /\/storage\/v1\/object\/public\/[^/]+\/(.+)$/
    );
    if (supabaseMatch) {
      return supabaseMatch[1];
    }
  } catch {
    return null;
  }

  return null;
}

function getThumbPath(pathname) {
  return pathname.endsWith(".webp")
    ? pathname.replace(/\.webp$/, "-thumb.webp")
    : `${pathname}-thumb`;
}

function getFilename(key) {
  return key.split("/").pop() ?? key;
}

async function listAllKeys(client, bucket) {
  const keys = [];
  let continuationToken;

  do {
    const res = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        ContinuationToken: continuationToken,
      })
    );

    for (const object of res.Contents ?? []) {
      if (object.Key) keys.push(object.Key);
    }

    continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (continuationToken);

  return keys;
}

function buildFilenameIndex(keys) {
  const index = new Map();

  for (const key of keys) {
    const filename = getFilename(key);
    const current = index.get(filename) ?? [];
    current.push(key);
    index.set(filename, current);
  }

  return index;
}

function findUniqueSource(targetKey, filenameIndex, existingKeys) {
  const filename = getFilename(targetKey);
  const candidates = (filenameIndex.get(filename) ?? []).filter(
    (candidate) => candidate !== targetKey && existingKeys.has(candidate)
  );

  return candidates.length === 1 ? candidates[0] : null;
}

async function headObject(client, bucket, key) {
  try {
    const result = await client.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );

    return {
      exists: true,
      contentType: result.ContentType ?? "application/octet-stream",
    };
  } catch {
    return {
      exists: false,
      contentType: null,
    };
  }
}

async function copyObjectWithinBucket(client, bucket, sourceKey, targetKey) {
  const source = await client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: sourceKey,
    })
  );

  if (!source.Body) {
    throw new Error(`Source body missing for ${sourceKey}`);
  }

  const bytes = await source.Body.transformToByteArray();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: targetKey,
      Body: Buffer.from(bytes),
      ContentType: source.ContentType ?? "application/octet-stream",
    })
  );

  return source.ContentType ?? "application/octet-stream";
}

async function fetchProducts(supabase, limit) {
  let query = supabase
    .from("products")
    .select("id, package_image_url")
    .not("package_image_url", "is", null)
    .order("created_at", { ascending: true });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to load products: ${error.message}`);
  }

  return data ?? [];
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const env = loadEnv();

  const supabaseUrl = requireEnv(env, "NEXT_PUBLIC_SUPABASE_URL");
  const supabaseKey =
    env.SUPABASE_SERVICE_ROLE_KEY ?? requireEnv(env, "NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const r2PublicUrl = requireEnv(env, "NEXT_PUBLIC_R2_PUBLIC_URL");
  const r2Endpoint = requireEnv(env, "R2_ENDPOINT");
  const r2AccessKeyId = requireEnv(env, "R2_ACCESS_KEY_ID");
  const r2SecretAccessKey = requireEnv(env, "R2_SECRET_ACCESS_KEY");
  const r2Bucket = env.R2_BUCKET ?? "hadami-images";

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  const r2 = new S3Client({
    region: "auto",
    endpoint: r2Endpoint,
    credentials: {
      accessKeyId: r2AccessKeyId,
      secretAccessKey: r2SecretAccessKey,
    },
  });

  const rows = await fetchProducts(supabase, args.limit);
  const existingKeys = new Set(await listAllKeys(r2, r2Bucket));
  const filenameIndex = buildFilenameIndex(existingKeys);

  const operations = [];
  const unresolved = [];
  let originalTargetsMissing = 0;
  let thumbTargetsMissing = 0;
  let originalTargetsPresent = 0;
  let thumbTargetsPresent = 0;
  let directUrlRows = 0;

  for (const row of rows) {
    const storedValue = row.package_image_url;
    if (typeof storedValue !== "string") continue;

    const targetOriginal = normalizeStoredPath(storedValue, r2PublicUrl);
    if (!targetOriginal) {
      directUrlRows += 1;
      continue;
    }

    const targetThumb = getThumbPath(targetOriginal);
    const originalExists = existingKeys.has(targetOriginal);
    const thumbExists = existingKeys.has(targetThumb);

    if (originalExists) {
      originalTargetsPresent += 1;
    } else {
      originalTargetsMissing += 1;
      const sourceOriginal = findUniqueSource(targetOriginal, filenameIndex, existingKeys);

      if (sourceOriginal) {
        operations.push({
          productId: row.id,
          kind: "original",
          sourceKey: sourceOriginal,
          targetKey: targetOriginal,
        });
      } else {
        unresolved.push({
          productId: row.id,
          kind: "original",
          targetKey: targetOriginal,
        });
      }
    }

    if (thumbExists) {
      thumbTargetsPresent += 1;
    } else {
      thumbTargetsMissing += 1;
      const sourceThumb = findUniqueSource(targetThumb, filenameIndex, existingKeys);

      if (sourceThumb) {
        operations.push({
          productId: row.id,
          kind: "thumb",
          sourceKey: sourceThumb,
          targetKey: targetThumb,
        });
      } else {
        unresolved.push({
          productId: row.id,
          kind: "thumb",
          targetKey: targetThumb,
        });
      }
    }
  }

  const summary = {
    mode: args.apply ? "apply" : "dry-run",
    totalProductsChecked: rows.length,
    directUrlRows,
    originalTargetsPresent,
    originalTargetsMissing,
    thumbTargetsPresent,
    thumbTargetsMissing,
    plannedCopies: operations.length,
    unresolvedTargets: unresolved.length,
  };

  console.log(JSON.stringify(summary, null, 2));

  if (args.verbose) {
    console.log(
      JSON.stringify(
        {
          sampleOperations: operations.slice(0, 10),
          sampleUnresolved: unresolved.slice(0, 10),
        },
        null,
        2
      )
    );
  }

  if (!args.apply) {
    return;
  }

  let copied = 0;
  const applyErrors = [];

  for (const operation of operations) {
    const currentHead = await headObject(r2, r2Bucket, operation.targetKey);
    if (currentHead.exists) {
      existingKeys.add(operation.targetKey);
      continue;
    }

    try {
      const contentType = await copyObjectWithinBucket(
        r2,
        r2Bucket,
        operation.sourceKey,
        operation.targetKey
      );
      existingKeys.add(operation.targetKey);
      copied += 1;

      if (args.verbose) {
        console.log(
          JSON.stringify(
            {
              copied: operation,
              contentType,
            },
            null,
            2
          )
        );
      }
    } catch (error) {
      applyErrors.push({
        ...operation,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  console.log(
    JSON.stringify(
      {
        copied,
        failedCopies: applyErrors.length,
        sampleErrors: applyErrors.slice(0, 10),
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
