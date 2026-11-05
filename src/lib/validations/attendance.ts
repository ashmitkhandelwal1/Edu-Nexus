import { z } from "zod";

export const attendanceStatusEnum = z.enum(["present", "absent", "late", "half-day"]);

export const singleStudentAttendanceSchema = z.object({
  studentId: z.string().trim().min(1, "Student ID is required"),
  status: attendanceStatusEnum,
  remarks: z.string().trim().optional().or(z.literal("")),
});

export const bulkAttendanceSchema = z.object({
  classId: z.string().trim().min(1, "Class ID is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be formatted as YYYY-MM-DD"),
  records: z.array(singleStudentAttendanceSchema).min(1, "At least one attendance record is required"),
});

export const updateAttendanceRecordSchema = z.object({
  status: attendanceStatusEnum,
  remarks: z.string().trim().optional().or(z.literal("")),
});

