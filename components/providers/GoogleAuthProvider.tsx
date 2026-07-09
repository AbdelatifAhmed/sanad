"use client";

import type { ReactNode } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";

const clientId =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  "542081770205-vt7vuo4u66v9rlphbjj3fn7m073pcugr.apps.googleusercontent.com";

export default function GoogleAuthProvider({ children }: { children: ReactNode }) {
  return <GoogleOAuthProvider clientId={clientId}>{children}</GoogleOAuthProvider>;
}
