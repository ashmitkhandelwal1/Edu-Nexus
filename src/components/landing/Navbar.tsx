"use client";

import React, { useState } from "react";
import Link from "next/link";
import { GraduationCap, Menu, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-slate-950 via-slate-900 to-blue-600 text-white shadow-md">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-slate-950">
              EDU<span className="text-blue-600">NEXUS</span>
            </span>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 -mt-1">
              AI Campus OS
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <Link href="#features" className="hover:text-blue-600 transition-colors">
            Features
          </Link>
          <Link href="#roles" className="hover:text-blue-600 transition-colors">
            Roles & Portals
          </Link>
          <Link href="#analytics" className="hover:text-blue-600 transition-colors">
            AI Analytics
          </Link>
          <Link href="#about" className="hover:text-blue-600 transition-colors">
            About
          </Link>
        </nav>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="font-medium text-slate-700">
              Sign In
            </Button>
          </Link>
          <Link href="/login">
            <Button size="sm" className="bg-slate-950 hover:bg-slate-800 text-white shadow-sm gap-1.5">
              <span>Get Started</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-6 space-y-4">
          <nav className="flex flex-col space-y-3 text-base font-medium text-slate-700">
            <Link
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-blue-600"
            >
              Features
            </Link>
            <Link
              href="#roles"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-blue-600"
            >
              Roles & Portals
            </Link>
            <Link
              href="#analytics"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-blue-600"
            >
              AI Analytics
            </Link>
            <Link
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-blue-600"
            >
              About
            </Link>
          </nav>
          <div className="pt-2 flex flex-col gap-2">
            <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="outline" className="w-full justify-center">
                Sign In
              </Button>
            </Link>
            <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
              <Button className="w-full justify-center bg-slate-950 text-white hover:bg-slate-800">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

