-- 003: 医薬部外品（有効成分）サポート
-- products テーブルに医薬部外品フラグと有効成分IDsを追加
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_quasi_drug BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS active_ingredient_ids TEXT[] DEFAULT '{}';

-- ingredient_cache テーブルに医薬部外品情報を追加
ALTER TABLE ingredient_cache
  ADD COLUMN IF NOT EXISTS is_quasi_drug BOOLEAN,
  ADD COLUMN IF NOT EXISTS active_ingredients TEXT;
