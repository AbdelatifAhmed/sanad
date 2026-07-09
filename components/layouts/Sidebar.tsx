"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { AuthState } from "@/types";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/store/authStore";
import { useSocket } from "@/components/providers/SocketProvider";

import { logoutUser } from "@/lib/API";
import { api } from "@/lib/services/api";
import { getAvatarUrl } from "@/lib/avatar";

// ── Types ───────────────────────────────────────────────────────────────────

type NavLabelKey =
  | "dashboard"
  | "browse"
  | "myPosts"
  | "requests"
  | "bookings"
  | "availablePost"
  | "calendar"
  | "messages"
  | "wallet"
  | "profile"
  | "settings"
  | "applications"
  | "activeShift"
  | "notifications"
  | "contactAdmin";

type AppLabelKey = "name" | "familyDashboard" | "careDashboard";

export interface SidebarItem {
  label?: string;
  labelKey?: NavLabelKey;
  href: string;
  icon: string;
}

interface SidebarProps {
  title?: string;
  subtitle?: string;
  titleKey?: AppLabelKey;
  subtitleKey?: AppLabelKey;
  navItems: SidebarItem[];
}

interface InAppToast {
  id: string;
  title: string;
  message: string;
  type: "warning" | "info" | "danger";
}

// ── Component ────────────────────────────────────────────────────────────────

export default function Sidebar({
  title = "Dignified Care",
  subtitle = "Care Dashboard",
  titleKey,
  subtitleKey,
  navItems,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const tNav = useTranslations("nav");
  const tApp = useTranslations("app");
  const clearAuth = useAuthStore((state: AuthState) => state.clearAuth);
  const user = useAuthStore((state: any) => state.user);
  const { socket } = useSocket();

  const [menuOpen, setMenuOpen] = useState(false);
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);

  // ── Notification Badge ───────────────────────────────────────────────────
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const toastTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // ── In-App Warning Toasts ────────────────────────────────────────────────
  const [toasts, setToasts] = useState<InAppToast[]>([]);

  const addToast = useCallback((toast: Omit<InAppToast, "id">) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [{ ...toast, id }, ...prev].slice(0, 4)); // max 4 visible

    // Auto-dismiss after 7 seconds
    const timeout = setTimeout(() => {
      dismissToast(id);
    }, 7000);
    toastTimeouts.current.set(id, timeout);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const t = toastTimeouts.current.get(id);
    if (t) {
      clearTimeout(t);
      toastTimeouts.current.delete(id);
    }
  }, []);

  // ── Fetch Unread Count ───────────────────────────────────────────────────
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get("/notifications?limit=1");
      const total: number = res?.data?.data?.unreadCount ?? 0;
      setUnreadCount(total);
    } catch {
      // silently fail — not critical UI
    }
  }, [user]);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount, pathname]);

  // ── Socket.IO: new_notification listener ────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (data: any) => {
      // Bump unread badge
      setUnreadCount((prev) => prev + 1);

      // Determine if this is a Guardian AI warning (type = 'warning' or body contains AI/complaint)
      const isAiWarning =
        data?.type === "warning" ||
        data?.type === "complaint" ||
        data?.title?.toLowerCase().includes("guardian") ||
        data?.title?.toLowerCase().includes("warning") ||
        data?.title?.toLowerCase().includes("complaint");

      const toastType: InAppToast["type"] = isAiWarning
        ? "warning"
        : data?.type === "danger"
        ? "danger"
        : "info";

      addToast({
        title: data?.title || "New Notification",
        message: data?.body || data?.message || "",
        type: toastType,
      });
    };

    socket.on("new_notification", handleNewNotification);
    // Also listen for AI-specific alert channels
    socket.on("newComplaintAlert", (data: any) => {
      addToast({
        title: "Guardian AI Alert",
        message: data?.message || "A new booking complaint has been flagged for review.",
        type: "warning",
      });
      setUnreadCount((prev) => prev + 1);
    });

    socket.on("newSecurityAlert", (data: any) => {
      addToast({
        title: "Guardian AI — Chat Flag",
        message: data?.message || "Suspicious conversation activity detected.",
        type: "danger",
      });
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      socket.off("new_notification", handleNewNotification);
      socket.off("newComplaintAlert");
      socket.off("newSecurityAlert");
    };
  }, [socket, addToast]);

  // ── Active Booking (Companion) ───────────────────────────────────────────
  useEffect(() => {
    if (user && user.role === "companion") {
      api
        .get("/bookings/my?status=active&limit=1")
        .then((res) => {
          if (res.data?.data?.bookings?.length > 0) {
            setActiveBookingId(res.data.data.bookings[0]._id);
          } else {
            return api.get("/bookings/my?status=approved&limit=1");
          }
        })
        .then((res: any) => {
          if (res?.data?.data?.bookings?.length > 0) {
            setActiveBookingId(res.data.data.bookings[0]._id);
          }
        })
        .catch((err: any) => {
          console.error("Error fetching active bookings for sidebar:", err);
        });
    }
  }, [user, pathname]);

  // ── Menu close on outside click ──────────────────────────────────────────
  useEffect(() => {
    if (!menuOpen) return;
    const closeMenu = () => setMenuOpen(false);
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, [menuOpen]);

  // Cleanup toast timers on unmount
  useEffect(() => {
    return () => {
      toastTimeouts.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleLogout = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await logoutUser();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearAuth();
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/login");
    }
  };

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(!menuOpen);
  };

  const isCompanion = pathname.startsWith("/companion");
  const rolePrefix = isCompanion ? "/companion" : "/family";

  const resolveNavItem = (item: SidebarItem) => {
    let resolvedHref = item.href;
    let isActive =
      pathname === item.href ||
      (item.href !== "/" && pathname.startsWith(item.href + "/"));

    if (item.labelKey === "activeShift") {
      if (activeBookingId) {
        resolvedHref = `/companion/shift/${activeBookingId}`;
        isActive = pathname.startsWith(`/companion/shift/${activeBookingId}`);
      } else {
        resolvedHref = "/companion/shift";
        isActive = pathname === "/companion/shift" || pathname.startsWith("/companion/shift/");
      }
    }

    return { href: resolvedHref, isActive };
  };

  const resolvedTitle = titleKey ? tApp(titleKey) : title;
  const resolvedSubtitle = subtitleKey ? tApp(subtitleKey) : subtitle;

  // ── Toast color helpers ───────────────────────────────────────────────────
  const toastBg = (type: InAppToast["type"]) => {
    if (type === "danger")  return "bg-red-600";
    if (type === "warning") return "bg-amber-500";
    return "bg-indigo-600";
  };
  const toastIcon = (type: InAppToast["type"]) => {
    if (type === "danger")  return "gpp_bad";
    if (type === "warning") return "warning";
    return "notifications";
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── In-App Warning Toast Stack ──────────────────────────────────── */}
      <div
        className="fixed top-4 end-4 z-[9999] flex flex-col gap-2 pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-start gap-3 px-4 py-3 rounded-2xl shadow-xl text-white min-w-[280px] max-w-[360px] pointer-events-auto animate-slide-in-right ${toastBg(toast.type)}`}
            style={{ animation: "slideInRight 0.35s ease" }}
          >
            <span className="material-symbols-outlined text-lg mt-0.5 shrink-0">
              {toastIcon(toast.type)}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black leading-tight">{toast.title}</p>
              {toast.message && (
                <p className="text-[11px] font-medium opacity-90 mt-0.5 leading-snug line-clamp-2">
                  {toast.message}
                </p>
              )}
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-white/70 hover:text-white transition-colors cursor-pointer mt-0.5 shrink-0"
              aria-label="Dismiss"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        ))}
      </div>

      {/* ── Desktop Sidebar ─────────────────────────────────────────────── */}
      <aside className="hidden md:flex w-72 bg-stitch-surface flex-col border-s border-stitch-outline/20 h-screen sticky top-0 font-stitch-body select-none shrink-0">
        <div className="p-8 pb-6">
          <h1 className="text-2xl font-stitch-display font-bold text-primary tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            {resolvedTitle}
          </h1>
          <p className="text-xs font-medium text-stitch-on-surface-variant/60 mt-1 uppercase tracking-wider">
            {resolvedSubtitle}
          </p>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const { href, isActive } = resolveNavItem(item);
            const isNotifications = item.labelKey === "notifications";

            return (
              <Link
                key={item.href}
                href={href}
                onClick={() => {
                  if (isNotifications) setUnreadCount(0);
                }}
                className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 font-medium group ${
                  isActive
                    ? "bg-stitch-secondary-container text-stitch-on-secondary-container font-semibold"
                    : "text-stitch-on-surface/80 hover:bg-stitch-secondary-container/10 hover:text-stitch-on-secondary-container"
                }`}
              >
                <span
                  className={`material-symbols-outlined text-2xl transition-colors ${
                    isActive
                      ? "text-stitch-on-secondary-container [font-variation-settings:'FILL'_1]"
                      : "text-stitch-on-surface/60 group-hover:text-stitch-on-secondary-container"
                  }`}
                >
                  {item.icon}
                </span>
                <span className="text-sm tracking-wide flex-1">
                  {item.labelKey ? tNav(item.labelKey) : item.label}
                </span>
                {/* Unread badge on notifications nav item */}
                {isNotifications && unreadCount > 0 && (
                  <span className="flex items-center justify-center min-w-[20px] h-5 rounded-full bg-red-500 text-white text-[10px] font-black px-1.5 shadow-sm animate-pulse">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-stitch-outline/10 relative">
          {menuOpen && (
            <div
              className="absolute bottom-24 start-4 end-4 bg-stitch-surface border border-stitch-outline/20 rounded-2xl p-2 shadow-premium z-50 animate-fade-in flex flex-col gap-0.5"
              onClick={(e) => e.stopPropagation()}
            >
              <Link
                href={`${rolePrefix}/settings`}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-stitch-secondary-container/15 text-stitch-on-surface hover:text-stitch-on-secondary-container text-sm font-medium transition-colors"
              >
                <span className="material-symbols-outlined text-xl">settings</span>
                <span>{tNav("settings")}</span>
              </Link>
              <Link 
                href={`${rolePrefix}/support`} 
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-stitch-secondary-container/15 text-stitch-on-surface hover:text-stitch-on-secondary-container text-sm font-medium transition-colors"
              >
                <span className="material-symbols-outlined text-xl">support_agent</span>
                <span>{tNav("contactAdmin")}</span>
              </Link>
              <div className="h-px bg-stitch-outline/10 my-1" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 text-red-600 hover:text-red-700 text-sm font-semibold transition-colors text-start cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl text-red-500">logout</span>
                <span>{tNav("logout")}</span>
              </button>
            </div>
          )}

          <div
            onClick={toggleMenu}
            className="flex items-center gap-3 cursor-pointer hover:bg-stitch-secondary-container/10 p-2 -m-2 rounded-2xl transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-stitch-primary/10 flex items-center justify-center text-stitch-primary shrink-0 overflow-hidden">
              {getAvatarUrl(user?.avatar) ? (
                <img 
                  src={getAvatarUrl(user?.avatar)!} 
                  alt={user?.name || tNav("userAccount")}
                  className="w-10 h-10 rounded-full object-cover"
                  draggable={false}
                />
              ) : (
                <span className="material-symbols-outlined">person</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-stitch-on-surface truncate">
                {user?.name || tNav("userAccount")}
              </p>
              <p className="text-xs text-stitch-on-surface-variant/60 truncate">
                {user?.email || "user@sanad.com"}
              </p>
            </div>
            <span
              className="material-symbols-outlined text-stitch-on-surface-variant/50 text-lg transition-transform duration-200 rtl:-rotate-180"
              style={{ transform: menuOpen ? "rotate(180deg)" : "none" }}
            >
              expand_less
            </span>
          </div>
        </div>
      </aside>

      {/* ── Mobile Bottom Nav ───────────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-stitch-surface border-t border-stitch-outline/20 flex items-center z-40 px-2 font-stitch-body select-none">
        <div className="flex-1 flex justify-around h-full items-center py-1.5">
          {navItems.slice(0, 4).map((item) => {
            const { href, isActive } = resolveNavItem(item);
            const isNotifications = item.labelKey === "notifications";

            return (
              <Link
                key={item.href}
                href={href}
                onClick={() => {
                  if (isNotifications) setUnreadCount(0);
                }}
                className={`relative flex flex-col items-center justify-center min-w-[64px] h-full gap-0.5 transition-colors shrink-0 ${
                  isActive
                    ? "text-stitch-primary"
                    : "text-stitch-on-surface/60 hover:text-stitch-primary"
                }`}
              >
                <span
                  className={`material-symbols-outlined text-2xl ${
                    isActive ? "[font-variation-settings:'FILL'_1]" : ""
                  }`}
                >
                  {item.icon}
                </span>
                {isNotifications && unreadCount > 0 && (
                  <span className="absolute top-2 end-3 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center px-1 shadow-sm">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
                <span className="text-[10px] font-semibold tracking-tight">
                  {item.labelKey ? tNav(item.labelKey) : item.label}
                </span>
              </Link>
            );
          })}
        </div>

        <div className="w-px h-8 bg-stitch-outline/20 shrink-0 mx-1" />

        <div className="relative flex items-center justify-center shrink-0 w-16 h-full">
          {menuOpen && (
            <div
              className="absolute bottom-20 end-2 bg-stitch-surface border border-stitch-outline/20 rounded-2xl p-2 shadow-premium z-50 animate-fade-in flex flex-col gap-0.5 w-48"
              onClick={(e) => e.stopPropagation()}
            >
              {navItems.slice(4).map((item) => {
                const { href, isActive } = resolveNavItem(item);
                const isNotifications = item.labelKey === "notifications";

                return (
                  <Link
                    key={item.href}
                    href={href}
                    onClick={() => {
                      if (isNotifications) setUnreadCount(0);
                    }}
                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm font-medium ${
                      isActive
                        ? "bg-stitch-secondary-container text-stitch-on-secondary-container font-semibold"
                        : "text-stitch-on-surface hover:text-stitch-on-secondary-container hover:bg-stitch-secondary-container/15"
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {item.icon}
                    </span>
                    <span>{item.labelKey ? tNav(item.labelKey) : item.label}</span>
                    {isNotifications && unreadCount > 0 && (
                      <span className="ms-auto min-w-[18px] h-4.5 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center px-1 shadow-sm">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </Link>
                );
              })}

              {navItems.length > 4 && (
                <div className="h-px bg-stitch-outline/10 my-1" />
              )}

              <Link
                href={`${rolePrefix}/settings`}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-stitch-secondary-container/15 text-stitch-on-surface hover:text-stitch-on-secondary-container text-sm font-medium transition-colors"
              >
                <span className="material-symbols-outlined text-lg">settings</span>
                <span>{tNav("settings")}</span>
              </Link>
              <Link 
                href={`${rolePrefix}/support`} 
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-stitch-secondary-container/15 text-stitch-on-surface hover:text-stitch-on-secondary-container text-sm font-medium transition-colors"
              >
                <span className="material-symbols-outlined text-lg">support_agent</span>
                <span>{tNav("contactAdmin")}</span>
              </Link>
              <div className="h-px bg-stitch-outline/10 my-1" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 text-red-600 hover:text-red-700 text-sm font-semibold transition-colors text-start cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg text-red-500">logout</span>
                <span>{tNav("logout")}</span>
              </button>
            </div>
          )}

          <button
            onClick={toggleMenu}
            className={`flex flex-col items-center justify-center w-full h-full gap-0.5 transition-colors focus:outline-none cursor-pointer ${
              menuOpen
                ? "text-stitch-primary"
                : "text-stitch-on-surface/60 hover:text-stitch-primary"
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-stitch-primary/10 flex items-center justify-center text-stitch-primary shrink-0 overflow-hidden">
              {getAvatarUrl(user?.avatar) ? (
                <img 
                  src={getAvatarUrl(user?.avatar)!} 
                  alt={user?.name || tNav("userAccount")}
                  className="w-8 h-8 rounded-full object-cover"
                  draggable={false}
                />
              ) : (
                <span className="material-symbols-outlined text-xl">person</span>
              )}
            </div>
            <span className="text-[10px] font-semibold tracking-tight">
              {tNav("account")}
            </span>
          </button>
        </div>
      </nav>

      {/* Slide-in animation keyframe (injected inline) */}
      <style jsx global>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(100%); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
