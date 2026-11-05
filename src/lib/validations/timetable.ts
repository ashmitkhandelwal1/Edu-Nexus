import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const periodSchema = z
  .object({
    _id: z.string().optional(),
    periodNumber: z.number().int().min(1, "Period number must be at least 1"),
    type: z.enum(["class", "break", "lunch"]),
    startTime: z.string().regex(timeRegex, "Start time must be in HH:mm format (00:00 - 23:59)"),
    endTime: z.string().regex(timeRegex, "End time must be in HH:mm format (00:00 - 23:59)"),
    subjectName: z.string().trim().optional(),
    teacherId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid teacher ID").optional().nullable(),
    roomNumber: z.string().trim().optional().nullable(),
  })
  .refine(
    (data) => {
      return data.startTime < data.endTime;
    },
    {
      message: "Start time must be strictly before end time",
      path: ["endTime"],
    }
  )
  .refine(
    (data) => {
      if (data.type === "class") {
        return !!data.subjectName && data.subjectName.trim().length > 0;
      }
      return true;
    },
    {
      message: "Subject name is required for class periods",
      path: ["subjectName"],
    }
  );

export const createTimetableSchema = z.object({
  classId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid class ID"),
  academicYear: z.string().min(1, "Academic year is required"),
  dayOfWeek: z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]),
  periods: z.array(periodSchema).default([]),
});

export const updateTimetableSchema = z.object({
  periods: z.array(periodSchema),
});

export type PeriodInput = z.infer<typeof periodSchema>;
export type CreateTimetableInput = z.infer<typeof createTimetableSchema>;
export type UpdateTimetableInput = z.infer<typeof updateTimetableSchema>;
