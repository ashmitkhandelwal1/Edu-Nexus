"use client";

import React, { useState } from "react";
import {
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Award,
  Send,
  MessageSquare,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AssignmentItem {
  _id: string;
  title: string;
  description: string;
  instructions?: string;
  subjectName: string;
  teacherId?: {
    firstName: string;
    lastName: string;
  };
  assignedDate: string;
  dueDate: string;
  maxMarks: number;
  status: "published" | "closed";
  submission?: {
    _id: string;
    submittedAt: string;
    textAnswer?: string;
    status: "submitted" | "late" | "graded";
    marksObtained?: number;
    feedback?: string;
    gradedAt?: string;
  } | null;
}

interface StudentAssignmentsClientProps {
  studentId: string;
  assignments: AssignmentItem[];
}

export function StudentAssignmentsClient({
  studentId,
  assignments,
}: StudentAssignmentsClientProps) {
  const [activeTab, setActiveTab] = useState<"pending" | "submitted">("pending");
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const pendingList = assignments.filter((a) => !a.submission);
  const submittedList = assignments.filter((a) => !!a.submission);

  const handleSubmit = async (assignmentId: string) => {
    if (!textAnswer.trim()) {
      setSubmitError("Please write your answer before submitting.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const res = await fetch(`/api/assignments/${assignmentId}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          textAnswer: textAnswer.trim(),
          attachments: [],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit assignment");
      }

      setSubmitSuccess("Assignment submitted successfully!");
      setTextAnswer("");
      setSubmittingId(null);
      // Reload page to reflect updated submission state
      window.location.reload();
    } catch (err: any) {
      setSubmitError(err.message || "Failed to submit assignment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSubmissionBadge = (status: string) => {
    switch (status) {
      case "graded":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Award className="w-3.5 h-3.5" /> Graded
          </span>
        );
      case "late":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" /> Submitted Late
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Submitted
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab("pending")}
          className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
            activeTab === "pending"
              ? "border-amber-500 text-amber-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          <span>Pending Submissions ({pendingList.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("submitted")}
          className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
            activeTab === "submitted"
              ? "border-sky-500 text-sky-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Completed & Graded ({submittedList.length})</span>
        </button>
      </div>

      {submitSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{submitSuccess}</span>
        </div>
      )}

      {/* Pending Assignments List */}
      {activeTab === "pending" && (
        <div className="space-y-4">
          {pendingList.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-500">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500/50" />
              <p className="text-base font-bold text-slate-300">No Pending Assignments</p>
              <p className="text-xs text-slate-500 mt-1">
                You have completed and submitted all active coursework!
              </p>
            </div>
          ) : (
            pendingList.map((a) => {
              const isPastDue = new Date().getTime() > new Date(a.dueDate).getTime();

              return (
                <div
                  key={a._id}
                  className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/60">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2.5 py-0.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20 font-semibold">
                          {a.subjectName}
                        </span>
                        {a.teacherId && (
                          <span className="text-xs text-slate-400">
                            By {a.teacherId.firstName} {a.teacherId.lastName}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-white mt-1">{a.title}</h3>
                    </div>

                    <div className="text-right">
                      <div
                        className={`text-xs font-semibold ${
                          isPastDue ? "text-rose-400" : "text-amber-400"
                        }`}
                      >
                        Due: {new Date(a.dueDate).toLocaleString()}
                        {isPastDue && " (Late)"}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Max Marks: <span className="font-bold text-slate-300">{a.maxMarks}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-slate-300 whitespace-pre-wrap">{a.description}</p>

                  {a.instructions && (
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400">
                      <strong className="text-slate-300 block mb-1">Instructions:</strong>
                      {a.instructions}
                    </div>
                  )}

                  {/* Submission Form Trigger / Drawer */}
                  {submittingId === a._id ? (
                    <div className="pt-4 border-t border-slate-800/80 space-y-3">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                        Your Submission / Answer
                      </label>
                      <textarea
                        rows={4}
                        value={textAnswer}
                        onChange={(e) => setTextAnswer(e.target.value)}
                        placeholder="Write your homework response, solution, or essay here..."
                        className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                      />

                      {submitError && (
                        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{submitError}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        <Button
                          onClick={() => handleSubmit(a._id)}
                          disabled={isSubmitting}
                          className="bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{isSubmitting ? "Submitting..." : "Submit Answer"}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setSubmittingId(null);
                            setSubmitError(null);
                          }}
                          className="text-xs text-slate-400 hover:text-white"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2">
                      <Button
                        onClick={() => {
                          setSubmittingId(a._id);
                          setTextAnswer("");
                          setSubmitError(null);
                        }}
                        className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-2"
                      >
                        <Send className="w-3.5 h-3.5" /> Submit Homework
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Submitted & Graded Assignments */}
      {activeTab === "submitted" && (
        <div className="space-y-4">
          {submittedList.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-500">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-base font-bold text-slate-300">No Submissions Yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Completed submissions and teacher feedback will be displayed here.
              </p>
            </div>
          ) : (
            submittedList.map((a) => {
              const sub = a.submission!;

              return (
                <div
                  key={a._id}
                  className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/60">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2.5 py-0.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20 font-semibold">
                          {a.subjectName}
                        </span>
                        {getSubmissionBadge(sub.status)}
                      </div>
                      <h3 className="text-lg font-bold text-white mt-1">{a.title}</h3>
                    </div>

                    <div className="text-right">
                      {sub.status === "graded" && sub.marksObtained !== undefined ? (
                        <div className="text-emerald-400 font-bold text-sm">
                          Score: {sub.marksObtained} / {a.maxMarks}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400">Awaiting Evaluation</div>
                      )}
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Submitted: {new Date(sub.submittedAt).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Student Answer */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Submitted Solution
                    </label>
                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-sm text-slate-200 whitespace-pre-wrap font-sans">
                      {sub.textAnswer || "No text answer provided"}
                    </div>
                  </div>

                  {/* Teacher Feedback Card */}
                  {sub.status === "graded" && (
                    <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-1.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider">
                        <Award className="w-4 h-4" />
                        <span>Teacher Evaluation & Feedback</span>
                      </div>
                      <div className="text-sm text-slate-200">
                        {sub.feedback ? `"${sub.feedback}"` : "No remarks provided"}
                      </div>
                      <div className="text-xs text-purple-300/80 pt-1">
                        Graded Score: <strong className="text-white">{sub.marksObtained}</strong> / {a.maxMarks}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

