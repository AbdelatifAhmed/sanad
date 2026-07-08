import GoogleAuthProvider from "@/components/providers/GoogleAuthProvider";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <GoogleAuthProvider>{children}</GoogleAuthProvider>;
}
