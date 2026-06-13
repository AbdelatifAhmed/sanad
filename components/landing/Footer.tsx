import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-stitch-background border-t border-stitch-outline/20 font-stitch-body">
      <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Logo and Info */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/">
              <img 
                alt="Sanad Logo" 
                className="h-10 w-auto mb-6 object-contain" 
                src="/logo_sanad.png" 
              />
            </Link>
            <p className="text-stitch-on-surface-variant text-sm leading-relaxed">
              Sanad is a dedicated platform for healthcare support, focusing on dignity, respect, and professional care for the elderly.
            </p>
          </div>
          
          {/* Column 1 */}
          <div>
            <h4 className="font-bold mb-6 text-stitch-on-surface font-stitch-display">Company</h4>
            <ul className="space-y-4 text-sm text-stitch-on-surface-variant">
              <li><Link className="hover:text-stitch-primary transition-colors" href="#">About Us</Link></li>
              <li><Link className="hover:text-stitch-primary transition-colors" href="#how-it-works">How it Works</Link></li>
              <li><Link className="hover:text-stitch-primary transition-colors" href="#">Careers</Link></li>
              <li><Link className="hover:text-stitch-primary transition-colors" href="#">Contact</Link></li>
            </ul>
          </div>
          
          {/* Column 2 */}
          <div>
            <h4 className="font-bold mb-6 text-stitch-on-surface font-stitch-display">Resources</h4>
            <ul className="space-y-4 text-sm text-stitch-on-surface-variant">
              <li><Link className="hover:text-stitch-primary transition-colors" href="#">Caregiver Guides</Link></li>
              <li><Link className="hover:text-stitch-primary transition-colors" href="#">Safety Tips</Link></li>
              <li><Link className="hover:text-stitch-primary transition-colors" href="#">Trust Badges</Link></li>
              <li><Link className="hover:text-stitch-primary transition-colors" href="#">Help Center</Link></li>
            </ul>
          </div>
          
          {/* Column 3 */}
          <div>
            <h4 className="font-bold mb-6 text-stitch-on-surface font-stitch-display">Legal</h4>
            <ul className="space-y-4 text-sm text-stitch-on-surface-variant">
              <li><Link className="hover:text-stitch-primary transition-colors" href="#">Privacy Policy</Link></li>
              <li><Link className="hover:text-stitch-primary transition-colors" href="#">Terms of Service</Link></li>
              <li><Link className="hover:text-stitch-primary transition-colors" href="#">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>
        
        {/* Bottom copyright and socials bar */}
        <div className="mt-20 pt-8 border-t border-stitch-outline/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-stitch-on-surface-variant">© {new Date().getFullYear()} Sanad | سند. All rights reserved.</p>
          <div className="flex gap-6">
            <Link className="text-stitch-on-surface-variant hover:text-stitch-primary transition-colors" href="#" aria-label="Facebook">
              <span className="material-symbols-outlined">facebook</span>
            </Link>
            <Link className="text-stitch-on-surface-variant hover:text-stitch-primary transition-colors" href="#" aria-label="Email">
              <span className="material-symbols-outlined">alternate_email</span>
            </Link>
            <Link className="text-stitch-on-surface-variant hover:text-stitch-primary transition-colors" href="#" aria-label="Website">
              <span className="material-symbols-outlined">link</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
