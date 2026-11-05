import {
  Users,
  CalendarCheck,
  FileCheck2,
  BookOpenCheck,
  HeartHandshake,
  BrainCircuit,
  LucideIcon,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface Feature {
  title: string;
  description: string;
  icon: LucideIcon;
  tag: string;
}

const features: Feature[] = [
  {
    title: "Student Management",
    description:
      "Centralized student information records, admissions workflows, biometric demographic profiles, and lifecycle tracking from entry to alumni.",
    icon: Users,
    tag: "Core SIS",
  },
  {
    title: "Attendance Tracking",
    description:
      "Automated multi-modal attendance via QR codes, RFID cards, or biometric terminals with instant automated SMS & notification pings.",
    icon: CalendarCheck,
    tag: "Real-time",
  },
  {
    title: "Examination Management",
    description:
      "Automated timetable generation, exam hall seating plans, encrypted digital grading, and tamper-proof report card generation.",
    icon: FileCheck2,
    tag: "Automated",
  },
  {
    title: "Assignment Management",
    description:
      "Rich media assignment uploads, interactive rubrics, plagiarism screening, deadline reminders, and one-click feedback loops.",
    icon: BookOpenCheck,
    tag: "LMS",
  },
  {
    title: "Parent Portal",
    description:
      "Dedicated mobile-first dashboard providing parents with real-time academic insights, fee payment portals, and direct teacher messaging.",
    icon: HeartHandshake,
    tag: "Engagement",
  },
  {
    title: "AI-Powered Analytics",
    description:
      "Predictive learning analytics that identify students needing academic intervention, predict grade trajectories, and optimize curriculum pacing.",
    icon: BrainCircuit,
    tag: "Intelligence",
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 bg-slate-50 border-y border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-sm font-semibold tracking-wider uppercase text-blue-600 mb-2">
            End-to-End Campus Architecture
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
            Every tool required to run high-performing educational institutions
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600">
            Engineered with modern cloud standards to replace fragmented legacy tools with a unified, high-security ecosystem.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className="relative overflow-hidden border border-slate-200/80 bg-white hover:border-blue-400 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                <CardHeader className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-12 w-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                      {feature.tag}
                    </span>
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-900 mb-2">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-slate-600 text-sm leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

