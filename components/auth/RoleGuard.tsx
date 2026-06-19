"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export type Role = "family" | "companion";

export const familyRoutes: string[] = [
  "/family",
  "/family/dashboard",
  "/family/companions",
];

export const companionRoutes: string[] = [
  "/companion",
  "/companion/dashboard",
  "/companion/schedule",
];

interface RoleGuardProps {
  allowedRole: Role;
  children: React.ReactNode;
  fallbackPath?: string;
}

export default function RoleGuard({
  allowedRole,
  children,
  fallbackPath,
}: RoleGuardProps) {
  const router = useRouter();
  const user = useAuthStore((state: AuthState) => state.user);
  const isAuthenticated = useAuthStore((state: AuthState) => state.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (user && user.role !== allowedRole) {
      router.replace(fallbackPath ?? `/${user.role}/dashboard`);
    }
  }, [allowedRole, fallbackPath, isAuthenticated, router, user]);

  if (!isAuthenticated || !user) {
    return null;
  }

  if (user.role !== allowedRole) {
    return null;
  }

  return <>{children}</>;
}
