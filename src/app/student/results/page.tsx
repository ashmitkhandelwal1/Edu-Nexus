import React from "react";
import { Award, CheckCircle2, XCircle, TrendingUp, Calendar, AlertCircle } from "lucide-react";
import { getStudentProfile } from "@/lib/student-auth";
import { StudentShell } from "@/components/student/StudentShell";
import { Exam } from "@/models/Exam";
import { Marks } from "@/models/Marks";

export default async function StudentResultsPage() {
  const { user, student, classDoc } = await getStudentProfile();

  const classId = classDoc?._id || student.classId;

  // STRICT REQUIREMENT: Only fetch published exams. Draft, ongoing, and completed without publication MUST NOT be shown!
  let publishedExams: any[] = [];
  if (classId) {
    publishedExams = await Exam.find({
      classId,
      status: "published",
    })
      .sort({ startDate: -1 })
      .lean();
  }

  const publishedExamIds = publishedExams.map((e) => e._id);

  // Fetch marks strictly for this student and published exams
  const marksList = await Marks.find({
    studentId: student._id,
    examId: { $in: publishedExamIds },
  }).lean();

  // Group marks by Exam
  const examReports = publishedExams.map((exam) => {
    const examMarks = marksList.filter(
      (m) => m.examId.toString() === exam._id.toString()
    );

    // Merge marks with exam subject configs
    let totalObtained = 0;
    let totalMax = 0;
    let hasFail = false;

    const subjectsSummary = exam.subjects.map((subj: any) => {
      const markEntry = examMarks.find(
        (m) => m.subjectName.toLowerCase() === subj.subjectName.toLowerCase()
      );

      const marksObtained = markEntry ? markEntry.marksObtained : 0;
      const passMarks = subj.passMarks;
      const maxMarks = subj.maxMarks;
      const isPass = marksObtained >= passMarks;

      if (!isPass) hasFail = true;
      totalObtained += marksObtained;
      totalMax += maxMarks;

      // Grade calculation
      const pct = maxMarks > 0 ? (marksObtained / maxMarks) * 100 : 0;
      let grade = "F";
      if (pct >= 90) grade = "A+";
      else if (pct >= 80) grade = "A";
      else if (pct >= 70) grade = "B+";
      else if (pct >= 60) grade = "B";
      else if (pct >= 50) grade = "C";
      else if (pct >= 40) grade = "D";

      return {
        subjectName: subj.subjectName,
        maxMarks,
        passMarks,
        marksObtained,
        percentage: Math.round(pct),
        grade,
        isPass,
        remarks: markEntry?.remarks || "",
        isRecorded: !!markEntry,
      };
    });

    const overallPercentage =
      totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
    const overallPassed = !hasFail && examMarks.length > 0;

    return {
      exam,
      subjectsSummary,
      totalObtained,
      totalMax,
      overallPercentage,
      overallPassed,
      recordedCount: examMarks.length,
      totalSubjects: exam.subjects.length,
    };
  });

  return (
    <StudentShell
      studentEmail={user.email}
      studentName={`${student.firstName} ${student.lastName}`}
      admissionNumber={student.admissionNumber}
      className={student.className}
      section={student.section}
    >
      <div className="space-y-8">
        <div className="pb-6 border-b border-slate-800">
          <div className="flex items-center gap-2.5 text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">
            <Award className="w-4 h-4" /> Official Examination Records
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            My Examination Results
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Certified report cards for all officially published examinations.
          </p>
        </div>

        {examReports.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-500">
            <Award className="w-12 h-12 mx-auto mb-3 opacity-40 text-purple-400" />
            <p className="text-lg font-bold text-slate-300">No Published Results Available</p>
            <p className="text-sm text-slate-500 mt-1">
              Examination results will be visible here once they have been finalized and officially published.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {examReports.map((report) => (
              <div
                key={report.exam._id}
                className="rounded-2xl bg-slate-900/90 border border-slate-800/80 overflow-hidden"
              >
                {/* Exam Header */}
                <div className="p-6 bg-slate-950/70 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs px-2.5 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 font-semibold uppercase">
                        {report.exam.examType}
                      </span>
                      <span className="text-xs text-slate-400">
                        Academic Year: {report.exam.academicYear}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-white mt-1.5">
                      {report.exam.examName}
                    </h2>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Exam Period: {report.exam.startDate} to {report.exam.endDate}
                    </div>
                  </div>

                  {/* Overall Result Pill */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs uppercase tracking-wider text-slate-400 font-medium">
                        Total Score
                      </div>
                      <div className="text-lg font-black text-white">
                        {report.totalObtained} / {report.totalMax}
                      </div>
                      <div className="text-xs font-semibold text-sky-400">
                        {report.overallPercentage}%
                      </div>
                    </div>

                    <div
                      className={`px-4 py-2 rounded-xl border flex items-center gap-2 font-bold text-sm ${
                        report.overallPassed
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                      }`}
                    >
                      {report.overallPassed ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" /> Passed
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" /> Needs Improvement
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Subject-Wise Marks Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-950/40 border-b border-slate-800 text-xs font-semibold uppercase text-slate-400">
                      <tr>
                        <th className="px-6 py-4">Subject</th>
                        <th className="px-6 py-4">Max Marks</th>
                        <th className="px-6 py-4">Pass Marks</th>
                        <th className="px-6 py-4">Marks Obtained</th>
                        <th className="px-6 py-4">Percentage</th>
                        <th className="px-6 py-4">Grade</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {report.subjectsSummary.map((sub: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-800/30 transition">
                          <td className="px-6 py-4 font-bold text-white">{sub.subjectName}</td>
                          <td className="px-6 py-4 text-slate-400 font-mono">{sub.maxMarks}</td>
                          <td className="px-6 py-4 text-slate-400 font-mono">{sub.passMarks}</td>
                          <td className="px-6 py-4 font-mono font-bold text-sky-400">
                            {sub.isRecorded ? sub.marksObtained : "—"}
                          </td>
                          <td className="px-6 py-4 text-slate-300 font-mono">
                            {sub.isRecorded ? `${sub.percentage}%` : "—"}
                          </td>
                          <td className="px-6 py-4 font-bold text-purple-400">
                            {sub.isRecorded ? sub.grade : "—"}
                          </td>
                          <td className="px-6 py-4">
                            {sub.isRecorded ? (
                              sub.isPass ? (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Pass
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-400">
                                  <XCircle className="w-3.5 h-3.5" /> Fail
                                </span>
                              )
                            ) : (
                              <span className="text-xs text-slate-500">Not recorded</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-400">
                            {sub.remarks || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </StudentShell>
  );
}

