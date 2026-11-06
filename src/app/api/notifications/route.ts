import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import { Notification } from "@/models/Notification";
import { Student } from "@/models/Student";
import { Submission } from "@/models/Submission";
import { FeePayment } from "@/models/FeePayment";
import { Announcement } from "@/models/Announcement";
import "@/models/Class";
import "@/models/User";
import "@/models/Assignment";
import { getAuthenticatedUser } from "@/lib/auth";

// GET /api/notifications — Retrieve recent system notifications with unread counts
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

    const userId = new mongoose.Types.ObjectId(authUser.userId);

    // Sync recent system activities into notifications if they haven't been seeded
    // 1. Check latest notifications count
    const existingCount = await Notification.countDocuments();
    if (existingCount === 0) {
      // Seed real initial activity notifications from existing records
      const [recentStudents, recentSubmissions, recentPayments, recentAnnouncements] =
        await Promise.all([
          Student.find().sort({ createdAt: -1 }).limit(3).lean(),
          Submission.find().populate("studentId", "firstName lastName").populate("assignmentId", "title").sort({ submittedAt: -1 }).limit(3).lean(),
          FeePayment.find().populate("studentId", "firstName lastName").sort({ paymentDate: -1 }).limit(3).lean(),
          Announcement.find().sort({ createdAt: -1 }).limit(3).lean(),
        ]);

      const initialNotifs: any[] = [];

      recentStudents.forEach((st: any) => {
        initialNotifs.push({
          title: "New Student Enrolled",
          message: `${st.firstName} ${st.lastName} enrolled in Class ${st.className} (${st.section}).`,
          type: "student_enrollment",
          link: `/admin/students`,
          readBy: [],
          createdAt: st.createdAt || new Date(),
        });
      });

      recentSubmissions.forEach((sub: any) => {
        const studentName = sub.studentId ? `${sub.studentId.firstName} ${sub.studentId.lastName}` : "A student";
        const assignmentTitle = sub.assignmentId ? sub.assignmentId.title : "homework";
        initialNotifs.push({
          title: "Assignment Submitted",
          message: `${studentName} submitted solution for "${assignmentTitle}".`,
          type: "assignment_submission",
          link: `/admin/assignments`,
          readBy: [],
          createdAt: sub.submittedAt || new Date(),
        });
      });

      recentPayments.forEach((p: any) => {
        const studentName = p.studentId ? `${p.studentId.firstName} ${p.studentId.lastName}` : "A student";
        initialNotifs.push({
          title: "Fee Payment Received",
          message: `₹${p.amount.toLocaleString()} received from ${studentName} via ${p.paymentMethod.toUpperCase()}.`,
          type: "fee_payment",
          link: `/admin/fees`,
          readBy: [],
          createdAt: p.paymentDate || new Date(),
        });
      });

      recentAnnouncements.forEach((a: any) => {
        initialNotifs.push({
          title: "Campus Announcement",
          message: `Published bulletin: "${a.title}".`,
          type: "announcement",
          link: `/admin/announcements`,
          readBy: [],
          createdAt: a.publishAt || a.createdAt || new Date(),
        });
      });

      if (initialNotifs.length > 0) {
        await Notification.insertMany(initialNotifs);
      }
    }

    // Fetch the 15 most recent notifications
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(15)
      .lean();

    const formatted = notifications.map((n) => ({
      _id: n._id.toString(),
      title: n.title,
      message: n.message,
      type: n.type,
      link: n.link || "#",
      createdAt: n.createdAt ? new Date(n.createdAt).toISOString() : new Date().toISOString(),
      isRead: Array.isArray(n.readBy) && n.readBy.some((id) => id.toString() === userId.toString()),
    }));

    const unreadCount = formatted.filter((n) => !n.isRead).length;

    return NextResponse.json({
      success: true,
      unreadCount,
      notifications: formatted,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// POST /api/notifications — Mark notification(s) as read
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser || authUser.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized access" },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const userId = new mongoose.Types.ObjectId(authUser.userId);

    const body = await req.json().catch(() => ({}));
    const { notificationId, markAll } = body;

    if (markAll) {
      await Notification.updateMany(
        { readBy: { $ne: userId } },
        { $addToSet: { readBy: userId } }
      );

      return NextResponse.json({
        success: true,
        message: "All notifications marked as read",
      });
    }

    if (notificationId && mongoose.Types.ObjectId.isValid(notificationId)) {
      await Notification.findByIdAndUpdate(notificationId, {
        $addToSet: { readBy: userId },
      });

      return NextResponse.json({
        success: true,
        message: "Notification marked as read",
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid request payload" },
      { status: 400 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

