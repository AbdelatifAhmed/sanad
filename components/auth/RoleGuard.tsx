"use client";

import { useEffect, useState } from "react";
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
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (user && user.role !== allowedRole) {
      router.replace(fallbackPath ?? `/${user.role}`);
    }
  }, [isHydrated, isAuthenticated, user, allowedRole, router, fallbackPath]);

  if (!isHydrated || !isAuthenticated || !user || user.role !== allowedRole) {
    return null;
  }

  return <>{children}</>;
}
