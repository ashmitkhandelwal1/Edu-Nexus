"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Award,
  TrendingUp,
  Users,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Loader2,
  AlertCircle,
  Download,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface SubjectScore {
  subjectName: string;
  maxMarks: number;
  passMarks: number;
  marksObtained: number | null;
  isPassed: boolean;
}

interface StudentResult {
  student: {
    _id: string;
    admissionNumber: string;
    name: string;
    rollNumber: string;
  };
  subjects: SubjectScore[];
  totalObtained: number;
  totalMaxMarks: number;
  percentage: number;
  isOverallPass: boolean;
  grade: string;
  rank: number;
}

interface ResultsOverview {
  totalStudents: number;
  totalEvaluated: number;
  passedCount: number;
  failedCount: number;
  passPercentage: number;
  highestScore: number;
  averageScore: number;
  classAveragePercentage: number;
  totalExamMaxMarks: number;
}

interface ResultsClientProps {
  examId: string;
}

export function ResultsClient({ examId }: ResultsClientProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [exam, setExam] = useState<any>(null);
  const [overview, setOverview] = useState<ResultsOverview | null>(null);
  const [results, setResults] = useState<StudentResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchResults = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/exams/${examId}/results`);
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to load examination results.");
        setIsLoading(false);
        return;
      }

      setExam(data.exam);
      setOverview(data.overview);
      setResults(data.results || []);
      setIsLoading(false);
    } catch {
      setErrorMessage("Network error while connecting to server.");
      setIsLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const getGradeBadge = (grade: string) => {
    if (grade === "A+" || grade === "A") {
      return <Badge variant="success">{grade}</Badge>;
    }
    if (grade === "B" || grade === "C") {
      return <Badge variant="brand">{grade}</Badge>;
    }
    if (grade === "D" || grade === "E") {
      return <Badge variant="secondary">{grade}</Badge>;
    }
    return <Badge variant="default" className="bg-rose-600">{grade}</Badge>;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/exams"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors gap-1.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Examinations</span>
        </Link>
        <Link href={`/admin/exams/${examId}/marks`}>
          <Button variant="outline" size="sm" className="text-xs text-blue-600 border-blue-200 hover:bg-blue-50 gap-1.5">
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Enter / Review Marks</span>
          </Button>
        </Link>
      </div>

      {/* Header Banner */}
      {exam && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                {exam.examName} — Official Results &amp; Rankings
              </h1>
              <Badge variant="brand" className="text-xs capitalize">
                {exam.examType}
              </Badge>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Cohort: <strong className="text-slate-900">{exam.classId?.className} - {exam.classId?.section}</strong> • Academic Year: <span className="font-mono">{exam.academicYear}</span>
            </p>
          </div>
          <div className="text-xs text-slate-500 font-mono sm:text-right">
            <span>Assessment Window:</span>
            <p className="font-semibold text-slate-900">
              {exam.startDate} to {exam.endDate}
            </p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-500 space-y-2 bg-white rounded-2xl border border-slate-200/80">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <p className="text-xs font-medium">Tabulating class performance and rankings...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Key Metrics Overview */}
          {overview && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border border-slate-200/80 bg-white shadow-sm">
                <CardHeader className="p-4 pb-1">
                  <span className="text-[11px] font-semibold uppercase text-slate-500">
                    Cohort Pass Rate
                  </span>
                </CardHeader>
                <CardContent className="p-4 pt-1">
                  <div className="text-3xl font-extrabold text-emerald-600">
                    {overview.passPercentage}%
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {overview.passedCount} of {overview.totalEvaluated} students cleared
                  </span>
                </CardContent>
              </Card>

              <Card className="border border-slate-200/80 bg-white shadow-sm">
                <CardHeader className="p-4 pb-1">
                  <span className="text-[11px] font-semibold uppercase text-slate-500">
                    Class Average
                  </span>
                </CardHeader>
                <CardContent className="p-4 pt-1">
                  <div className="text-3xl font-extrabold text-blue-600">
                    {overview.averageScore}
                    <span className="text-xs text-slate-400 font-normal"> / {overview.totalExamMaxMarks}</span>
                  </div>
                  <span className="text-[10px] text-blue-600 font-medium">
                    {overview.classAveragePercentage}% aggregate
                  </span>
                </CardContent>
              </Card>

              <Card className="border border-slate-200/80 bg-white shadow-sm">
                <CardHeader className="p-4 pb-1">
                  <span className="text-[11px] font-semibold uppercase text-slate-500">
                    Highest Marks Scored
                  </span>
                </CardHeader>
                <CardContent className="p-4 pt-1">
                  <div className="text-3xl font-extrabold text-slate-900">
                    {overview.highestScore}
                    <span className="text-xs text-slate-400 font-normal"> / {overview.totalExamMaxMarks}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Rank #1 in Class
                  </span>
                </CardContent>
              </Card>

              <Card className="border border-slate-200/80 bg-white shadow-sm">
                <CardHeader className="p-4 pb-1">
                  <span className="text-[11px] font-semibold uppercase text-slate-500">
                    Students Evaluated
                  </span>
                </CardHeader>
                <CardContent className="p-4 pt-1">
                  <div className="text-3xl font-extrabold text-slate-900">
                    {overview.totalEvaluated}
                    <span className="text-xs text-slate-400 font-normal"> / {overview.totalStudents}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {overview.totalStudents - overview.totalEvaluated} pending evaluation
                  </span>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Results Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-950">
                  Comprehensive Student Scorecard &amp; Ranking
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ranked by total marks obtained. Students fail if any subject pass criterion is not met.
                </p>
              </div>
              <Badge variant="brand" className="text-xs">
                {results.length} Candidates
              </Badge>
            </div>

            {results.length === 0 ? (
              <div className="py-16 text-center px-4">
                <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">No student records to evaluate</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-4">Rank</th>
                      <th className="py-3 px-4">Roll</th>
                      <th className="py-3 px-4">Student</th>
                      {/* Dynamic Subject Headers */}
                      {exam?.subjects?.map((sub: { subjectName: string; maxMarks: number }) => (
                        <th key={sub.subjectName} className="py-3 px-4">
                          {sub.subjectName} ({sub.maxMarks}m)
                        </th>
                      ))}
                      <th className="py-3 px-4">Total</th>
                      <th className="py-3 px-4">Percentage</th>
                      <th className="py-3 px-4">Grade</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {results.map((item) => (
                      <tr key={item.student._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          #{item.rank}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-slate-600">
                          {item.student.rollNumber || "—"}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          <Link
                            href={`/admin/students/${item.student._id}`}
                            className="hover:text-blue-600"
                          >
                            {item.student.name}
                          </Link>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {item.student.admissionNumber}
                          </span>
                        </td>
                        {/* Dynamic Subject Score Columns */}
                        {item.subjects.map((sub) => (
                          <td key={sub.subjectName} className="py-3 px-4 font-mono">
                            {sub.marksObtained === null ? (
                              <span className="text-slate-400 italic">—</span>
                            ) : (
                              <span
                                className={`font-semibold ${
                                  sub.isPassed ? "text-slate-900" : "text-rose-600"
                                }`}
                              >
                                {sub.marksObtained}
                              </span>
                            )}
                          </td>
                        ))}
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {item.totalObtained} / {item.totalMaxMarks}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {item.percentage}%
                        </td>
                        <td className="py-3 px-4">{getGradeBadge(item.grade)}</td>
                        <td className="py-3 px-4">
                          {item.isOverallPass ? (
                            <Badge variant="success" className="text-[10px]">
                              Passed
                            </Badge>
                          ) : (
                            <Badge variant="default" className="bg-rose-600 text-[10px]">
                              Failed
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

