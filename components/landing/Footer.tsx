import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function Footer() {
  const t = await getTranslations("landing.footer");

  return (
    <footer className="bg-stitch-background border-t border-stitch-outline/20 font-stitch-body">
      <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-1">
            <Link href="/">
              <Image
                alt="Sanad Logo"
                className="h-10 w-auto mb-6 object-contain"
                src="/logo_sanad.png"
                width={90}
                height={40}
              />
            </Link>
            <p className="text-stitch-on-surface-variant text-sm leading-relaxed">
              {t("description")}
            </p>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-stitch-on-surface font-stitch-display">{t("company")}</h4>
            <ul className="space-y-4 text-sm text-stitch-on-surface-variant">
              <li><Link className="hover:text-stitch-primary transition-colors" href="#">{t("about")}</Link></li>
              <li><Link className="hover:text-stitch-primary transition-colors" href="#how-it-works">{t("howItWorks")}</Link></li>
              <li><Link className="hover:text-stitch-primary transition-colors" href="#">{t("careers")}</Link></li>
              <li><Link className="hover:text-stitch-primary transition-colors" href="#">{t("contact")}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-stitch-on-surface font-stitch-display">{t("resources")}</h4>
            <ul className="space-y-4 text-sm text-stitch-on-surface-variant">
              <li><Link className="hover:text-stitch-primary transition-colors" href="#">{t("guides")}</Link></li>
              <li><Link className="hover:text-stitch-primary transition-colors" href="#">{t("safety")}</Link></li>
              <li><Link className="hover:text-stitch-primary transition-colors" href="#">{t("badges")}</Link></li>
              <li><Link className="hover:text-stitch-primary transition-colors" href="#">{t("help")}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-stitch-on-surface font-stitch-display">{t("legal")}</h4>
            <ul className="space-y-4 text-sm text-stitch-on-surface-variant">
              <li><Link className="hover:text-stitch-primary transition-colors" href="#">{t("privacy")}</Link></li>
              <li><Link className="hover:text-stitch-primary transition-colors" href="#">{t("terms")}</Link></li>
              <li><Link className="hover:text-stitch-primary transition-colors" href="#">{t("cookies")}</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-20 pt-8 border-t border-stitch-outline/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-stitch-on-surface-variant">© {new Date().getFullYear()} Sanad | سند. {t("rights")}</p>
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
