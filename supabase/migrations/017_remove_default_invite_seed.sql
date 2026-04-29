-- ============================================================
-- 017: Deactivate default invitation code seeded by 008
-- ============================================================
--
-- 008_invitation_codes.sql で投入していた既定の招待コード
-- ('HADAMI-BETA-2026') を失効させる。
-- DELETE ではなく is_active=false にすることで、過去にこのコードで
-- 招待された pending_invite_claims / 監査ログとの整合性を保つ。
--
-- 個別配布が必要な場合は scripts/issue-invitation-code.ts を使用すること。

update public.invitation_codes
set is_active = false,
    expires_at = coalesce(expires_at, now())
where code = 'HADAMI-BETA-2026';

-- 失効コードを掴んだままの未消費 pending claim をクリーンアップ
delete from public.pending_invite_claims
where invitation_code_id in (
  select id from public.invitation_codes where code = 'HADAMI-BETA-2026'
);
