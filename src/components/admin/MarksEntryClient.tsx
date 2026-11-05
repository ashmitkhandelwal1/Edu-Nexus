"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  Award,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ExamSubject {
  subjectName: string;
  maxMarks: number;
  passMarks: number;
}

interface StudentItem {
  _id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  rollNumber?: string;
}

interface StudentMarksRow {
  studentId: string;
  admissionNumber: string;
  name: string;
  rollNumber?: string;
  marksObtained: number | "";
  remarks: string;
}

interface MarksEntryClientProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  exam: any;
}

export function MarksEntryClient({ exam }: MarksEntryClientProps) {
  const subjects: ExamSubject[] = exam.subjects || [];
  const [selectedSubject, setSelectedSubject] = useState<string>(
    subjects.length > 0 ? subjects[0].subjectName : ""
  );

  const [rows, setRows] = useState<StudentMarksRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const currentSubjectConfig = subjects.find(
    (s) => s.subjectName.toLowerCase() === selectedSubject.toLowerCase()
  );

  const loadStudentsAndMarks = useCallback(async () => {
    if (!selectedSubject) return;

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // 1. Get class students
      const studentsRes = await fetch(`/api/classes/${exam.classId._id || exam.classId}/students`);
      const studentsData = await studentsRes.json();

      if (!studentsRes.ok) {
        setErrorMessage(studentsData.error || "Failed to load class roster.");
        setIsLoading(false);
        return;
      }

      const students: StudentItem[] = studentsData.students || [];

      // 2. Get existing marks for this exam + subject
      const marksRes = await fetch(
        `/api/marks?examId=${exam._id}&subjectName=${encodeURIComponent(selectedSubject)}`
      );
      const marksData = await marksRes.json();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const marksMap = new Map<string, any>();
      if (marksData.marks) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        marksData.marks.forEach((m: any) => {
          const sId = typeof m.studentId === "object" ? m.studentId._id : m.studentId;
          marksMap.set(sId, m);
        });
      }

      // 3. Compose rows
      const studentRows: StudentMarksRow[] = students.map((st) => {
        const existing = marksMap.get(st._id);
        return {
          studentId: st._id,
          admissionNumber: st.admissionNumber,
          name: `${st.firstName} ${st.lastName}`,
          rollNumber: st.rollNumber,
          marksObtained: existing ? existing.marksObtained : "",
          remarks: existing?.remarks || "",
        };
      });

      setRows(studentRows);
      setIsLoading(false);
    } catch {
      setErrorMessage("Network error while loading marks data.");
      setIsLoading(false);
    }
  }, [exam._id, exam.classId, selectedSubject]);

  useEffect(() => {
    loadStudentsAndMarks();
  }, [loadStudentsAndMarks]);

  const handleMarksChange = (index: number, valStr: string) => {
    const val = valStr === "" ? "" : Number(valStr);
    setRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], marksObtained: val };
      return updated;
    });
  };

  const handleRemarksChange = (index: number, val: string) => {
    setRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], remarks: val };
      return updated;
    });
  };

  const handleSaveMarks = async () => {
    if (rows.length === 0 || !currentSubjectConfig) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    // Validate in-memory bounds
    for (const r of rows) {
      if (r.marksObtained !== "") {
        if (Number(r.marksObtained) < 0) {
          setErrorMessage(`Marks for ${r.name} cannot be negative.`);
          return;
        }
        if (Number(r.marksObtained) > currentSubjectConfig.maxMarks) {
          setErrorMessage(
            `Marks for ${r.name} (${r.marksObtained}) exceed maximum allowable marks (${currentSubjectConfig.maxMarks}).`
          );
          return;
        }
      }
    }

    setIsSaving(true);

    try {
      // Filter out rows that have no marks entered
      const validRecords = rows
        .filter((r) => r.marksObtained !== "")
        .map((r) => ({
          studentId: r.studentId,
          marksObtained: Number(r.marksObtained),
          remarks: r.remarks,
        }));

      if (validRecords.length === 0) {
        setErrorMessage("Please enter marks for at least one student before saving.");
        setIsSaving(false);
        return;
      }

      const res = await fetch("/api/marks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId: exam._id,
          subjectName: selectedSubject,
          records: validRecords,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to record marks.");
        setIsSaving(false);
        return;
      }

      setSuccessMessage(
        `Successfully saved marks for ${validRecords.length} student(s) in "${selectedSubject}".`
      );
      setIsSaving(false);
    } catch {
      setErrorMessage("Network error while recording marks.");
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/exams"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors gap-1.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Examinations</span>
        </Link>
        <Link href={`/admin/exams/${exam._id}/results`}>
          <Button variant="outline" size="sm" className="text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50 gap-1.5">
            <Award className="h-3.5 w-3.5" />
            <span>View Class Rank &amp; Results</span>
          </Button>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
              {exam.examName}
            </h1>
            <Badge variant="brand" className="text-xs capitalize">
              {exam.examType}
            </Badge>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Class: <span className="font-semibold text-slate-900">{exam.classId?.className} - {exam.classId?.section}</span> • Academic Year: <span className="font-mono">{exam.academicYear}</span>
          </p>
        </div>

        {/* Subject Selector Tabs */}
        <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          {subjects.map((sub) => (
            <button
              key={sub.subjectName}
              onClick={() => setSelectedSubject(sub.subjectName)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedSubject.toLowerCase() === sub.subjectName.toLowerCase()
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {sub.subjectName} ({sub.maxMarks}m)
            </button>
          ))}
        </div>
      </div>

      {/* Subject Thresholds Callout */}
      {currentSubjectConfig && (
        <div className="bg-slate-50 border border-slate-200 px-5 py-3 rounded-xl flex items-center justify-between text-xs text-slate-600">
          <div>
            Subject: <strong className="text-slate-900">{currentSubjectConfig.subjectName}</strong>
          </div>
          <div className="flex items-center gap-4">
            <span>
              Maximum Marks: <strong className="text-slate-900">{currentSubjectConfig.maxMarks}</strong>
            </span>
            <span>
              Passing Marks: <strong className="text-slate-900">{currentSubjectConfig.passMarks}</strong>
            </span>
          </div>
        </div>
      )}

      {/* Alerts */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Marks Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500 space-y-2">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <p className="text-xs font-medium">Loading class roster and recorded marks...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center px-4">
            <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">No students enrolled in this class</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Enroll students into {exam.classId?.className} to evaluate marks.
            </p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Roll</th>
                    <th className="py-3 px-4">Admission #</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4 w-44">
                      Marks Obtained (/{currentSubjectConfig?.maxMarks})
                    </th>
                    <th className="py-3 px-4">Evaluation Status</th>
                    <th className="py-3 px-4">Remarks (Optional)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row, index) => {
                    const isEntered = row.marksObtained !== "";
                    const isPass =
                      isEntered && currentSubjectConfig
                        ? Number(row.marksObtained) >= currentSubjectConfig.passMarks
                        : false;

                    return (
                      <tr key={row.studentId} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-slate-600">
                          {row.rollNumber || "—"}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700">
                          {row.admissionNumber}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {row.name}
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            min={0}
                            max={currentSubjectConfig?.maxMarks || 100}
                            placeholder="Enter marks"
                            value={row.marksObtained}
                            onChange={(e) => handleMarksChange(index, e.target.value)}
                            className={`w-28 text-xs font-mono font-semibold rounded-lg border px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-600 ${
                              isEntered && currentSubjectConfig && Number(row.marksObtained) > currentSubjectConfig.maxMarks
                                ? "border-rose-400 bg-rose-50 text-rose-700"
                                : "border-slate-200 text-slate-900 bg-white"
                            }`}
                          />
                        </td>
                        <td className="py-3 px-4">
                          {!isEntered ? (
                            <span className="text-slate-400 italic">Pending Entry</span>
                          ) : isPass ? (
                            <Badge variant="success" className="text-[10px]">
                              Pass
                            </Badge>
                          ) : (
                            <Badge variant="default" className="bg-rose-600 text-[10px]">
                              Fail (&lt; {currentSubjectConfig?.passMarks})
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            placeholder="e.g. Good theoretical grasp"
                            value={row.remarks}
                            onChange={(e) => handleRemarksChange(index, e.target.value)}
                            className="w-full text-xs rounded-lg border border-slate-200 px-3 py-1.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Save Marks Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="text-xs text-slate-500">
                Evaluation subject: <strong>{selectedSubject}</strong> (Max: {currentSubjectConfig?.maxMarks} marks).
              </span>
              <Button
                onClick={handleSaveMarks}
                disabled={isSaving || rows.length === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold gap-1.5 shadow-sm px-6"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving Marks...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    <span>Save {selectedSubject} Marks</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

