import React from "react";
import { FileText } from "lucide-react";
import { getStudentProfile } from "@/lib/student-auth";
import { StudentShell } from "@/components/student/StudentShell";
import { Assignment } from "@/models/Assignment";
import { Submission } from "@/models/Submission";
import { StudentAssignmentsClient } from "@/components/student/StudentAssignmentsClient";
import "@/models/Teacher";

export default async function StudentAssignmentsPage() {
  const { user, student, classDoc } = await getStudentProfile();

  const classId = classDoc?._id || student.classId;

  let assignments: any[] = [];
  if (classId) {
    assignments = await Assignment.find({
      classId,
      status: { $in: ["published", "closed"] },
    })
      .populate("teacherId", "firstName lastName email")
      .sort({ dueDate: 1 })
      .lean();
  }

  // Load submissions strictly for this student
  const submissions = await Submission.find({
    studentId: student._id,
  }).lean();

  const submissionMap = new Map<string, any>();
  submissions.forEach((s) => {
    submissionMap.set(s.assignmentId.toString(), s);
  });

  // Attach submission data to each assignment
  const assignmentsWithSubmissions = assignments.map((a) => {
    const sub = submissionMap.get(a._id.toString()) || null;
    return {
      _id: a._id.toString(),
      title: a.title,
      description: a.description,
      instructions: a.instructions,
      subjectName: a.subjectName,
      teacherId: a.teacherId
        ? {
            firstName: a.teacherId.firstName,
            lastName: a.teacherId.lastName,
          }
        : undefined,
      assignedDate: a.assignedDate ? new Date(a.assignedDate).toISOString() : new Date().toISOString(),
      dueDate: new Date(a.dueDate).toISOString(),
      maxMarks: a.maxMarks,
      status: a.status,
      submission: sub
        ? {
            _id: sub._id.toString(),
            submittedAt: new Date(sub.submittedAt).toISOString(),
            textAnswer: sub.textAnswer,
            status: sub.status,
            marksObtained: sub.marksObtained,
            feedback: sub.feedback,
            gradedAt: sub.gradedAt ? new Date(sub.gradedAt).toISOString() : undefined,
          }
        : null,
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
          <div className="flex items-center gap-2.5 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" /> Coursework & Submissions
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            My Homework & Assignments
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            View assigned coursework, submit responses, track deadlines, and review evaluated marks.
          </p>
        </div>

        <StudentAssignmentsClient
          studentId={student._id.toString()}
          assignments={assignmentsWithSubmissions}
        />
      </div>
    </StudentShell>
  );
}

