import { z } from "zod";

export const examSubjectSchema = z.object({
  subjectName: z.string().trim().min(1, "Subject name is required"),
  maxMarks: z.coerce.number().min(1, "Max marks must be at least 1").default(100),
  passMarks: z.coerce.number().min(0, "Pass marks cannot be negative").default(33),
  teacherId: z.string().trim().optional().or(z.literal("")),
});

export const examSchema = z.object({
  examName: z.string().trim().min(1, "Examination name is required"),
  examType: z.enum(["unit-test", "mid-term", "final", "practical", "other"]).default("unit-test"),
  classId: z.string().trim().min(1, "Class is required"),
  academicYear: z.string().trim().min(1, "Academic year is required"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be YYYY-MM-DD"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be YYYY-MM-DD"),
  subjects: z.array(examSubjectSchema).min(1, "At least one subject is required for the exam"),
  status: z.enum(["draft", "ongoing", "completed", "published"]).default("draft"),
});

export const examUpdateSchema = examSchema.partial();

export const singleStudentMarksSchema = z.object({
  studentId: z.string().trim().min(1, "Student ID is required"),
  marksObtained: z.coerce.number().min(0, "Marks obtained cannot be negative"),
  remarks: z.string().trim().optional().or(z.literal("")),
});

export const bulkMarksSchema = z.object({
  examId: z.string().trim().min(1, "Exam ID is required"),
  subjectName: z.string().trim().min(1, "Subject name is required"),
  records: z.array(singleStudentMarksSchema).min(1, "At least one marks record is required"),
});

export const updateSingleMarksSchema = z.object({
  marksObtained: z.coerce.number().min(0, "Marks obtained cannot be negative"),
  remarks: z.string().trim().optional().or(z.literal("")),
});

