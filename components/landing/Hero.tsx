"use client";

import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative pt-16 pb-24 px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto font-stitch-body">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 bg-stitch-primary/10 text-stitch-primary px-4 py-2 rounded-full border border-stitch-primary/20">
            <span className="material-symbols-outlined text-[20px] fill">verified</span>
            <span className="text-sm font-bold uppercase tracking-wider">Trusted by 10,000+ Families</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold leading-tight text-stitch-on-surface font-stitch-display">
            Care You Can Trust for Your <span className="text-stitch-primary">Loved Ones.</span>
          </h1>
          
          <p className="text-xl text-stitch-on-surface-variant leading-relaxed max-w-xl">
            Sanad connects families with verified, compassionate caregivers. From medical assistance to daily companionship, find the perfect support today.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              className="bg-stitch-primary text-stitch-on-primary px-8 py-4 rounded-xl font-bold text-lg text-center hover:scale-[1.02] transition-transform shadow-premium" 
              href="/register?type=family"
            >
              Find a Caregiver
            </Link>
            <Link 
              className="bg-white border-2 border-stitch-primary text-stitch-primary px-8 py-4 rounded-xl font-bold text-lg text-center hover:bg-stitch-primary/5 transition-colors" 
              href="/register?type=companion"
            >
              Become a Caregiver
            </Link>
          </div>
          
          <div className="flex items-center gap-4 pt-4">
            <div className="flex -space-x-3">
              <img 
                alt="User Avatar 1" 
                className="w-10 h-10 rounded-full border-2 border-white object-cover" 
                src="/avatar_1.jpg"
              />
              <img 
                alt="User Avatar 2" 
                className="w-10 h-10 rounded-full border-2 border-white object-cover" 
                src="/avatar_2.jpg"
              />
              <img 
                alt="User Avatar 3" 
                className="w-10 h-10 rounded-full border-2 border-white object-cover" 
                src="/avatar_3.jpg"
              />
            </div>
            <div className="text-sm text-stitch-on-surface-variant">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-yellow-500 fill text-sm">star</span>
                <span className="material-symbols-outlined text-yellow-500 fill text-sm">star</span>
                <span className="material-symbols-outlined text-yellow-500 fill text-sm">star</span>
                <span className="material-symbols-outlined text-yellow-500 fill text-sm">star</span>
                <span className="material-symbols-outlined text-yellow-500 fill text-sm">star</span>
                <span className="font-bold text-stitch-on-surface ml-1 font-stitch-display">4.9/5</span>
              </div>
              <p>Based on 2,500+ reviews</p>
            </div>
          </div>
        </div>
        
        <div className="relative">
          <div className="absolute -inset-4 bg-stitch-primary/10 rounded-[32px] transform rotate-2"></div>
          <img 
            alt="Compassionate Care for Elderly" 
            className="relative w-full aspect-[4/5] object-cover rounded-[32px] shadow-premium" 
            src="/hero-caregiver.png"
          />
          <div className="absolute -bottom-8 -right-8 bg-white p-6 rounded-2xl shadow-premium border border-stitch-outline/20 max-w-xs animate-bounce-slow">
            <p className="text-stitch-primary font-bold text-lg mb-1 italic font-stitch-display">"The support we needed."</p>
            <p className="text-sm text-stitch-on-surface-variant">"Sanad helped us find Sarah, who has been a blessing for my mother."</p>
            <p className="text-xs font-bold text-stitch-on-surface mt-2">— The Miller Family</p>
          </div>
        </div>
      </div>
    </section>
  );
}
