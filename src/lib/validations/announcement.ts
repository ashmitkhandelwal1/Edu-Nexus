import { z } from "zod";

export const announcementSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters"),
  message: z.string().trim().min(3, "Message must be at least 3 characters"),
  targetAudience: z.enum(["all", "teachers", "students"]).default("all"),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  publishAt: z.string().optional(),
  expiresAt: z.string().optional().nullable(),
});

export const updateAnnouncementSchema = announcementSchema.partial();

export type AnnouncementInput = z.infer<typeof announcementSchema>;
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;

