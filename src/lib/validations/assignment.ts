import { z } from "zod";

export const attachmentSchema = z.object({
  name: z.string().trim().min(1, "Attachment name is required"),
  url: z.string().trim().min(1, "Attachment URL is required"),
  type: z.string().trim().optional(),
  size: z.number().nonnegative().optional(),
});

export const createAssignmentSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters"),
  description: z.string().trim().min(3, "Description must be at least 3 characters"),
  instructions: z.string().trim().optional(),
  classId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid class ID"),
  academicYear: z.string().trim().min(1, "Academic year is required"),
  subjectName: z.string().trim().min(1, "Subject name is required"),
  teacherId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid teacher ID").optional().nullable(),
  assignedDate: z.string().optional(),
  dueDate: z.string().min(1, "Due date is required"),
  maxMarks: z.number().int().min(1, "Maximum marks must be at least 1").default(100),
  attachments: z.array(attachmentSchema).default([]),
  status: z.enum(["draft", "published", "closed"]).default("draft"),
});

export const updateAssignmentSchema = createAssignmentSchema.partial();

export const createSubmissionSchema = z.object({
  studentId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid student ID"),
  textAnswer: z.string().trim().optional(),
  attachments: z.array(attachmentSchema).default([]),
});

export const gradeSubmissionSchema = z.object({
  marksObtained: z.number().min(0, "Marks obtained cannot be negative"),
  feedback: z.string().trim().optional(),
});

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;
export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
export type GradeSubmissionInput = z.infer<typeof gradeSubmissionSchema>;

