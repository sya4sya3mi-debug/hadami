export const ADMIN_IDS = [
  "751ac531-dcdb-4e77-a3ea-67a01677c432",
] as const;

export const ADMIN_NAV_ITEMS = [
  { href: "/admin/dashboard",           label: "ダッシュボード", icon: "📊" },
  { href: "/admin/users",               label: "ユーザー管理",   icon: "👥" },
  { href: "/admin/invites",             label: "招待コード",     icon: "🔑" },
  { href: "/admin/unknown-ingredients", label: "未識別成分",     icon: "🔬" },
] as const;

export function isAdminClient(userId: string): boolean {
  return (ADMIN_IDS as readonly string[]).includes(userId);
}
