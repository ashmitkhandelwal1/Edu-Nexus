import { notFound } from "next/navigation";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import { Teacher } from "@/models/Teacher";
import { getAuthenticatedUser } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { TeacherProfileClient } from "@/components/admin/TeacherProfileClient";

interface TeacherDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TeacherDetailPage({
  params,
}: TeacherDetailPageProps) {
  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    notFound();
  }

  const user = await getAuthenticatedUser();
  await connectToDatabase();

  const teacher = await Teacher.findById(id).lean();

  if (!teacher) {
    notFound();
  }

  // Convert ObjectIds and Dates to plain JSON-safe format
  const serializedTeacher = JSON.parse(JSON.stringify(teacher));

  return (
    <AdminShell adminEmail={user?.email || "admin@edunexus.internal"}>
      <TeacherProfileClient teacher={serializedTeacher} />
    </AdminShell>
  );
}

