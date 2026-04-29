/**
 * 招待コード個別発行スクリプト
 *
 * Usage:
 *   node scripts/issue-invitation-code.mjs --label "ベータ配布:鈴木様" --max-uses 1 --expires-in-days 30
 *
 * 環境変数:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * 出力: 標準出力に発行されたコードを 1 行で表示
 */

import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";

function parseArgs(argv) {
  const args = { label: null, maxUses: 1, expiresInDays: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--label") args.label = argv[++i];
    else if (a === "--max-uses") args.maxUses = Number(argv[++i]);
    else if (a === "--expires-in-days") args.expiresInDays = Number(argv[++i]);
    else if (a === "--help" || a === "-h") {
      console.log(
        "Usage: node scripts/issue-invitation-code.mjs --label <text> [--max-uses N] [--expires-in-days N]"
      );
      process.exit(0);
    } else {
      console.error(`Unknown argument: ${a}`);
      process.exit(2);
    }
  }
  return args;
}

function generateCode() {
  return randomBytes(8).toString("base64url").toUpperCase().replace(/[_-]/g, "X");
}

async function main() {
  const args = parseArgs(process.argv);

  if (!Number.isFinite(args.maxUses) || args.maxUses < 0) {
    console.error("--max-uses must be a non-negative integer (0 = unlimited)");
    process.exit(2);
  }

  let expiresAt = null;
  if (args.expiresInDays !== null) {
    if (!Number.isFinite(args.expiresInDays) || args.expiresInDays <= 0) {
      console.error("--expires-in-days must be a positive integer");
      process.exit(2);
    }
    expiresAt = new Date(Date.now() + args.expiresInDays * 24 * 60 * 60 * 1000).toISOString();
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const code = generateCode();

  const { data, error } = await supabase
    .from("invitation_codes")
    .insert({
      code,
      label: args.label,
      max_uses: args.maxUses,
      expires_at: expiresAt,
    })
    .select("code, max_uses, expires_at")
    .single();

  if (error) {
    console.error("Failed to insert invitation code:", error.message);
    process.exit(1);
  }

  console.log(JSON.stringify(data, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
