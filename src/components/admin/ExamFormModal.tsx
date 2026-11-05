"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, AlertCircle, Save, Plus, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ExamSubjectInput {
  subjectName: string;
  maxMarks: number;
  passMarks: number;
  teacherId: string;
}

export interface ExamFormData {
  examName: string;
  examType: "unit-test" | "mid-term" | "final" | "practical" | "other";
  classId: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  subjects: ExamSubjectInput[];
  status: "draft" | "ongoing" | "completed" | "published";
}

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

interface ExamFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: ExamFormData | null;
  examId?: string | null;
}

const defaultFormData: ExamFormData = {
  examName: "",
  examType: "unit-test",
  classId: "",
  academicYear: "2026-27",
  startDate: new Date().toISOString().split("T")[0],
  endDate: new Date().toISOString().split("T")[0],
  subjects: [{ subjectName: "", maxMarks: 100, passMarks: 33, teacherId: "" }],
  status: "draft",
};

export function ExamFormModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  examId,
}: ExamFormModalProps) {
  const [formData, setFormData] = useState<ExamFormData>(
    initialData || defaultFormData
  );
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Load classes
      fetch("/api/classes?limit=100")
        .then((res) => res.json())
        .then((data) => {
          if (data.classes) {
            setClasses(data.classes);
            if (!initialData && data.classes.length > 0 && !formData.classId) {
              setFormData((prev) => ({ ...prev, classId: data.classes[0]._id }));
            }
          }
        })
        .catch(() => {});

      // Load teachers
      fetch("/api/teachers?limit=100&status=active")
        .then((res) => res.json())
        .then((data) => {
          if (data.teachers) setTeachers(data.teachers);
        })
        .catch(() => {});
    }
  }, [isOpen, initialData, formData.classId]);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData(defaultFormData);
    }
    setErrorMessage(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSubject = () => {
    setFormData((prev) => ({
      ...prev,
      subjects: [
        ...prev.subjects,
        { subjectName: "", maxMarks: 100, passMarks: 33, teacherId: "" },
      ],
    }));
  };

  const handleRemoveSubject = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((_, i) => i !== index),
    }));
  };

  const handleSubjectChange = (
    index: number,
    field: keyof ExamSubjectInput,
    value: string | number
  ) => {
    setFormData((prev) => {
      const updated = [...prev.subjects];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, subjects: updated };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    // Validation
    if (formData.subjects.length === 0) {
      setErrorMessage("Please add at least one subject to this examination.");
      setIsLoading(false);
      return;
    }

    for (const sub of formData.subjects) {
      if (!sub.subjectName.trim()) {
        setErrorMessage("All subject names must be specified.");
        setIsLoading(false);
        return;
      }
      if (Number(sub.passMarks) > Number(sub.maxMarks)) {
        setErrorMessage(
          `Passing marks (${sub.passMarks}) cannot exceed max marks (${sub.maxMarks}) for ${sub.subjectName}.`
        );
        setIsLoading(false);
        return;
      }
    }

    try {
      const url = examId ? `/api/exams/${examId}` : "/api/exams";
      const method = examId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to save examination schedule.");
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      onSuccess();
      onClose();
    } catch {
      setErrorMessage("Network error while communicating with server.");
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xl w-full max-w-3xl overflow-hidden my-8">
        <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">
              {examId ? "Edit Examination Schedule" : "Create Examination Schedule"}
            </h2>
            <p className="text-xs text-slate-400">
              Configure curriculum, maximum scores, passing marks and assigned evaluators
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Section 1: Exam Metadata */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3 pb-1 border-b border-slate-100">
              1. Examination Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Examination Title *
                </label>
                <input
                  type="text"
                  name="examName"
                  required
                  placeholder="e.g. Mid-Term Examination 2026"
                  value={formData.examName}
                  onChange={handleChange}
                  className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Exam Type *
                </label>
                <select
                  name="examType"
                  value={formData.examType}
                  onChange={handleChange}
                  className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  <option value="unit-test">Unit Test</option>
                  <option value="mid-term">Mid-Term</option>
                  <option value="final">Final Exam</option>
                  <option value="practical">Practical</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Class & Section *
                </label>
                <select
                  name="classId"
                  required
                  value={formData.classId}
                  onChange={handleChange}
                  className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  <option value="">Select Class Cohort</option>
                  {classes.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.className} - {c.section} ({c.academicYear})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Academic Year *
                </label>
                <input
                  type="text"
                  name="academicYear"
                  required
                  value={formData.academicYear}
                  onChange={handleChange}
                  className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lifecycle Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  <option value="draft">Draft</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="published">Published</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  name="startDate"
                  required
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  name="endDate"
                  required
                  value={formData.endDate}
                  onChange={handleChange}
                  className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Subjects & Max Marks Mapping */}
          <div>
            <div className="flex items-center justify-between mb-3 pb-1 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600">
                2. Evaluation Curriculum &amp; Passing Thresholds
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddSubject}
                className="h-7 text-[11px] gap-1 px-2 text-blue-600 hover:bg-blue-50"
              >
                <Plus className="h-3 w-3" />
                <span>Add Subject</span>
              </Button>
            </div>

            <div className="space-y-3">
              {formData.subjects.map((sub, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/70 items-center"
                >
                  <div className="sm:col-span-4">
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">
                      Subject Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mathematics"
                      value={sub.subjectName}
                      onChange={(e) =>
                        handleSubjectChange(index, "subjectName", e.target.value)
                      }
                      className="w-full text-xs rounded-lg border border-slate-200 px-2.5 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">
                      Max Marks
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={sub.maxMarks}
                      onChange={(e) =>
                        handleSubjectChange(
                          index,
                          "maxMarks",
                          parseInt(e.target.value, 10) || 0
                        )
                      }
                      className="w-full text-xs rounded-lg border border-slate-200 px-2.5 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">
                      Pass Marks
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={sub.passMarks}
                      onChange={(e) =>
                        handleSubjectChange(
                          index,
                          "passMarks",
                          parseInt(e.target.value, 10) || 0
                        )
                      }
                      className="w-full text-xs rounded-lg border border-slate-200 px-2.5 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">
                      Evaluator (Optional)
                    </label>
                    <select
                      value={sub.teacherId}
                      onChange={(e) =>
                        handleSubjectChange(index, "teacherId", e.target.value)
                      }
                      className="w-full text-xs rounded-lg border border-slate-200 px-2.5 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                    >
                      <option value="">Unassigned</option>
                      {teachers.map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.firstName} {t.lastName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveSubject(index)}
                      disabled={formData.subjects.length <= 1}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 disabled:opacity-30 mt-3 sm:mt-0"
                      title="Remove subject"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isLoading}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 shadow-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  <span>{examId ? "Update Examination" : "Schedule Exam"}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

