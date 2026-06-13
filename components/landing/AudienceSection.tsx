import Link from "next/link";

export default function AudienceSection() {
  return (
    <section className="py-24 bg-stitch-background px-margin-mobile md:px-margin-desktop font-stitch-body">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* For Families */}
        <div className="bg-white p-12 rounded-[32px] shadow-soft flex flex-col justify-between hover:shadow-premium transition-shadow border border-stitch-outline/10">
          <div>
            <span className="text-stitch-primary font-bold tracking-widest text-xs uppercase mb-4 block">For Families</span>
            <h3 className="text-3xl font-bold mb-6 font-stitch-display text-stitch-on-surface">Peace of mind for you and your family</h3>
            <ul className="space-y-4 mb-10 text-stitch-on-surface-variant">
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-stitch-primary">check_circle</span>
                <span>Direct access to top-rated medical & companion care</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-stitch-primary">check_circle</span>
                <span>Flexible scheduling from hourly to 24/7 care</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-stitch-primary">check_circle</span>
                <span>Secure, transparent payment processing</span>
              </li>
            </ul>
          </div>
          <Link 
            className="bg-stitch-primary text-stitch-on-primary px-8 py-4 rounded-xl font-bold text-center inline-block hover:opacity-90 transition-opacity" 
            href="/register?type=family"
          >
            Start Your Search
          </Link>
        </div>

        {/* For Caregivers */}
        <div className="bg-stitch-on-surface text-white p-12 rounded-[32px] shadow-soft flex flex-col justify-between hover:shadow-premium transition-shadow">
          <div>
            <span className="text-stitch-primary font-bold tracking-widest text-xs uppercase mb-4 block">For Caregivers</span>
            <h3 className="text-3xl font-bold mb-6 font-stitch-display">Grow your professional care career</h3>
            <ul className="space-y-4 mb-10 text-white/80">
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-stitch-primary">check_circle</span>
                <span>Set your own rates and keep more of what you earn</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-stitch-primary">check_circle</span>
                <span>Choose your clients and manage your schedule</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-stitch-primary">check_circle</span>
                <span>Professional development & community support</span>
              </li>
            </ul>
          </div>
          <Link 
            className="bg-white text-stitch-on-surface px-8 py-4 rounded-xl font-bold text-center inline-block hover:bg-white/90 transition-colors" 
            href="/register?type=companion"
          >
            Join the Network
          </Link>
        </div>
      </div>
    </section>
  );
}
