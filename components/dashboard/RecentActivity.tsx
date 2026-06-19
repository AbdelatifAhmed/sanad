import Link from "next/link";

export function RecentActivity() {
  return (
    <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-stitch-outline/10 shadow-soft space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-bold uppercase tracking-wider text-stitch-on-surface-variant/50">
          Recent Activity
        </h3>
        <Link href="/companion/dashboard" className="text-xs font-bold text-stitch-primary hover:underline">
          View All
        </Link>
      </div>

      <div className="space-y-3">
        {/* Activity 1 */}
        <div className="flex items-center gap-4 p-3 hover:bg-stitch-secondary-container/5 rounded-xl transition-colors">
          <div className="w-9 h-9 rounded-full bg-[#aeedd5]/30 flex items-center justify-center text-[#316d5b] shrink-0">
            <span className="material-symbols-outlined text-xl">check_circle</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-stitch-on-surface truncate">New Booking Confirmed</p>
            <p className="text-xs text-stitch-on-surface-variant/75 truncate mt-0.5">With patient Mrs. Clara Smith for Tomorrow, 10:00 AM</p>
          </div>
          <span className="text-[10px] text-stitch-on-surface-variant/50 shrink-0 self-start mt-0.5">2m ago</span>
        </div>

        {/* Activity 2 */}
        <div className="flex items-center gap-4 p-3 hover:bg-stitch-secondary-container/5 rounded-xl transition-colors">
          <div className="w-9 h-9 rounded-full bg-amber-100/40 flex items-center justify-center text-amber-700 shrink-0">
            <span className="material-symbols-outlined text-xl">chat_bubble</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-stitch-on-surface truncate">Message from John Doe</p>
            <p className="text-xs text-stitch-on-surface-variant/75 truncate italic mt-0.5">"Could we reschedule the medication checkup?"</p>
          </div>
          <span className="text-[10px] text-stitch-on-surface-variant/50 shrink-0 self-start mt-0.5">1h ago</span>
        </div>
      </div>
    </div>
  );
}
