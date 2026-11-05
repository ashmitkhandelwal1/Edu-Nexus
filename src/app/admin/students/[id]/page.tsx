import { notFound } from "next/navigation";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import { Student } from "@/models/Student";
import { getAuthenticatedUser } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { StudentProfileClient } from "@/components/admin/StudentProfileClient";

interface StudentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentDetailPage({
  params,
}: StudentDetailPageProps) {
  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    notFound();
  }

  const user = await getAuthenticatedUser();
  await connectToDatabase();

  const student = await Student.findById(id).lean();

  if (!student) {
    notFound();
  }

  // Convert ObjectIds and Dates to plain JSON-safe format
  const serializedStudent = JSON.parse(JSON.stringify(student));

  return (
    <AdminShell adminEmail={user?.email || "admin@edunexus.internal"}>
      <StudentProfileClient student={serializedStudent} />
    </AdminShell>
  );
}

