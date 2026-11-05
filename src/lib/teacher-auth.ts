import { redirect } from "next/navigation";
import connectToDatabase from "@/lib/mongodb";
import { getAuthenticatedUser } from "@/lib/auth";
import { Teacher } from "@/models/Teacher";
import { Class } from "@/models/Class";

export async function getTeacherProfile() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/login");
  }

  if (user.role !== "teacher") {
    redirect("/unauthorized");
  }

  await connectToDatabase();

  const teacher = await Teacher.findOne({
    email: user.email.toLowerCase(),
    status: "active",
  }).lean();

  if (!teacher) {
    redirect("/unauthorized");
  }

  // Find classes where teacher is either classTeacher OR assigned in subjects array
  const assignedClasses = await Class.find({
    $or: [
      { classTeacher: teacher._id },
      { "subjects.teacher": teacher._id },
    ],
  }).lean();

  return {
    user,
    teacher: JSON.parse(JSON.stringify(teacher)),
    assignedClasses: JSON.parse(JSON.stringify(assignedClasses)),
    assignedClassIds: assignedClasses.map((c) => c._id.toString()),
  };
}

