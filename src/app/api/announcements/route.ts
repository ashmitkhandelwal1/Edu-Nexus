import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import { Announcement } from "@/models/Announcement";
import "@/models/User";
import { getAuthenticatedUser } from "@/lib/auth";
import { announcementSchema } from "@/lib/validations/announcement";

// GET /api/announcements — List announcements based on logged-in user's role
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const statusParam = searchParams.get("status")?.trim() || "";
    const audienceParam = searchParams.get("targetAudience")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20", 10)));

    const filter: any = {};
    const now = new Date();

    if (authUser.role === "admin") {
      // Admins can filter by specific status or audience
      if (statusParam && ["draft", "published", "archived"].includes(statusParam)) {
        filter.status = statusParam;
      }
      if (audienceParam && ["all", "teachers", "students"].includes(audienceParam)) {
        filter.targetAudience = audienceParam;
      }
    } else {
      // Non-admins (teachers, students, parents):
      // Only see published announcements where publishAt <= now AND (expiresAt is not set OR expiresAt > now)
      filter.status = "published";
      filter.publishAt = { $lte: now };
      filter.$and = [
        {
          $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: null },
            { expiresAt: { $gt: now } },
          ],
        },
      ];

      // Role-specific audience filtering
      if (authUser.role === "teacher") {
        filter.targetAudience = { $in: ["all", "teachers"] };
      } else if (authUser.role === "student") {
        filter.targetAudience = { $in: ["all", "students"] };
      } else {
        // Parent or other roles
        filter.targetAudience = "all";
      }
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } },
      ];
    }

    const total = await Announcement.countDocuments(filter);
    const skip = (page - 1) * limit;

    const announcements = await Announcement.find(filter)
      .populate("createdBy", "name email role")
      .sort({ publishAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      announcements,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// POST /api/announcements — Admin only create
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser || authUser.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => null);
    const validation = announcementSchema.safeParse(body);

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
    const publishAt = data.publishAt ? new Date(data.publishAt) : new Date();
    const expiresAt = data.expiresAt ? new Date(data.expiresAt) : undefined;

    const announcement = await Announcement.create({
      title: data.title,
      message: data.message,
      targetAudience: data.targetAudience,
      status: data.status,
      publishAt,
      expiresAt,
      createdBy: new mongoose.Types.ObjectId(authUser.userId),
    });

    const populated = await Announcement.findById(announcement._id)
      .populate("createdBy", "name email");

    return NextResponse.json(
      {
        success: true,
        message: "Announcement created successfully",
        announcement: populated,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

