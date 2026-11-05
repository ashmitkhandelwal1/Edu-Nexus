import { redirect } from "next/navigation";
import connectToDatabase from "@/lib/mongodb";
import { getAuthenticatedUser } from "@/lib/auth";
import { Student } from "@/models/Student";
import { Class } from "@/models/Class";

export async function getStudentProfile() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/login");
  }

  if (user.role !== "student") {
    redirect("/unauthorized");
  }

  await connectToDatabase();

  // Find active student by email (case-insensitive)
  const student = await Student.findOne({
    email: user.email.toLowerCase(),
    status: "active",
  }).lean();

  if (!student) {
    redirect("/unauthorized");
  }

  // Lookup class details if classId exists or by className + section
  let classDoc = null;
  if (student.classId) {
    classDoc = await Class.findById(student.classId).lean();
  } else if (student.className && student.section) {
    classDoc = await Class.findOne({
      className: new RegExp(`^${student.className}$`, "i"),
      section: new RegExp(`^${student.section}$`, "i"),
    }).lean();
  }

  return {
    user,
    student: JSON.parse(JSON.stringify(student)),
    classDoc: classDoc ? JSON.parse(JSON.stringify(classDoc)) : null,
  };
}

