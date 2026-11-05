"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  FileText,
  Calendar,
  BookOpen,
  User,
  Plus,
  Trash2,
  Paperclip,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ClassOption {
  _id: string;
  className: string;
  section: string;
  academicYear: string;
  subjects?: { subjectName: string; teacher?: string }[];
}

interface TeacherOption {
  _id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
}

interface AttachmentItem {
  name: string;
  url: string;
  type?: string;
  size?: number;
}

interface AssignmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  classes: ClassOption[];
  teachers: TeacherOption[];
  initialData?: any | null;
}

export function AssignmentFormModal({
  isOpen,
  onClose,
  onSuccess,
  classes,
  teachers,
  initialData,
}: AssignmentFormModalProps) {
  const isEditing = !!initialData?._id;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [classId, setClassId] = useState("");
  const [academicYear, setAcademicYear] = useState("2026-27");
  const [subjectName, setSubjectName] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [maxMarks, setMaxMarks] = useState<number>(100);
  const [status, setStatus] = useState<"draft" | "published" | "closed">("published");

  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [attName, setAttName] = useState("");
  const [attUrl, setAttUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setDescription(initialData.description || "");
      setInstructions(initialData.instructions || "");
      const cId = typeof initialData.classId === "object" ? initialData.classId?._id : initialData.classId;
      setClassId(cId || "");
      setAcademicYear(initialData.academicYear || "2026-27");
      setSubjectName(initialData.subjectName || "");
      const tId = typeof initialData.teacherId === "object" ? initialData.teacherId?._id : initialData.teacherId;
      setTeacherId(tId || "");
      if (initialData.dueDate) {
        const d = new Date(initialData.dueDate);
        setDueDate(d.toISOString().slice(0, 16)); // YYYY-MM-DDTHH:mm
      } else {
        setDueDate("");
      }
      setMaxMarks(initialData.maxMarks || 100);
      setStatus(initialData.status || "published");
      setAttachments(initialData.attachments || []);
    } else {
      setTitle("");
      setDescription("");
      setInstructions("");
      if (classes.length > 0) {
        setClassId(classes[0]._id);
        setAcademicYear(classes[0].academicYear || "2026-27");
        if (classes[0].subjects && classes[0].subjects.length > 0) {
          setSubjectName(classes[0].subjects[0].subjectName);
        }
      }
      setTeacherId("");
      // Default due date: tomorrow same time
      const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
      tomorrow.setMinutes(0, 0, 0);
      setDueDate(tomorrow.toISOString().slice(0, 16));
      setMaxMarks(100);
      setStatus("published");
      setAttachments([]);
    }
    setError(null);
  }, [initialData, isOpen, classes]);

  const selectedClass = classes.find((c) => c._id === classId);
  const availableSubjects = selectedClass?.subjects || [];

  const handleClassChange = (selectedId: string) => {
    setClassId(selectedId);
    const cls = classes.find((c) => c._id === selectedId);
    if (cls) {
      if (cls.academicYear) setAcademicYear(cls.academicYear);
      if (cls.subjects && cls.subjects.length > 0) {
        setSubjectName(cls.subjects[0].subjectName);
      } else {
        setSubjectName("");
      }
    }
  };

  const handleAddAttachment = () => {
    if (!attName.trim() || !attUrl.trim()) return;
    setAttachments((prev) => [
      ...prev,
      {
        name: attName.trim(),
        url: attUrl.trim(),
        type: attUrl.endsWith(".pdf") ? "application/pdf" : "document",
      },
    ]);
    setAttName("");
    setAttUrl("");
  };

  const handleRemoveAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !description.trim() || !classId || !subjectName || !dueDate) {
      setError("Please fill in all required fields (Title, Description, Class, Subject, Due Date).");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        instructions: instructions.trim() || undefined,
        classId,
        academicYear,
        subjectName,
        teacherId: teacherId || null,
        dueDate: new Date(dueDate).toISOString(),
        maxMarks: Number(maxMarks),
        status,
        attachments,
      };

      const url = isEditing ? `/api/assignments/${initialData._id}` : "/api/assignments";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save assignment");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to submit assignment form");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              {isEditing ? "Edit Assignment / Homework" : "Create New Assignment"}
            </h3>
            <p className="text-xs text-slate-400">
              Publish homework instructions, due dates, documents, and maximum marks
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Assignment Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chapter 4: Calculus Problem Set"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Class, Academic Year, Subject */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Class & Section <span className="text-rose-400">*</span>
              </label>
              <select
                value={classId}
                onChange={(e) => handleClassChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Select Class</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.className} - {c.section}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Subject Name <span className="text-rose-400">*</span>
              </label>
              {availableSubjects.length > 0 ? (
                <select
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Select Subject</option>
                  {availableSubjects.map((s, idx) => (
                    <option key={idx} value={s.subjectName}>
                      {s.subjectName}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  required
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder="Mathematics"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Assigning Teacher
              </label>
              <select
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Select Teacher (Optional)</option>
                {teachers.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.firstName} {t.lastName} ({t.employeeId})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Description & Context <span className="text-rose-400">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of homework goals and topics covered..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Detailed Instructions (Optional)
            </label>
            <textarea
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Step-by-step instructions for completing the homework..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Due Date, Max Marks, Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Due Date & Time <span className="text-rose-400">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Max Marks <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                required
                min={1}
                value={maxMarks}
                onChange={(e) => setMaxMarks(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          {/* Attachments Section */}
          <div className="border border-slate-800 bg-slate-950/50 p-3.5 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-indigo-400" /> Reference Attachments / PDFs
              </span>
              <span className="text-[11px] text-slate-500">Metadata URL links</span>
            </div>

            {attachments.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {attachments.map((att, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="font-semibold text-white truncate">{att.name}</span>
                      <span className="text-[10px] text-slate-500 truncate max-w-xs">{att.url}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(i)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-5 gap-2 pt-1">
              <input
                type="text"
                placeholder="Doc Name (e.g. Worksheet.pdf)"
                value={attName}
                onChange={(e) => setAttName(e.target.value)}
                className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
              <input
                type="text"
                placeholder="File URL / storage link"
                value={attUrl}
                onChange={(e) => setAttUrl(e.target.value)}
                className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddAttachment}
                className="md:col-span-1 border-slate-700 text-xs text-indigo-400 hover:bg-slate-800 h-8"
              >
                <Plus className="w-3 h-3 mr-1" /> Add
              </Button>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              * Published assignments are immediately visible to class cohorts
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-slate-800 text-slate-300 hover:bg-slate-800 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                {loading ? "Saving..." : isEditing ? "Save Changes" : "Create Assignment"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

