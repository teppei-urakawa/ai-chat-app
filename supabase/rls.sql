-- ============================================================
-- RLS（Row Level Security）ポリシー設定
-- ============================================================
--
-- 【実行方法】
-- Supabase ダッシュボード → SQL Editor → New Query に
-- このファイルの内容を貼り付けて「Run」してください。
--
-- ============================================================
-- RLSとは何か（初心者向け解説）
-- ============================================================
--
-- たとえ話: マンションのオートロック
--
-- ❌ RLSなし（鍵のないマンション）
--    誰でも好きな部屋に入れる。
--    アプリのコードにバグがあると、Aさんの会話をBさんが見られてしまう。
--
-- ✅ RLSあり（オートロック付きマンション）
--    自分の部屋（=自分のデータ）にしか入れない。
--    コードにバグがあっても、データベースレベルで強制的にブロックされる。
--
-- 【RLSで防げる脅威】
-- - アプリのバグによる意図しないデータ漏洩
-- - APIへの不正アクセスによる他人データの閲覧・改ざん
-- - 万が一 DATABASE_URL が流出した場合の被害最小化
--
-- 【重要な注意】
-- このアプリは postgres（管理者）ユーザーで接続しています。
-- Postgresの管理者はデフォルトでRLSを無視します。
-- そのため以下のポリシーは「Supabase のダッシュボードで
-- anon/authenticated ロールを使う場合」や、
-- 将来 Supabase クライアントライブラリに移行した場合に有効です。
--
-- 現状の防御はアプリコード（Hono ミドルウェアの userId チェック）が担っています。
-- このSQLはその「保険」として設定しておきます。
-- ============================================================


-- ============================================================
-- Step 1: RLS を有効化
-- ============================================================
-- 各テーブルの「鍵」を ON にする

ALTER TABLE conversations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages            ENABLE ROW LEVEL SECURITY;
ALTER TABLE users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_tokens ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- Step 2: conversations テーブルのポリシー
-- ============================================================
-- 「自分の会話（user_id が自分）しか触れない」

-- 自分の会話だけ見える
CREATE POLICY "自分の会話だけ閲覧可能"
  ON conversations FOR SELECT
  USING (user_id = current_setting('app.current_user_id', true)::text);

-- 自分のIDで会話を作成できる
CREATE POLICY "自分のIDで会話を作成できる"
  ON conversations FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id', true)::text);

-- 自分の会話だけ更新できる
CREATE POLICY "自分の会話だけ更新可能"
  ON conversations FOR UPDATE
  USING (user_id = current_setting('app.current_user_id', true)::text);

-- 自分の会話だけ削除できる
CREATE POLICY "自分の会話だけ削除可能"
  ON conversations FOR DELETE
  USING (user_id = current_setting('app.current_user_id', true)::text);


-- ============================================================
-- Step 3: messages テーブルのポリシー
-- ============================================================
-- 「自分の会話に紐づくメッセージしか触れない」

CREATE POLICY "自分の会話のメッセージだけ閲覧可能"
  ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE user_id = current_setting('app.current_user_id', true)::text
    )
  );

CREATE POLICY "自分の会話にメッセージを追加できる"
  ON messages FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE user_id = current_setting('app.current_user_id', true)::text
    )
  );

CREATE POLICY "自分の会話のメッセージだけ削除可能"
  ON messages FOR DELETE
  USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE user_id = current_setting('app.current_user_id', true)::text
    )
  );


-- ============================================================
-- Step 4: 認証テーブルのポリシー
-- ============================================================
-- Auth.js が管理するテーブル。アプリコードから直接触れないよう制限。

-- users: 自分のプロフィールだけ閲覧・更新可能
CREATE POLICY "自分のユーザー情報だけ閲覧可能"
  ON users FOR SELECT
  USING (id = current_setting('app.current_user_id', true)::text);

CREATE POLICY "自分のユーザー情報だけ更新可能"
  ON users FOR UPDATE
  USING (id = current_setting('app.current_user_id', true)::text);

-- accounts: 自分のOAuthアカウント情報だけ閲覧可能
CREATE POLICY "自分のアカウントだけ閲覧可能"
  ON accounts FOR SELECT
  USING (user_id = current_setting('app.current_user_id', true)::text);

-- sessions: 自分のセッションだけ閲覧可能
CREATE POLICY "自分のセッションだけ閲覧可能"
  ON sessions FOR SELECT
  USING (user_id = current_setting('app.current_user_id', true)::text);


-- ============================================================
-- 確認クエリ（実行後に設定が反映されているか確認）
-- ============================================================
SELECT
  tablename   AS "テーブル",
  rowsecurity AS "RLS有効"
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'conversations', 'messages', 'users',
    'accounts', 'sessions', 'verification_tokens'
  )
ORDER BY tablename;
