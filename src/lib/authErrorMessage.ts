const AUTH_ERROR_MAP: Array<{ pattern: RegExp; message: string }> = [
  {
    pattern: /email not confirmed/i,
    message: "確認メールの認証が完了していません。メールを確認してください。",
  },
  {
    pattern: /invalid login credentials/i,
    message: "メールアドレスまたはパスワードが正しくありません。",
  },
  {
    pattern: /user already registered/i,
    message: "このメールアドレスはすでに登録されています。ログインしてください。",
  },
  {
    pattern: /password should be at least/i,
    message: "パスワードは6文字以上で入力してください。",
  },
  {
    pattern: /unable to validate email address|invalid email/i,
    message: "メールアドレスの形式が正しくありません。",
  },
  {
    pattern: /too many requests|rate limit|over_email_send_rate_limit/i,
    message: "試行回数が多すぎます。時間をおいて再試行してください。",
  },
  {
    pattern: /network request failed|failed to fetch/i,
    message: "通信に失敗しました。ネットワーク接続を確認してください。",
  },
];

export function toJaAuthErrorMessage(
  rawMessage: string | null | undefined,
  fallback = "処理に失敗しました。時間をおいて再試行してください。"
): string {
  if (!rawMessage) return fallback;

  const normalized = rawMessage.trim();
  for (const item of AUTH_ERROR_MAP) {
    if (item.pattern.test(normalized)) return item.message;
  }

  return fallback;
}
