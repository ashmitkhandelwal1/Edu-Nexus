import { z } from "zod";

export const classSubjectSchema = z.object({
  subjectName: z.string().trim().min(1, "Subject name is required"),
  teacher: z.string().trim().optional().or(z.literal("")),
});

export const classSchema = z.object({
  className: z.string().trim().min(1, "Class name is required"),
  section: z.string().trim().min(1, "Section is required"),
  academicYear: z.string().trim().min(1, "Academic year is required"),
  classTeacher: z.string().trim().optional().or(z.literal("")),
  subjects: z.array(classSubjectSchema).default([]),
  roomNumber: z.string().trim().optional().or(z.literal("")),
  capacity: z.coerce.number().int().min(1, "Capacity must be at least 1").default(40),
});

export const classUpdateSchema = classSchema.partial();

export const assignStudentSchema = z.object({
  studentId: z.string().trim().min(1, "Student ID is required"),
});

