-- X連携廃止に伴い、X関連テーブル・関数を削除
-- 実行前にバックアップを取ること

-- ツイート制限チェック関数を削除
DROP FUNCTION IF EXISTS check_daily_tweet_limit(UUID, INT);

-- ツイートログテーブルを削除
DROP TABLE IF EXISTS x_tweet_log;

-- X認証トークンテーブルを削除
DROP TABLE IF EXISTS x_auth_tokens;
