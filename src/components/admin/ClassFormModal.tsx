"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, AlertCircle, Save, Plus, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ClassSubjectInput {
  subjectName: string;
  teacher: string;
}

export interface ClassFormData {
  className: string;
  section: string;
  academicYear: string;
  classTeacher: string;
  subjects: ClassSubjectInput[];
  roomNumber: string;
  capacity: number;
}

interface TeacherOption {
  _id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  department: string;
}

interface ClassFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: ClassFormData | null;
  classId?: string | null;
}

const defaultFormData: ClassFormData = {
  className: "",
  section: "",
  academicYear: "2026-27",
  classTeacher: "",
  subjects: [],
  roomNumber: "",
  capacity: 40,
};

export function ClassFormModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  classId,
}: ClassFormModalProps) {
  const [formData, setFormData] = useState<ClassFormData>(
    initialData || defaultFormData
  );
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load teacher options for dropdowns
  useEffect(() => {
    if (isOpen) {
      fetch("/api/teachers?limit=100&status=active")
        .then((res) => res.json())
        .then((data) => {
          if (data.teachers) setTeachers(data.teachers);
        })
        .catch(() => {});
    }
  }, [isOpen]);

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
    setFormData((prev) => ({
      ...prev,
      [name]: name === "capacity" ? parseInt(value, 10) || 0 : value,
    }));
  };

  const handleAddSubject = () => {
    setFormData((prev) => ({
      ...prev,
      subjects: [...prev.subjects, { subjectName: "", teacher: "" }],
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
    field: "subjectName" | "teacher",
    val: string
  ) => {
    setFormData((prev) => {
      const updated = [...prev.subjects];
      updated[index] = { ...updated[index], [field]: val };
      return { ...prev, subjects: updated };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    // Validate subjects
    const validSubjects = formData.subjects
      .filter((s) => s.subjectName.trim())
      .map((s) => ({
        subjectName: s.subjectName.trim(),
        teacher: s.teacher || undefined,
      }));

    const payload = {
      ...formData,
      subjects: validSubjects,
    };

    try {
      const url = classId ? `/api/classes/${classId}` : "/api/classes";
      const method = classId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to save class record.");
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      onSuccess();
      onClose();
    } catch {
      setErrorMessage("An unexpected network error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xl w-full max-w-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">
              {classId ? "Edit Class & Section" : "Create New Class & Section"}
            </h2>
            <p className="text-xs text-slate-400">
              Configure grade level, section, room allocation and class teacher
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
          {/* Basic Class Details */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3 pb-1 border-b border-slate-100">
              1. Class Specifications
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Class Name *
                </label>
                <input
                  type="text"
                  name="className"
                  required
                  placeholder="e.g. Class 10"
                  value={formData.className}
                  onChange={handleChange}
                  className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Section *
                </label>
                <input
                  type="text"
                  name="section"
                  required
                  placeholder="e.g. A"
                  value={formData.section}
                  onChange={handleChange}
                  className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Academic Year *
                </label>
                <input
                  type="text"
                  name="academicYear"
                  required
                  placeholder="e.g. 2026-27"
                  value={formData.academicYear}
                  onChange={handleChange}
                  className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Room Number
                </label>
                <input
                  type="text"
                  name="roomNumber"
                  placeholder="e.g. Room 204"
                  value={formData.roomNumber}
                  onChange={handleChange}
                  className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Seat Capacity *
                </label>
                <input
                  type="number"
                  name="capacity"
                  required
                  min={1}
                  value={formData.capacity}
                  onChange={handleChange}
                  className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Class Teacher
                </label>
                <select
                  name="classTeacher"
                  value={formData.classTeacher}
                  onChange={handleChange}
                  className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  <option value="">Unassigned</option>
                  {teachers.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.firstName} {t.lastName} ({t.employeeId})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Subject & Teacher Mapping */}
          <div>
            <div className="flex items-center justify-between mb-3 pb-1 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600">
                2. Subject & Teacher Allocations
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

            {formData.subjects.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                No subjects assigned yet. Click &quot;Add Subject&quot; to configure curriculum mappings.
              </p>
            ) : (
              <div className="space-y-2.5">
                {formData.subjects.map((s, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Subject Name (e.g. Physics)"
                      value={s.subjectName}
                      onChange={(e) =>
                        handleSubjectChange(index, "subjectName", e.target.value)
                      }
                      className="flex-1 text-xs rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                    <select
                      value={s.teacher}
                      onChange={(e) =>
                        handleSubjectChange(index, "teacher", e.target.value)
                      }
                      className="flex-1 text-xs rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    >
                      <option value="">Select Faculty</option>
                      {teachers.map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.firstName} {t.lastName}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubject(index)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                      title="Remove Subject"
                    >
                      <Trash className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
                  <span>{classId ? "Update Class" : "Create Class"}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

