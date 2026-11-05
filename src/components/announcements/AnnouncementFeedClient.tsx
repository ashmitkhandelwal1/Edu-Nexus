"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Megaphone,
  Calendar,
  Users,
  Clock,
  ArrowLeft,
  RefreshCw,
  Bell,
  AlertCircle,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AnnouncementFeedClientProps {
  userRole: string;
  userEmail: string;
}

export function AnnouncementFeedClient({ userRole, userEmail }: AnnouncementFeedClientProps) {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeed = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/announcements");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load announcement feed");
      setAnnouncements(data.announcements || []);
    } catch (err: any) {
      setError(err.message || "Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link
                href={userRole === "admin" ? "/admin" : userRole === "teacher" ? "/teacher" : userRole === "student" ? "/student" : "/login"}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
              </Link>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Megaphone className="w-7 h-7 text-indigo-400" />
              School Noticeboard & Announcements
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Official updates, schedules, and bulletins for {userRole === "all" ? "the school community" : `${userRole}s`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-semibold uppercase">
              Role: <span className="text-indigo-400">{userRole}</span>
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchFeed}
              disabled={loading}
              className="border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 text-xs gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Feed Cards */}
        {loading ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-16 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
            <p className="text-sm text-slate-400">Loading current notices...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-16 text-center space-y-3">
            <Bell className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-lg font-bold text-white">No Active Announcements</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You are all caught up! There are no current notices or bulletins for your cohort at this time.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((a) => (
              <div
                key={a._id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-6 transition shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {a.targetAudience === "all" ? "Everyone" : a.targetAudience}
                    </span>
                    <span className="text-xs text-slate-400">
                      • Posted on {new Date(a.publishAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-500 font-medium">
                    By {a.createdBy?.name || "School Administration"}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">{a.title}</h3>
                  <p className="text-sm text-slate-300 mt-2 whitespace-pre-wrap leading-relaxed">
                    {a.message}
                  </p>
                </div>

                {a.expiresAt && (
                  <div className="pt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Valid until: {new Date(a.expiresAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

