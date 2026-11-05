import { notFound } from "next/navigation";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import { Class } from "@/models/Class";
import { Student } from "@/models/Student";
import "@/models/Teacher";
import { getAuthenticatedUser } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { ClassDetailClient } from "@/components/admin/ClassDetailClient";

interface ClassDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ClassDetailPage({
  params,
}: ClassDetailPageProps) {
  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    notFound();
  }

  const user = await getAuthenticatedUser();
  await connectToDatabase();

  const classRecord = await Class.findById(id)
    .populate("classTeacher", "firstName lastName employeeId email department")
    .populate("subjects.teacher", "firstName lastName employeeId email department")
    .lean();

  if (!classRecord) {
    notFound();
  }

  // Get enrolled students
  const enrolledStudents = await Student.find({
    $or: [
      { classId: classRecord._id },
      {
        classId: { $exists: false },
        className: classRecord.className,
        section: classRecord.section,
      },
    ],
    status: "active",
  })
    .select("admissionNumber firstName lastName rollNumber email phone status")
    .sort({ rollNumber: 1, firstName: 1 })
    .lean();

  const studentCount = enrolledStudents.length;

  const serializedClass = JSON.parse(
    JSON.stringify({
      ...classRecord,
      studentCount,
      availableSeats: Math.max(0, classRecord.capacity - studentCount),
      students: enrolledStudents,
    })
  );

  return (
    <AdminShell adminEmail={user?.email || "admin@edunexus.internal"}>
      <ClassDetailClient initialClass={serializedClass} />
    </AdminShell>
  );
}

