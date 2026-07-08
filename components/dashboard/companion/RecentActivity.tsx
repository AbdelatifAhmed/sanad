import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { isNextRedirectError, serverFetch } from "@/lib/serverAuth";
import type { NotificationItem } from "@/types";

const activityStyles: Record<string, { icon: string; className: string }> = {
  booking: {
    icon: "event_available",
    className: "bg-[#aeedd5]/30 text-[#316d5b]",
  },
  chat: {
    icon: "chat_bubble",
    className: "bg-amber-100/40 text-amber-700",
  },
  payment: {
    icon: "payments",
    className: "bg-blue-100/50 text-blue-700",
  },
  review: {
    icon: "grade",
    className: "bg-purple-100/50 text-purple-700",
  },
  default: {
    icon: "notifications",
    className: "bg-stitch-primary/10 text-stitch-primary",
  },
};

const formatRelativeTime = (createdAt: string | Date | undefined, locale: string) => {
  if (!createdAt) return "";
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const rtf = new Intl.RelativeTimeFormat(locale === "ar" ? "ar-EG" : "en-US", { numeric: "auto" });
  const minutes = Math.round(diffMs / 60000);
  if (Math.abs(minutes) < 60) return rtf.format(-minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return rtf.format(-hours, "hour");
  return rtf.format(-Math.round(hours / 24), "day");
};

export async function RecentActivity() {
  const t = await getTranslations("companionDashboard");
  const locale = await getLocale();
  let notifications: NotificationItem[] = [];

  try {
    const data = await serverFetch("/notifications?page=1&limit=4&unreadOnly=false", {
      headers: {
        "Accept-Language": locale,
      },
    });
    notifications = data.notifications || [];
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }
    console.error("Error loading recent activity:", error);
  }

  return (
    <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-stitch-outline/10 shadow-soft space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-bold uppercase tracking-wider text-stitch-on-surface-variant/50">
          {t("recentActivity")}
        </h3>
        <Link href="/companion/notifications" className="text-xs font-bold text-stitch-primary hover:underline">
          {t("viewAll")}
        </Link>
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-sm text-stitch-on-surface-variant/60 bg-gray-50/60 rounded-xl">
            {t("noRecentActivity")}
          </div>
        ) : (
          notifications.map((notification) => {
            const style = activityStyles[notification.type] || activityStyles.default;
            return (
              <div
                key={notification._id}
                className="flex items-center gap-4 p-3 hover:bg-stitch-secondary-container/5 rounded-xl transition-colors"
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${style.className}`}>
                  <span className="material-symbols-outlined text-xl">{style.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-stitch-on-surface truncate">{notification.title}</p>
                  <p className="text-xs text-stitch-on-surface-variant/75 truncate mt-0.5">{notification.message}</p>
                </div>
                <span className="text-[10px] text-stitch-on-surface-variant/50 shrink-0 self-start mt-0.5">
                  {formatRelativeTime(notification.createdAt, locale)}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
