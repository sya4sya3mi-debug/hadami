/**
 * Supabase Storage → Cloudflare R2 画像移行スクリプト
 *
 * Usage: node scripts/migrate-to-r2.mjs
 *
 * 環境変数:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY — Supabase (移行元)
 *   R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET — R2 (移行先)
 */

import { createClient } from "@supabase/supabase-js";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

// ── Supabase ──
const SUPABASE_URL = "https://krxagbqtpfgqvtfgvvcx.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_KEY) {
  // fallback: use anon key for public bucket reads
  console.log("SUPABASE_SERVICE_ROLE_KEY not set, using public URL download");
}

const supabase = SUPABASE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

const BUCKET = "product-images";

// ── R2 ──
const r2 = new S3Client({
  region: "auto",
  endpoint: "https://fba9e71cd1d68f2353afb0d2e18bba2c.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId: "f41d26eade9e24bf8195b8c62aa1d0e4",
    secretAccessKey: "33c085d32696f24b0eeef05509d4dcad248cede8b6c8e6484928a38064fd211a",
  },
});
const R2_BUCKET = "hadami-images";

// ── helpers ──
async function downloadFromSupabase(path) {
  // Public bucket — just fetch the public URL
  const url = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return Buffer.from(await res.arrayBuffer());
}

async function existsInR2(key) {
  try {
    await r2.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function uploadToR2(key, body, contentType) {
  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

function extractPath(packageImageUrl) {
  // If it's a full Supabase URL, extract the path after /product-images/
  if (packageImageUrl.startsWith("https://")) {
    const match = packageImageUrl.match(/\/product-images\/(.+)$/);
    return match ? match[1] : null;
  }
  return packageImageUrl;
}

function getThumbPath(path) {
  if (path.endsWith(".webp")) return path.replace(/\.webp$/, "-thumb.webp");
  if (path.endsWith(".jpg")) return path.replace(/\.jpg$/, "-thumb.jpg");
  return `${path}-thumb`;
}

// ── main ──
const images = [
  { id: "2b080555-7e83-42fe-976d-65f4ea5c1b13", url: "https://krxagbqtpfgqvtfgvvcx.supabase.co/storage/v1/object/public/product-images/9ad217d1-8384-48c0-a123-5f2ad9bb4be5/2b080555-7e83-42fe-976d-65f4ea5c1b13.jpg" },
  { id: "43b64da6-0eae-4df2-a745-f6a4dcd0e0ed", url: "10dec6ee-0416-47dd-a79a-ff9a44092dc3/43b64da6-0eae-4df2-a745-f6a4dcd0e0ed.webp" },
  { id: "f4885c6d-a5c9-4ff3-b469-97a2d3a7bbac", url: "10dec6ee-0416-47dd-a79a-ff9a44092dc3/f4885c6d-a5c9-4ff3-b469-97a2d3a7bbac.webp" },
  { id: "19bb21e7-1384-4716-8128-7fdc1e8e1575", url: "10dec6ee-0416-47dd-a79a-ff9a44092dc3/19bb21e7-1384-4716-8128-7fdc1e8e1575.webp" },
  { id: "e472ac5a-da9d-48ea-9927-b1808b948b21", url: "10dec6ee-0416-47dd-a79a-ff9a44092dc3/e472ac5a-da9d-48ea-9927-b1808b948b21.webp" },
  { id: "6d76fa6e-e1ad-4828-8839-00eb1142111a", url: "10dec6ee-0416-47dd-a79a-ff9a44092dc3/6d76fa6e-e1ad-4828-8839-00eb1142111a.webp" },
  { id: "ab537590-ba03-47dd-b256-5d55516c2487", url: "10dec6ee-0416-47dd-a79a-ff9a44092dc3/ab537590-ba03-47dd-b256-5d55516c2487.webp" },
  { id: "a31a2b67-c856-4f0f-a635-6876a76a502e", url: "10dec6ee-0416-47dd-a79a-ff9a44092dc3/a31a2b67-c856-4f0f-a635-6876a76a502e.webp" },
  { id: "fccf81c8-18ec-41e2-b6a1-f66cafcc77db", url: "10dec6ee-0416-47dd-a79a-ff9a44092dc3/fccf81c8-18ec-41e2-b6a1-f66cafcc77db.webp" },
  { id: "3d2bc328-7f33-4c88-a8f3-aebe064eeff0", url: "10dec6ee-0416-47dd-a79a-ff9a44092dc3/3d2bc328-7f33-4c88-a8f3-aebe064eeff0.webp" },
  { id: "3f204c00-8e41-472b-8f5c-97518953acdc", url: "10dec6ee-0416-47dd-a79a-ff9a44092dc3/3f204c00-8e41-472b-8f5c-97518953acdc.webp" },
  { id: "5fb60003-a7c0-4d6e-9eb1-3e445e25d4d7", url: "10dec6ee-0416-47dd-a79a-ff9a44092dc3/5fb60003-a7c0-4d6e-9eb1-3e445e25d4d7.webp" },
  { id: "9dffbe74-dc66-4e23-87a1-7c475c5a77d8", url: "10dec6ee-0416-47dd-a79a-ff9a44092dc3/9dffbe74-dc66-4e23-87a1-7c475c5a77d8.webp" },
  { id: "6da98596-d50b-4d7e-b621-e932b65eb27d", url: "10dec6ee-0416-47dd-a79a-ff9a44092dc3/6da98596-d50b-4d7e-b621-e932b65eb27d.webp" },
  { id: "f95561aa-2fd6-4104-898b-72ae3d861e2a", url: "10dec6ee-0416-47dd-a79a-ff9a44092dc3/f95561aa-2fd6-4104-898b-72ae3d861e2a.webp" },
  { id: "6875e81a-f01d-4938-a299-03bb7af0bcc5", url: "10dec6ee-0416-47dd-a79a-ff9a44092dc3/6875e81a-f01d-4938-a299-03bb7af0bcc5.webp" },
  { id: "1d68928a-d8fa-4cbf-a956-a1c3355c8c82", url: "10dec6ee-0416-47dd-a79a-ff9a44092dc3/1d68928a-d8fa-4cbf-a956-a1c3355c8c82.webp" },
  { id: "fbbcc5b5-ac14-41b6-aa44-d5f61295b427", url: "10dec6ee-0416-47dd-a79a-ff9a44092dc3/fbbcc5b5-ac14-41b6-aa44-d5f61295b427.webp" },
  { id: "f1d8f6ac-cf53-4624-942f-264f4c549828", url: "10dec6ee-0416-47dd-a79a-ff9a44092dc3/f1d8f6ac-cf53-4624-942f-264f4c549828.webp" },
  { id: "39039ae3-17f6-4914-85fc-6d62a973e4fd", url: "10dec6ee-0416-47dd-a79a-ff9a44092dc3/39039ae3-17f6-4914-85fc-6d62a973e4fd.webp" },
  { id: "0690dfd0-0123-49ba-80f1-5e63e2f6e17c", url: "10dec6ee-0416-47dd-a79a-ff9a44092dc3/0690dfd0-0123-49ba-80f1-5e63e2f6e17c.webp" },
];

let ok = 0;
let skipped = 0;
let failed = 0;

for (const img of images) {
  const path = extractPath(img.url);
  if (!path) {
    console.log(`SKIP ${img.id}: cannot extract path`);
    skipped++;
    continue;
  }

  const thumbPath = getThumbPath(path);
  const contentType = path.endsWith(".jpg") ? "image/jpeg" : "image/webp";

  // Check if already in R2
  if (await existsInR2(path)) {
    console.log(`SKIP ${img.id}: already in R2`);
    skipped++;
    continue;
  }

  // Download original from Supabase
  const original = await downloadFromSupabase(path);
  if (!original) {
    console.log(`FAIL ${img.id}: download failed for ${path}`);
    failed++;
    continue;
  }

  // Upload original to R2
  await uploadToR2(path, original, contentType);
  console.log(`  OK ${img.id}: ${path} (${(original.length / 1024).toFixed(1)} KB)`);

  // Try to download and upload thumbnail
  const thumb = await downloadFromSupabase(thumbPath);
  if (thumb) {
    await uploadToR2(thumbPath, thumb, contentType);
    console.log(`  OK ${img.id}: ${thumbPath} (${(thumb.length / 1024).toFixed(1)} KB)`);
  } else {
    console.log(`WARN ${img.id}: no thumbnail at ${thumbPath}`);
  }

  ok++;
}

console.log(`\nDone: ${ok} migrated, ${skipped} skipped, ${failed} failed`);
