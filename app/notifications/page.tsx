"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Loader2 } from "lucide-react";

export default function NotificationsRedirect() {
  const router = useRouter();
  const user = useAuthStore((state: any) => state.user);

  useEffect(() => {
    if (user) {
      if (user.role === "family") {
        router.replace("/family/notifications");
      } else if (user.role === "companion") {
        router.replace("/companion/notifications");
      } else {
        router.replace("/");
      }
    } else {
      router.replace("/login");
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-sand flex flex-col items-center justify-center p-6">
      <Loader2 className="w-12 h-12 text-[#1f8a8a] animate-spin" />
    </div>
  );
}
