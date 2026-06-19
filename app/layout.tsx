import type { Metadata } from "next";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { Literata, Be_Vietnam_Pro, Noto_Sans_Arabic, Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import AuthInit from "@/components/auth/AuthInit";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { isThemeMode } from "@/lib/theme";

const literata = Literata({
  variable: "--font-literata",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam-pro",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const notoArabic = Noto_Sans_Arabic({
  variable: "--font-noto-arabic",
  subsets: ["arabic"],
  weight: ["400", "600", "700"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Sanad | Companion Care",
  description: "Connecting families with professional companions to ensure dignity, warmth, and specialized care at home.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = await getLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";
  const themeCookie = cookieStore.get("sanad-theme")?.value;
  const theme = isThemeMode(themeCookie) ? themeCookie : "light";
  const resolvedTheme = theme === "dark" ? "dark" : "light";

  return (
    <html
      lang={locale}
      dir={dir}
      data-theme={resolvedTheme}
      data-theme-mode={theme}
      suppressHydrationWarning
      className={`${literata.variable} ${beVietnamPro.variable} ${notoArabic.variable} ${plusJakartaSans.variable} ${inter.variable} h-full antialiased`}
    >
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
      </head>
      <body className="min-h-full flex flex-col bg-sand text-stitch-on-surface font-body">
        <NextIntlClientProvider>
          <ThemeProvider initialTheme={theme}>
            <AuthInit />
            {children}
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
