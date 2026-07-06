import RoleGuard from "@/components/auth/RoleGuard";
import Sidebar, { SidebarItem } from "@/components/layouts/Sidebar";

const navItems: SidebarItem[] = [
  { labelKey: "dashboard", href: "/companion/dashboard", icon: "home" },
  { labelKey: "requests", href: "/companion/requests", icon: "pending_actions" },
  { labelKey: "availablePost", href: "/companion/bookings", icon: "event_available" },
  { labelKey: "applications", href: "/companion/applications", icon: "event_available" },
  { labelKey: "calendar", href: "/companion/schedule", icon: "calendar_today" },
  { labelKey: "messages", href: "/companion/messages", icon: "chat_bubble" },
  { labelKey: "activeShift", href: "/companion/shift", icon: "play_circle" },
  { labelKey: "wallet", href: "/companion/wallet", icon: "wallet" },
  { labelKey: "profile", href: "/companion/profile", icon: "person" },
  { label: "Contact Admin", href: "/companion/support", icon: "support_agent" },
];

export default function CompanionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRole="companion">
      <div className="flex flex-col md:flex-row bg-stitch-background text-stitch-on-surface min-h-screen">
        <Sidebar 
          titleKey="name"
          subtitleKey="careDashboard"
          navItems={navItems}
        />
        {/* Added pb-24 on mobile to prevent the bottom nav bar from covering main content */}
        <main className="flex-1 p-6 md:p-8 pb-24 md:pb-8 h-screen overflow-y-auto bg-sand/40">
          {children}
        </main>
      </div>
    </RoleGuard>
  );
}
