"use client";

import React, { useState, useEffect } from "react";
import {
  Megaphone,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  Users,
  Edit2,
  Trash2,
  Archive,
  RefreshCw,
  AlertCircle,
  Eye,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AnnouncementModal } from "./AnnouncementModal";

export function AnnouncementManagementClient() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchAnnouncements = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (status) params.append("status", status);
      if (targetAudience) params.append("targetAudience", targetAudience);
      params.append("page", String(page));

      const res = await fetch(`/api/announcements?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load announcements");

      setAnnouncements(data.announcements || []);
      setPagination(data.pagination || { totalPages: 1, total: 0 });
    } catch (err: any) {
      setError(err.message || "Network error loading announcements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [search, status, targetAudience, page]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this announcement?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/announcements/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete announcement");
      fetchAnnouncements();
    } catch (err: any) {
      alert(err.message || "Failed to delete announcement");
    } finally {
      setDeletingId(null);
    }
  };

  const handleArchive = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "archived" ? "published" : "archived";
    try {
      const res = await fetch(`/api/announcements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change status");
      fetchAnnouncements();
    } catch (err: any) {
      alert(err.message || "Error updating announcement status");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-indigo-400" />
            Announcements & School Notices
          </h1>
          <p className="text-sm text-slate-400">
            Publish official broadcasts, event announcements, and role-based notices
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/announcements">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold gap-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-sky-400" /> View Live Feed
            </Button>
          </Link>
          <Button
            onClick={() => {
              setEditingItem(null);
              setModalOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 font-medium text-xs"
          >
            <Plus className="w-4 h-4" /> New Announcement
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3 w-full md:w-auto flex-1 flex-wrap">
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search title, message..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs rounded-lg px-3 py-2 text-slate-300 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>

          <select
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs rounded-lg px-3 py-2 text-slate-300 focus:outline-none"
          >
            <option value="">All Audiences</option>
            <option value="all">Everyone</option>
            <option value="teachers">Teachers Only</option>
            <option value="students">Students Only</option>
          </select>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchAnnouncements}
          disabled={loading}
          className="border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 text-xs gap-1.5 self-end md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Announcements List */}
      {loading && announcements.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading announcements...</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Megaphone className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-white">No Announcements Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Broadcast school notices, exam reminders, and emergency updates to all cohorts.
          </p>
          <Button
            onClick={() => {
              setEditingItem(null);
              setModalOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs mt-2"
          >
            Create Announcement
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {announcements.map((a) => {
            const isExpired = a.expiresAt && new Date(a.expiresAt) <= new Date();

            return (
              <div
                key={a._id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {a.targetAudience === "all" ? "Everyone" : a.targetAudience}
                    </span>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        a.status === "published"
                          ? isExpired
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : a.status === "archived"
                          ? "bg-slate-800 text-slate-400 border border-slate-700"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {isExpired && a.status === "published" ? "Expired" : a.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white line-clamp-1">{a.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-3 mt-1.5 whitespace-pre-wrap leading-relaxed">
                      {a.message}
                    </p>
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 space-y-1 text-xs">
                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" /> Published:
                      </span>
                      <span className="text-slate-200">
                        {new Date(a.publishAt).toLocaleDateString()}
                      </span>
                    </div>

                    {a.expiresAt && (
                      <div className="flex items-center justify-between text-slate-400 text-[11px]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" /> Expires:
                        </span>
                        <span className={isExpired ? "text-rose-400 font-bold" : "text-slate-200"}>
                          {new Date(a.expiresAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">
                    By {a.createdBy?.name || "Administration"}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleArchive(a._id, a.status)}
                      className="border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 text-xs px-2 h-7"
                      title={a.status === "archived" ? "Unarchive" : "Archive"}
                    >
                      <Archive className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingItem(a);
                        setModalOpen(true);
                      }}
                      className="border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs px-2 h-7"
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={deletingId === a._id}
                      onClick={() => handleDelete(a._id)}
                      className="border-rose-900/40 text-rose-400 hover:bg-rose-950/20 text-xs px-2 h-7"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <AnnouncementModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchAnnouncements}
        initialData={editingItem}
      />
    </div>
  );
}

