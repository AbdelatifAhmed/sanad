"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface SidebarItem {
  label: string;
  href: string;
  icon: string; 
}

interface SidebarProps {
  title?: string;
  subtitle?: string;
  navItems: SidebarItem[];
}

export default function Sidebar({
  title = "Dignified Care",
  subtitle = "Care Dashboard",
  navItems,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-72 bg-white flex flex-col border-r border-stitch-outline/20 h-screen sticky top-0 font-stitch-body select-none">
      <div className="p-8 pb-6">
        <h1 className="text-2xl font-stitch-display font-bold text-primary tracking-tight">
          {title}
        </h1>
        <p className="text-xs font-medium text-stitch-on-surface-variant/60 mt-1 uppercase tracking-wider">
          {subtitle}
        </p>
      </div>

      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = 
            pathname === item.href || 
            (item.href !== "/" && pathname.startsWith(item.href + "/"));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 font-medium group ${
                isActive
                  ? "bg-stitch-secondary-container text-stitch-on-secondary-container font-semibold"
                  : "text-stitch-on-surface/80 hover:bg-stitch-secondary-container/10 hover:text-stitch-on-secondary-container"
              }`}
            >
              <span 
                className={`material-symbols-outlined text-2xl transition-colors ${
                  isActive 
                    ? "text-stitch-on-secondary-container [font-variation-settings:'FILL'_1]" 
                    : "text-stitch-on-surface/60 group-hover:text-stitch-on-secondary-container"
                }`}
              >
                {item.icon}
              </span>
              <span className="text-sm tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-stitch-outline/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-stitch-primary/10 flex items-center justify-center text-stitch-primary">
            <span className="material-symbols-outlined">person</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-stitch-on-surface truncate">User Account</p>
            <p className="text-xs text-stitch-on-surface-variant/60 truncate">user@sanad.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
