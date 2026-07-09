export function getAvatarUrl(avatar: unknown, defaultAvatar?: string): string | null {
  let url: string | null = null;

  if (!avatar) {
    url = defaultAvatar || null;
  } else if (typeof avatar === "string") {
    url = avatar;
  } else if (
    typeof avatar === "object" &&
    avatar !== null &&
    "url" in avatar &&
    typeof (avatar as { url: unknown }).url === "string"
  ) {
    url = (avatar as { url: string }).url;
  } else {
    url = defaultAvatar || null;
  }

  if (!url?.trim()) return null;

  const trimmed = url.trim();
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("/")
  ) {
    return trimmed;
  }

  return defaultAvatar || null;
}
