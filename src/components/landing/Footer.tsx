import Link from "next/link";
import { GraduationCap, Mail, Globe, MessageSquare, Compass } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand info */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                EDU<span className="text-blue-500">NEXUS</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              The modern AI-powered School Management and Learning Management System
              engineered for high reliability, automated workflows, and exceptional learning outcomes.
            </p>
            <div className="flex items-center space-x-3 pt-2">
              <a
                href="#"
                className="h-9 w-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
                aria-label="Community"
              >
                <Globe className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="h-9 w-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
                aria-label="Network"
              >
                <Compass className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="h-9 w-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
                aria-label="Discussion"
              >
                <MessageSquare className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="h-9 w-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
                aria-label="Contact Email"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Nav Column 1 */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="#features" className="hover:text-white transition-colors">
                  Student Management
                </Link>
              </li>
              <li>
                <Link href="#features" className="hover:text-white transition-colors">
                  Smart Attendance
                </Link>
              </li>
              <li>
                <Link href="#features" className="hover:text-white transition-colors">
                  Exams & Grading
                </Link>
              </li>
              <li>
                <Link href="#features" className="hover:text-white transition-colors">
                  Assignments LMS
                </Link>
              </li>
              <li>
                <Link href="#features" className="hover:text-white transition-colors">
                  AI Analytics Engine
                </Link>
              </li>
            </ul>
          </div>

          {/* Nav Column 2 */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4">
              Roles & Portals
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="#roles" className="hover:text-white transition-colors">
                  Admin Control Center
                </Link>
              </li>
              <li>
                <Link href="#roles" className="hover:text-white transition-colors">
                  Teacher Classroom Hub
                </Link>
              </li>
              <li>
                <Link href="#roles" className="hover:text-white transition-colors">
                  Student Workspace
                </Link>
              </li>
              <li>
                <Link href="#roles" className="hover:text-white transition-colors">
                  Parent Companion
                </Link>
              </li>
            </ul>
          </div>

          {/* Nav Column 3 */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4">
              Institution
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Security & Compliance
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Support Desk
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© 2026 EDUNEXUS Platform Inc. All rights reserved.</p>
          <div className="flex items-center space-x-6">
            <span className="inline-flex items-center gap-1.5 text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              Systems Operational
            </span>
            <span className="text-slate-500">v0.1.0-alpha</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
