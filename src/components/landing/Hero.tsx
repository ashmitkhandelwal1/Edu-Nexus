import Link from "next/link";
import { ArrowRight, Sparkles, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
      {/* Background Subtle Gradients & Grid Pattern */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-70" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 h-[360px] w-[600px] rounded-full bg-blue-100/60 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Release / Announcement Tag */}
        <div className="inline-flex items-center gap-2 mb-6">
          <Badge
            variant="brand"
            className="px-3 py-1.5 text-xs font-semibold rounded-full border border-blue-200 bg-blue-50 text-blue-700 shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1 text-blue-600 animate-pulse" />
            Next-Gen AI Campus Operating System
          </Badge>
        </div>

        {/* Hero Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-950 max-w-5xl mx-auto leading-[1.12]">
          Intelligent Education Management,{" "}
          <span className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Reimagined with AI.
          </span>
        </h1>

        {/* Hero Description */}
        <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
          EDUNEXUS unifies Student Information Systems (SIS), automated grading,
          smart attendance, and real-time parent communication into an enterprise-grade
          learning cloud designed for modern institutions.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/login" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-500/25 px-8 gap-2 group"
            >
              <span>Get Started Free</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          <Link href="#features" className="w-full sm:w-auto">
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto border-slate-300 text-slate-800 hover:bg-slate-50 font-semibold px-8"
            >
              Explore Features
            </Button>
          </Link>
        </div>

        {/* Highlights Bar */}
        <div className="mt-12 pt-6 border-t border-slate-200/80 max-w-3xl mx-auto flex flex-wrap items-center justify-center gap-y-3 gap-x-8 text-xs sm:text-sm font-medium text-slate-600">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
            <span>99.9% Attendance Accuracy</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            <span>Enterprise Data Security</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
            <span>Automated AI Analytics</span>
          </div>
        </div>

        {/* Mock Interface Preview Showcase */}
        <div className="mt-14 relative mx-auto max-w-5xl rounded-2xl border border-slate-200/90 bg-white p-3 shadow-2xl shadow-slate-200/50">
          <div className="rounded-xl bg-slate-900 p-4 text-left overflow-hidden border border-slate-800">
            {/* Window chrome header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                <span className="ml-3 text-xs font-mono text-slate-400">edunexus-platform.internal / dashboard</span>
              </div>
              <span className="text-xs text-blue-400 font-mono bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800">
                AI Engine Live
              </span>
            </div>

            {/* Dashboard Mock Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg bg-slate-800/80 p-4 border border-slate-700/60">
                <span className="text-xs font-medium text-slate-400">Total Enrolled Students</span>
                <p className="text-2xl font-bold text-white mt-1">2,840</p>
                <div className="mt-2 text-xs text-emerald-400 font-medium">↑ 12% from last academic session</div>
              </div>

              <div className="rounded-lg bg-slate-800/80 p-4 border border-slate-700/60">
                <span className="text-xs font-medium text-slate-400">Daily Attendance Rate</span>
                <p className="text-2xl font-bold text-white mt-1">98.4%</p>
                <div className="mt-2 text-xs text-blue-400 font-medium">Biometric & RFID verified</div>
              </div>

              <div className="rounded-lg bg-slate-800/80 p-4 border border-slate-700/60">
                <span className="text-xs font-medium text-slate-400">AI Student Risk Alerts</span>
                <p className="text-2xl font-bold text-amber-400 mt-1">4 Active</p>
                <div className="mt-2 text-xs text-slate-400 font-medium">Proactive tutoring advised</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

