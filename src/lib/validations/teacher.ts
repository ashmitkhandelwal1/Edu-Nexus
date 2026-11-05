import { z } from "zod";

export const teacherSchema = z.object({
  employeeId: z.string().trim().min(1, "Employee ID is required"),
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().email("Valid institutional email is required"),
  phone: z.string().trim().optional().or(z.literal("")),
  dateOfBirth: z.string().optional().or(z.literal("")),
  gender: z.enum(["male", "female", "other"]).optional(),
  address: z.string().trim().optional().or(z.literal("")),
  qualification: z.string().trim().min(1, "Qualification is required"),
  specialization: z.string().trim().optional().or(z.literal("")),
  department: z.string().trim().min(1, "Department is required"),
  subjects: z.array(z.string().trim()).default([]),
  joiningDate: z.string().optional().or(z.literal("")),
  employmentType: z.enum(["full-time", "part-time", "contract"]).default("full-time"),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const teacherUpdateSchema = teacherSchema.partial();

