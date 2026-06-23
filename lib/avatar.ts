export function getAvatarUrl(avatar: any, defaultAvatar?: string): string | null {
  if (!avatar) return defaultAvatar || null;
  if (typeof avatar === "string") return avatar;
  if (typeof avatar === "object" && avatar.url) return avatar.url;
  return defaultAvatar || null;
}
