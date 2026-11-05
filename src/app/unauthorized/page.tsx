import Link from "next/link";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xl text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 mb-6">
          <ShieldAlert className="h-7 w-7" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Access Restricted
        </h1>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          You do not have the required permissions or administrator privileges to view this section.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link href="/" className="flex-1">
            <Button variant="outline" className="w-full gap-1.5">
              <Home className="h-4 w-4" />
              <span>Back Home</span>
            </Button>
          </Link>
          <Link href="/login" className="flex-1">
            <Button className="w-full bg-slate-950 hover:bg-slate-800 text-white gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              <span>Sign In</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

