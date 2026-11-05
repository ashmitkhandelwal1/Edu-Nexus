import { notFound } from "next/navigation";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import { Exam } from "@/models/Exam";
import "@/models/Class";
import { getAuthenticatedUser } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { MarksEntryClient } from "@/components/admin/MarksEntryClient";

interface MarksEntryPageProps {
  params: Promise<{ id: string }>;
}

export default async function MarksEntryPage({
  params,
}: MarksEntryPageProps) {
  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    notFound();
  }

  const user = await getAuthenticatedUser();
  await connectToDatabase();

  const exam = await Exam.findById(id)
    .populate("classId", "className section academicYear")
    .lean();

  if (!exam) {
    notFound();
  }

  const serializedExam = JSON.parse(JSON.stringify(exam));

  return (
    <AdminShell adminEmail={user?.email || "admin@edunexus.internal"}>
      <MarksEntryClient exam={serializedExam} />
    </AdminShell>
  );
}

