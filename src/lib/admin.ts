import "server-only";

// Admin権限を持つユーザーID
// こっぺさん・みおさんのみ管理ページにアクセス可能
const ADMIN_USER_IDS = [
  "751ac531-dcdb-4e77-a3ea-67a01677c432", // みお
];

export function isAdmin(userId: string): boolean {
  return ADMIN_USER_IDS.includes(userId);
}
