export default function HowItWorks() {
  return (
    <section className="py-24 bg-stitch-surface px-margin-mobile md:px-margin-desktop font-stitch-body" id="how-it-works">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-stitch-on-surface mb-4 font-stitch-display">How Sanad Works</h2>
          <p className="text-stitch-on-surface-variant max-w-2xl mx-auto">Getting dignified care is simple and secure. Follow these three steps to get started.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          {/* Step 1 */}
          <div className="flex flex-col items-center text-center group">
            <div className="w-20 h-20 bg-stitch-primary/10 text-stitch-primary rounded-2xl flex items-center justify-center mb-6 group-hover:bg-stitch-primary group-hover:text-stitch-on-primary transition-all duration-300">
              <span className="material-symbols-outlined text-[40px]">person_search</span>
            </div>
            <h3 className="text-xl font-bold mb-3 font-stitch-display text-stitch-on-surface">1. Find Your Match</h3>
            <p className="text-stitch-on-surface-variant">Browse detailed profiles of caregivers in your area. Filter by specialty, experience, and ratings.</p>
          </div>
          
          {/* Step 2 */}
          <div className="flex flex-col items-center text-center group">
            <div className="w-20 h-20 bg-stitch-primary/10 text-stitch-primary rounded-2xl flex items-center justify-center mb-6 group-hover:bg-stitch-primary group-hover:text-stitch-on-primary transition-all duration-300">
              <span className="material-symbols-outlined text-[40px]">calendar_month</span>
            </div>
            <h3 className="text-xl font-bold mb-3 font-stitch-display text-stitch-on-surface">2. Request Care</h3>
            <p className="text-stitch-on-surface-variant">Schedule an introductory meeting or book care directly through our secure booking system.</p>
          </div>
          
          {/* Step 3 */}
          <div className="flex flex-col items-center text-center group">
            <div className="w-20 h-20 bg-stitch-primary/10 text-stitch-primary rounded-2xl flex items-center justify-center mb-6 group-hover:bg-stitch-primary group-hover:text-stitch-on-primary transition-all duration-300">
              <span className="material-symbols-outlined text-[40px]">volunteer_activism</span>
            </div>
            <h3 className="text-xl font-bold mb-3 font-stitch-display text-stitch-on-surface">3. Receive Care</h3>
            <p className="text-stitch-on-surface-variant">Receive professional support in the comfort of home. Payment and tracking are handled in-app.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
