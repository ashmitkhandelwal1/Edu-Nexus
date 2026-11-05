import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET() {
  try {
    const mongoose = await connectToDatabase();
    const isConnected = mongoose.connection.readyState === 1;

    return NextResponse.json({
      success: true,
      message: "MongoDB connected successfully",
      readyState: isConnected ? "connected" : "connecting/other",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
