import RoleGuard from "@/components/auth/RoleGuard";

export default function CompanionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRole="companion">
      <div className="flex bg-stitch-background text-stitch-on-surface">
        {/* navbar */}
        <aside></aside> {/* شيل دي وحط navbar component */}
        <main className="flex-1">{children}</main>
      </div>
    </RoleGuard>
  );
}
