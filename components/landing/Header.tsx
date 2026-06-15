"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-stitch-outline/20 font-stitch-body">
      <div className="flex justify-between items-center h-20 px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto">
        <Link className="flex items-center" href="/">
          <Image
            alt="Sanad Logo"
            className="size-12 w-auto object-contain"
            src="/logo_sanad.png"
            width={48}
            height={48}
          />
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link className="text-stitch-on-surface font-medium hover:text-stitch-primary transition-colors" href="#how-it-works">
            How it Works
          </Link>
          <Link className="text-stitch-on-surface font-medium hover:text-stitch-primary transition-colors" href="#why-sanad">
            Why Sanad
          </Link>
          <Link className="text-stitch-on-surface font-medium hover:text-stitch-primary transition-colors" href="#testimonials">
            Reviews
          </Link>
        </nav>

        {/* Desktop Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <Link className="text-stitch-primary font-semibold hover:opacity-80 transition-opacity px-4" href="/login">
            Log In
          </Link>
          <Link className="bg-stitch-primary text-stitch-on-primary px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all" href="/register">
            Get Started
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden p-2 text-stitch-on-surface hover:text-stitch-primary transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          <span className="material-symbols-outlined text-3xl">
            {mobileMenuOpen ? "close" : "menu"}
          </span>
        </button>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-stitch-outline/20 px-margin-mobile py-6 flex flex-col gap-4 shadow-lg animate-fade-in">
          <Link 
            className="text-stitch-on-surface font-medium py-2 hover:text-stitch-primary transition-colors border-b border-stitch-outline/10"
            href="#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
          >
            How it Works
          </Link>
          <Link 
            className="text-stitch-on-surface font-medium py-2 hover:text-stitch-primary transition-colors border-b border-stitch-outline/10"
            href="#why-sanad"
            onClick={() => setMobileMenuOpen(false)}
          >
            Why Sanad
          </Link>
          <Link 
            className="text-stitch-on-surface font-medium py-2 hover:text-stitch-primary transition-colors border-b border-stitch-outline/10"
            href="#testimonials"
            onClick={() => setMobileMenuOpen(false)}
          >
            Reviews
          </Link>
          <div className="flex flex-col gap-3 pt-2">
            <Link 
              className="text-stitch-primary font-semibold py-3 text-center border border-stitch-primary rounded-lg hover:bg-stitch-primary/5 transition-colors"
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
            >
              Log In
            </Link>
            <Link 
              className="bg-stitch-primary text-stitch-on-primary py-3 text-center rounded-lg font-semibold hover:shadow-lg transition-all"
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
