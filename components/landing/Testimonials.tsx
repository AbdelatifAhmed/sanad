export default function Testimonials() {
  return (
    <section className="py-24 bg-stitch-background overflow-hidden px-margin-mobile md:px-margin-desktop font-stitch-body" id="testimonials">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-stitch-on-surface text-center mb-16 font-stitch-display">Trusted by Families Everywhere</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Testimonial 1 */}
          <div className="bg-white p-8 rounded-2xl shadow-soft">
            <div className="flex gap-1 text-yellow-500 mb-4">
              <span className="material-symbols-outlined fill text-sm">star</span>
              <span className="material-symbols-outlined fill text-sm">star</span>
              <span className="material-symbols-outlined fill text-sm">star</span>
              <span className="material-symbols-outlined fill text-sm">star</span>
              <span className="material-symbols-outlined fill text-sm">star</span>
            </div>
            <p className="text-stitch-on-surface-variant mb-6">"Finding a post-op nurse through Sanad was incredibly easy. The quality of care was exceptional."</p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-stitch-primary/20 flex items-center justify-center font-bold text-stitch-primary font-stitch-display">JD</div>
              <div>
                <p className="font-bold text-sm text-stitch-on-surface">James D.</p>
                <p className="text-xs text-stitch-on-surface-variant">Family Member</p>
              </div>
            </div>
          </div>

          {/* Testimonial 2 - Highlighted */}
          <div className="bg-white p-8 rounded-2xl shadow-soft border-2 border-stitch-primary/20">
            <div className="flex gap-1 text-yellow-500 mb-4">
              <span className="material-symbols-outlined fill text-sm">star</span>
              <span className="material-symbols-outlined fill text-sm">star</span>
              <span className="material-symbols-outlined fill text-sm">star</span>
              <span className="material-symbols-outlined fill text-sm">star</span>
              <span className="material-symbols-outlined fill text-sm">star</span>
            </div>
            <p className="text-stitch-on-surface-variant mb-6">"As a professional nurse, Sanad gives me the flexibility I need while allowing me to connect with wonderful families."</p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-stitch-primary/20 flex items-center justify-center font-bold text-stitch-primary font-stitch-display">LW</div>
              <div>
                <p className="font-bold text-sm text-stitch-on-surface">Linda W.</p>
                <p className="text-xs text-stitch-on-surface-variant">RN & Caregiver</p>
              </div>
            </div>
          </div>

          {/* Testimonial 3 */}
          <div className="bg-white p-8 rounded-2xl shadow-soft">
            <div className="flex gap-1 text-yellow-500 mb-4">
              <span className="material-symbols-outlined fill text-sm">star</span>
              <span className="material-symbols-outlined fill text-sm">star</span>
              <span className="material-symbols-outlined fill text-sm">star</span>
              <span className="material-symbols-outlined fill text-sm">star</span>
              <span className="material-symbols-outlined fill text-sm">star</span>
            </div>
            <p className="text-stitch-on-surface-variant mb-6">"The verification process gave us the confidence we needed to bring someone into our home."</p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-stitch-primary/20 flex items-center justify-center font-bold text-stitch-primary font-stitch-display">MA</div>
              <div>
                <p className="font-bold text-sm text-stitch-on-surface">Maryam A.</p>
                <p className="text-xs text-stitch-on-surface-variant">Family Member</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
