-- 製品に最終使用日と購入日のカラムを追加
ALTER TABLE products ADD COLUMN IF NOT EXISTS last_used_at timestamptz;
ALTER TABLE products ADD COLUMN IF NOT EXISTS purchased_at timestamptz;
