import RoleGuard from "@/components/auth/RoleGuard";
import Sidebar, { SidebarItem } from "@/components/layouts/Sidebar";

const navItems: SidebarItem[] = [
  { label: "Requests", href: "/companion/dashboard", icon: "pending_actions" },
  { label: "Bookings", href: "/companion/bookings", icon: "event_available" },
  { label: "Calendar", href: "/companion/schedule", icon: "calendar_today" },
  { label: "Messages", href: "/companion/messages", icon: "chat_bubble" },
  { label: "Wallet", href: "/companion/wallet", icon: "wallet" },
  { label: "Profile", href: "/companion/profile", icon: "person" },
];

export default function CompanionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRole="companion">
      <div className="flex bg-stitch-background text-stitch-on-surface min-h-screen">
        <Sidebar 
          title="Dignified Care"
          subtitle="Care Dashboard"
          navItems={navItems}
        />
        <main className="flex-1 p-8 h-screen overflow-y-auto bg-[#fcf9f6]/40">
          {children}
        </main>
      </div>
    </RoleGuard>
  );
}
