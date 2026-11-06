import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { PlatformSettings } from "@/models/PlatformSettings";
import { getAuthenticatedUser } from "@/lib/auth";
import { z } from "zod";

const settingsSchema = z.object({
  institutionName: z.string().min(2, "Institution name must be at least 2 characters"),
  institutionEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  institutionPhone: z.string().optional().or(z.literal("")),
  institutionAddress: z.string().optional().or(z.literal("")),
  academicYear: z.string().min(4, "Academic year is required (e.g. 2026-27)"),
  currency: z.string().default("INR (₹)"),
  timezone: z.string().default("Asia/Kolkata (IST)"),
  attendanceThreshold: z.number().min(0).max(100).default(75),
  allowStudentSubmissions: z.boolean().default(true),
  announcementAutoPublish: z.boolean().default(true),
});

// GET /api/settings — Retrieve current platform settings
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser || authUser.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized access" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    let settings = await PlatformSettings.findOne().lean();
    if (!settings) {
      settings = await PlatformSettings.create({
        institutionName: "Nexus Global Academy",
        institutionEmail: "admin@edunexus.edu",
        institutionPhone: "+91 98765 43210",
        institutionAddress: "Knowledge Campus, Sector 4, Silicon Valley",
        academicYear: "2026-27",
        currency: "INR (₹)",
        timezone: "Asia/Kolkata (IST)",
        attendanceThreshold: 75,
        allowStudentSubmissions: true,
        announcementAutoPublish: true,
      });
    }

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// POST /api/settings — Update or save platform settings
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser || authUser.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized access" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);
    const validation = settingsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const data = validation.data;

    const updated = await PlatformSettings.findOneAndUpdate(
      {},
      {
        $set: {
          institutionName: data.institutionName,
          institutionEmail: data.institutionEmail || undefined,
          institutionPhone: data.institutionPhone || undefined,
          institutionAddress: data.institutionAddress || undefined,
          academicYear: data.academicYear,
          currency: data.currency,
          timezone: data.timezone,
          attendanceThreshold: data.attendanceThreshold,
          allowStudentSubmissions: data.allowStudentSubmissions,
          announcementAutoPublish: data.announcementAutoPublish,
        },
      },
      { new: true, upsert: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      message: "Platform settings updated successfully",
      settings: updated,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

