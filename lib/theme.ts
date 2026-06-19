export const themeModes = ["light", "dark", "system"] as const;

export type ThemeMode = (typeof themeModes)[number];

export function isThemeMode(value: string | undefined): value is ThemeMode {
  return themeModes.some((theme) => theme === value);
}
