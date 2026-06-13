export default function TrustSafety() {
  return (
    <section className="py-24 bg-stitch-on-surface text-white px-margin-mobile md:px-margin-desktop font-stitch-body">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
        <div className="flex-1">
          <h2 className="text-4xl font-bold mb-8 font-stitch-display">Safety is Our Top Priority</h2>
          <div className="space-y-6">
            {/* Safety Point 1 */}
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-stitch-primary/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-stitch-primary">fingerprint</span>
              </div>
              <div>
                <h4 className="font-bold text-lg mb-1 font-stitch-display">Identity Verification</h4>
                <p className="text-white/70 text-sm">We verify government IDs for every single profile on our platform.</p>
              </div>
            </div>

            {/* Safety Point 2 */}
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-stitch-primary/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-stitch-primary">policy</span>
              </div>
              <div>
                <h4 className="font-bold text-lg mb-1 font-stitch-display">Insurance & Protection</h4>
                <p className="text-white/70 text-sm">Caregivers are encouraged to maintain professional liability insurance for added protection.</p>
              </div>
            </div>

            {/* Safety Point 3 */}
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-stitch-primary/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-stitch-primary">chat</span>
              </div>
              <div>
                <h4 className="font-bold text-lg mb-1 font-stitch-display">Safe Communication</h4>
                <p className="text-white/70 text-sm">All initial interactions stay on-platform to protect your privacy and security.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Card Mockup */}
        <div className="flex-1 bg-white/5 p-8 rounded-[32px] border border-white/10 w-full max-w-md">
          <div className="bg-white rounded-2xl p-6 text-stitch-on-surface shadow-premium max-w-sm mx-auto">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-stitch-secondary-container"></div>
              <div className="flex-1">
                <div className="h-4 w-32 bg-stitch-on-surface/5 rounded mb-2"></div>
                <div className="h-3 w-20 bg-stitch-on-surface/5 rounded"></div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="h-3 w-full bg-stitch-on-surface/5 rounded"></div>
              <div className="h-3 w-full bg-stitch-on-surface/5 rounded"></div>
              <div className="h-3 w-2/3 bg-stitch-on-surface/5 rounded"></div>
            </div>
            
            <div className="mt-6 flex items-center justify-between border-t border-stitch-outline/10 pt-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-stitch-primary fill text-sm">verified</span>
                <span className="text-xs font-bold text-stitch-primary uppercase font-stitch-display">Verified Profile</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-yellow-500 fill text-xs">star</span>
                <span className="text-xs font-bold font-stitch-display">5.0</span>
              </div>
            </div>
          </div>
          <p className="text-center mt-6 text-white/50 text-xs uppercase tracking-widest font-bold font-stitch-display">Example Caregiver Profile</p>
        </div>
      </div>
    </section>
  );
}
