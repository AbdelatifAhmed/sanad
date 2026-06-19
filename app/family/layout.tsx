import RoleGuard from "@/components/auth/RoleGuard";
import Sidebar, { SidebarItem } from "@/components/layouts/Sidebar";

const navItems: SidebarItem[] = [
  { labelKey: "dashboard", href: "/family/dashboard", icon: "home" },
  { labelKey: "browse", href: "/family/companions", icon: "manage_search" },
  { labelKey: "myPosts", href: "/family/requests", icon: "pending_actions" },
  { labelKey: "bookings", href: "/family/bookings", icon: "event_available" },
  { labelKey: "calendar", href: "/family/schedule", icon: "calendar_today" },
  { labelKey: "messages", href: "/family/messages", icon: "chat_bubble" },
  { labelKey: "wallet", href: "/family/wallet", icon: "wallet" },
  { labelKey: "profile", href: "/family/profile", icon: "person" },
  { labelKey: "settings", href: "/family/settings", icon: "settings" },
];

export default function FamilyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRole="family">
      <div className="flex flex-col md:flex-row bg-stitch-background text-stitch-on-surface min-h-screen">
        <Sidebar 
          titleKey="name"
          subtitleKey="familyDashboard"
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
