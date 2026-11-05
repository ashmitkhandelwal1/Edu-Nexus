import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import { Announcement } from "@/models/Announcement";
import "@/models/User";
import { getAuthenticatedUser } from "@/lib/auth";
import { updateAnnouncementSchema } from "@/lib/validations/announcement";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/announcements/[id]
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid announcement ID" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const announcement = await Announcement.findById(id)
      .populate("createdBy", "name email role")
      .lean();

    if (!announcement) {
      return NextResponse.json(
        { success: false, error: "Announcement not found" },
        { status: 404 }
      );
    }

    // Role check for non-admin
    if (authUser.role !== "admin") {
      const now = new Date();
      if (
        announcement.status !== "published" ||
        new Date(announcement.publishAt) > now ||
        (announcement.expiresAt && new Date(announcement.expiresAt) <= now)
      ) {
        return NextResponse.json(
          { success: false, error: "Announcement not found or expired" },
          { status: 404 }
        );
      }

      const allowedAudiences = new Set(["all", `${authUser.role}s`]);
      if (!allowedAudiences.has(announcement.targetAudience)) {
        return NextResponse.json(
          { success: false, error: "Access denied" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      announcement,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// PATCH /api/announcements/[id] — Admin only
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser || authUser.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid announcement ID" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => null);
    const validation = updateAnnouncementSchema.safeParse(body);

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

    const existing = await Announcement.findById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Announcement not found" },
        { status: 404 }
      );
    }

    const data = validation.data;
    const updatePayload: any = { ...data };
    if (data.publishAt) updatePayload.publishAt = new Date(data.publishAt);
    if (data.expiresAt !== undefined) {
      updatePayload.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
    }

    const updated = await Announcement.findByIdAndUpdate(
      id,
      { $set: updatePayload },
      { returnDocument: "after", runValidators: true }
    ).populate("createdBy", "name email");

    return NextResponse.json({
      success: true,
      message: "Announcement updated successfully",
      announcement: updated,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// DELETE /api/announcements/[id] — Admin only
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser || authUser.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid announcement ID" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const deleted = await Announcement.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Announcement not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Announcement deleted successfully",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

