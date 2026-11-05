"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  FileCheck,
  User,
  Clock,
  Award,
  MessageSquare,
  AlertCircle,
  Paperclip,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SubmissionGradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  assignment: any;
}

export function SubmissionGradingModal({
  isOpen,
  onClose,
  onSuccess,
  assignment,
}: SubmissionGradingModalProps) {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected submission for grading
  const [activeSubmission, setActiveSubmission] = useState<any | null>(null);
  const [marks, setMarks] = useState<number | string>("");
  const [feedback, setFeedback] = useState("");
  const [submittingGrade, setSubmittingGrade] = useState(false);
  const [gradeError, setGradeError] = useState<string | null>(null);

  const fetchSubmissions = async () => {
    if (!assignment?._id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/assignments/${assignment._id}/submissions`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load submissions");
      setSubmissions(data.submissions || []);
      if (data.submissions && data.submissions.length > 0) {
        selectSubmission(data.submissions[0]);
      } else {
        setActiveSubmission(null);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && assignment?._id) {
      fetchSubmissions();
    }
  }, [isOpen, assignment]);

  const selectSubmission = (sub: any) => {
    setActiveSubmission(sub);
    setMarks(sub.marksObtained !== undefined ? sub.marksObtained : "");
    setFeedback(sub.feedback || "");
    setGradeError(null);
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubmission) return;

    const numMarks = Number(marks);
    if (isNaN(numMarks) || numMarks < 0) {
      setGradeError("Please enter valid marks (cannot be negative).");
      return;
    }

    if (numMarks > assignment.maxMarks) {
      setGradeError(`Marks cannot exceed assignment maximum (${assignment.maxMarks}).`);
      return;
    }

    setSubmittingGrade(true);
    setGradeError(null);

    try {
      const res = await fetch(`/api/submissions/${activeSubmission._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marksObtained: numMarks,
          feedback: feedback.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to grade submission");

      // Update in local state
      setSubmissions((prev) =>
        prev.map((s) => (s._id === activeSubmission._id ? data.submission : s))
      );
      setActiveSubmission(data.submission);
      onSuccess();
    } catch (err: any) {
      setGradeError(err.message || "Error submitting grade");
    } finally {
      setSubmittingGrade(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-400" />
              Submissions & Grading: {assignment.title}
            </h3>
            <p className="text-xs text-slate-400">
              Subject: {assignment.subjectName} • Due: {new Date(assignment.dueDate).toLocaleDateString()} • Max Marks: {assignment.maxMarks}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[480px]">
          {/* Left: Submissions List */}
          <div className="md:col-span-5 border-r border-slate-800 flex flex-col overflow-y-auto p-4 space-y-2 bg-slate-950/40">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-300">
                Submitted Cohort ({submissions.length})
              </span>
            </div>

            {loading ? (
              <div className="text-center py-10 text-xs text-slate-500">Loading student submissions...</div>
            ) : error ? (
              <div className="p-3 bg-rose-500/10 text-rose-300 rounded-xl text-xs">{error}</div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-500 italic">
                No students have submitted this assignment yet.
              </div>
            ) : (
              submissions.map((sub) => {
                const isSelected = activeSubmission?._id === sub._id;
                const student = sub.studentId || {};
                return (
                  <button
                    key={sub._id}
                    onClick={() => selectSubmission(sub)}
                    className={`text-left p-3 rounded-xl border transition-colors ${
                      isSelected
                        ? "bg-indigo-600/10 border-indigo-500/40"
                        : "bg-slate-900 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-white">
                        {student.firstName} {student.lastName}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          sub.status === "graded"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : sub.status === "late"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                            : "bg-sky-500/10 text-sky-400 border border-sky-500/30"
                        }`}
                      >
                        {sub.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
                      <span>Roll #{student.rollNumber || "—"}</span>
                      {sub.status === "graded" ? (
                        <span className="font-bold text-emerald-400">
                          {sub.marksObtained} / {assignment.maxMarks}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">
                          {new Date(sub.submittedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Right: Grading Panel */}
          <div className="md:col-span-7 flex flex-col p-6 overflow-y-auto">
            {activeSubmission ? (
              <div className="space-y-6">
                {/* Student header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-sm">
                      {activeSubmission.studentId?.firstName?.[0] || "S"}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">
                        {activeSubmission.studentId?.firstName} {activeSubmission.studentId?.lastName}
                      </h4>
                      <p className="text-xs text-slate-400">
                        Adm: <span className="font-mono">{activeSubmission.studentId?.admissionNumber}</span> • Submitted:{" "}
                        {new Date(activeSubmission.submittedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                      activeSubmission.status === "graded"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : activeSubmission.status === "late"
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-sky-500/20 text-sky-300"
                    }`}
                  >
                    {activeSubmission.status}
                  </span>
                </div>

                {/* Submitted text answer */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Student Submission / Answer</label>
                  <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 min-h-[70px] whitespace-pre-wrap leading-relaxed">
                    {activeSubmission.textAnswer || <span className="italic text-slate-500">No text answer provided.</span>}
                  </div>
                </div>

                {/* Attachments */}
                {activeSubmission.attachments && activeSubmission.attachments.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">Submitted Attachments</label>
                    <div className="space-y-1">
                      {activeSubmission.attachments.map((att: any, i: number) => (
                        <a
                          key={i}
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-xs text-indigo-300 hover:text-indigo-200 transition"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Paperclip className="w-3.5 h-3.5" />
                            <span className="font-medium truncate">{att.name}</span>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Grading Form */}
                <form onSubmit={handleSaveGrade} className="pt-4 border-t border-slate-800 space-y-4">
                  {gradeError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{gradeError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Marks Obtained (Max: {assignment.maxMarks}) <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min={0}
                        max={assignment.maxMarks}
                        value={marks}
                        onChange={(e) => setMarks(e.target.value)}
                        placeholder={`0 - ${assignment.maxMarks}`}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                      />
                    </div>

                    <div className="flex items-end">
                      <Button
                        type="submit"
                        disabled={submittingGrade}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-[38px] gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {submittingGrade ? "Saving Evaluation..." : "Save Grade & Feedback"}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Teacher Feedback & Remarks
                    </label>
                    <textarea
                      rows={3}
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Add constructive feedback, corrections, or praise for this submission..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </form>
              </div>
            ) : (
              <div className="text-center py-20 text-xs text-slate-500 italic">
                Select a student submission from the list to review and grade.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

