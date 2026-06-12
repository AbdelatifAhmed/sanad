export default function WhyChoose() {
  return (
    <section className="py-24 bg-stitch-surface px-margin-mobile md:px-margin-desktop font-stitch-body" id="why-sanad">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-stitch-on-surface mb-4 font-stitch-display">Why Choose Sanad?</h2>
          <p className="text-stitch-on-surface-variant max-w-2xl mx-auto">We are building the world's most trusted community for home care.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="p-8 rounded-2xl bg-stitch-background hover:bg-stitch-primary/5 transition-colors group duration-300">
            <span className="material-symbols-outlined text-[32px] text-stitch-primary mb-4 block fill">verified_user</span>
            <h4 className="text-lg font-bold mb-2 font-stitch-display text-stitch-on-surface">Verified Caregivers</h4>
            <p className="text-stitch-on-surface-variant text-sm">Every caregiver undergoes rigorous ID and background checks.</p>
          </div>
          
          {/* Card 2 */}
          <div className="p-8 rounded-2xl bg-stitch-background hover:bg-stitch-primary/5 transition-colors group duration-300">
            <span className="material-symbols-outlined text-[32px] text-stitch-primary mb-4 block fill">lock</span>
            <h4 className="text-lg font-bold mb-2 font-stitch-display text-stitch-on-surface">Secure Chat</h4>
            <p className="text-stitch-on-surface-variant text-sm">Communicate safely through our encrypted messaging system.</p>
          </div>
          
          {/* Card 3 */}
          <div className="p-8 rounded-2xl bg-stitch-background hover:bg-stitch-primary/5 transition-colors group duration-300">
            <span className="material-symbols-outlined text-[32px] text-stitch-primary mb-4 block fill">event_available</span>
            <h4 className="text-lg font-bold mb-2 font-stitch-display text-stitch-on-surface">Easy Booking</h4>
            <p className="text-stitch-on-surface-variant text-sm">Seamlessly manage appointments and shifts with one tap.</p>
          </div>
          
          {/* Card 4 */}
          <div className="p-8 rounded-2xl bg-stitch-background hover:bg-stitch-primary/5 transition-colors group duration-300">
            <span className="material-symbols-outlined text-[32px] text-stitch-primary mb-4 block fill">groups</span>
            <h4 className="text-lg font-bold mb-2 font-stitch-display text-stitch-on-surface">Trusted Community</h4>
            <p className="text-stitch-on-surface-variant text-sm">A feedback-driven network ensuring the highest standards.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
