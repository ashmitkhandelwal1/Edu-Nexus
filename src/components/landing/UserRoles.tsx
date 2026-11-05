import Link from "next/link";
import { Shield, BookOpen, GraduationCap, Users, ArrowUpRight, Check } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface RoleCard {
  role: string;
  badge: string;
  headline: string;
  description: string;
  icon: typeof Shield;
  color: string;
  points: string[];
}

const roleCards: RoleCard[] = [
  {
    role: "Admin",
    badge: "Enterprise Oversight",
    headline: "Campus Operations & Compliance",
    description: "Holistic oversight across financial billing, staff governance, compliance registers, and institutional analytics.",
    icon: Shield,
    color: "from-slate-900 to-slate-800",
    points: [
      "Staff scheduling & payroll overview",
      "Automated fee collection & invoices",
      "Regulatory & audit reporting export",
    ],
  },
  {
    role: "Teacher",
    badge: "Instructional Suite",
    headline: "Classroom & Curriculum Powerhouse",
    description: "Streamline lesson planning, interactive rubric grading, automated attendance, and direct family communication.",
    icon: BookOpen,
    color: "from-blue-700 to-indigo-800",
    points: [
      "AI-assisted assignment grading",
      "Digital gradebook with weighting",
      "Quick attendance submission in seconds",
    ],
  },
  {
    role: "Student",
    badge: "Personalized LMS",
    headline: "Interactive Learning Workspace",
    description: "An intuitive space to submit work, view timetables, access class notes, and monitor academic progress.",
    icon: GraduationCap,
    color: "from-cyan-700 to-blue-800",
    points: [
      "Consolidated homework deadline tracker",
      "Real-time exam timetable & results",
      "AI study assistance & feedback summaries",
    ],
  },
  {
    role: "Parent",
    badge: "Family Visibility",
    headline: "Direct Insight into Child Progress",
    description: "Peace of mind through timely attendance notifications, fee management, and meaningful academic progress reports.",
    icon: Users,
    color: "from-slate-800 to-blue-950",
    points: [
      "Instant arrival/departure notifications",
      "Digital report cards and trend charts",
      "Direct secure messaging with teachers",
    ],
  },
];

export function UserRoles() {
  return (
    <section id="roles" className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-sm font-semibold tracking-wider uppercase text-blue-600 mb-2">
            Tailored Experiences
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
            Designed for Every Stakeholder in the Education Ecosystem
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600">
            Purpose-built dedicated portals give each stakeholder the exact tools, privacy controls, and insights they need.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {roleCards.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.role}
                className="flex flex-col justify-between border border-slate-200/90 rounded-2xl bg-white hover:border-slate-400 hover:shadow-xl transition-all duration-300"
              >
                <div>
                  <div className={`h-2.5 w-full rounded-t-2xl bg-gradient-to-r ${item.color}`} />
                  <CardHeader className="p-6 pb-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {item.badge}
                      </span>
                      <div className="p-2 rounded-lg bg-slate-50 text-slate-700">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-slate-900">
                      {item.role}
                    </CardTitle>
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mt-1">
                      {item.headline}
                    </p>
                    <CardDescription className="text-slate-600 text-sm mt-3 leading-relaxed">
                      {item.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="px-6 pb-6 pt-0">
                    <div className="pt-4 border-t border-slate-100 space-y-2.5">
                      {item.points.map((pt, i) => (
                        <div key={i} className="flex items-start text-xs text-slate-600">
                          <Check className="h-4 w-4 text-emerald-600 mr-2 shrink-0 mt-0.5" />
                          <span>{pt}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </div>

                <div className="p-6 pt-0">
                  <Link href="/login" className="block w-full">
                    <Button
                      variant="outline"
                      className="w-full justify-between text-xs font-semibold hover:border-blue-500 hover:text-blue-600 group"
                    >
                      <span>View Portal Experience</span>
                      <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

