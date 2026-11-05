import { Timetable, DayOfWeek } from "@/models/Timetable";
import { Class } from "@/models/Class";
import { Teacher } from "@/models/Teacher";
import mongoose from "mongoose";

export interface PeriodCheckInput {
  periodNumber: number;
  type: "class" | "break" | "lunch";
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  subjectName?: string;
  teacherId?: string | null;
  roomNumber?: string | null;
}

export interface ConflictResult {
  hasConflict: boolean;
  message?: string;
  conflictingDetails?: {
    type: "internal_overlap" | "teacher_conflict" | "classroom_conflict" | "invalid_subject" | "invalid_teacher";
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    resourceName?: string;
    conflictingClass?: string;
  };
}

// Convert "HH:mm" to total minutes since midnight
export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

// Check if two time intervals [s1, e1) and [s2, e2) overlap
export function isOverlapping(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);

  return s1 < e2 && s2 < e1;
}

/**
 * Validates timetable periods for:
 * 1. Internal overlaps within the same class schedule
 * 2. Valid subjects according to the class's enrolled subjects
 * 3. Valid teacher IDs
 * 4. Teacher scheduling conflicts across all classes on the same day & academic year
 * 5. Classroom/roomNumber conflicts across all classes on the same day & academic year
 */
export async function checkTimetableConflicts({
  classId,
  academicYear,
  dayOfWeek,
  periods,
  excludeTimetableId,
}: {
  classId: string;
  academicYear: string;
  dayOfWeek: DayOfWeek;
  periods: PeriodCheckInput[];
  excludeTimetableId?: string;
}): Promise<ConflictResult> {
  // 1. Check internal overlapping periods within the same submitted schedule
  for (let i = 0; i < periods.length; i++) {
    for (let j = i + 1; j < periods.length; j++) {
      const p1 = periods[i];
      const p2 = periods[j];

      if (isOverlapping(p1.startTime, p1.endTime, p2.startTime, p2.endTime)) {
        return {
          hasConflict: true,
          message: `Overlap detected within this schedule: Period ${p1.periodNumber} (${p1.startTime}-${p1.endTime}) overlaps with Period ${p2.periodNumber} (${p2.startTime}-${p2.endTime}) on ${dayOfWeek}.`,
          conflictingDetails: {
            type: "internal_overlap",
            dayOfWeek,
            startTime: p1.startTime,
            endTime: p1.endTime,
          },
        };
      }
    }
  }

  // 2. Load the Class to verify assigned subjects
  const targetClass = await Class.findById(classId);
  if (!targetClass) {
    return {
      hasConflict: true,
      message: "Target class not found.",
    };
  }

  const validSubjects = new Set(
    (targetClass.subjects || []).map((s) => s.subjectName.toLowerCase().trim())
  );

  // 3. Verify class subjects and teachers
  for (const period of periods) {
    if (period.type === "class") {
      if (!period.subjectName) {
        return {
          hasConflict: true,
          message: `Period ${period.periodNumber} is a class period but no subject was specified.`,
        };
      }

      // Check subject is offered in this class (case-insensitive)
      if (
        validSubjects.size > 0 &&
        !validSubjects.has(period.subjectName.toLowerCase().trim())
      ) {
        return {
          hasConflict: true,
          message: `Subject "${period.subjectName}" is not assigned to ${targetClass.className} - ${targetClass.section}. Assigned subjects: ${(targetClass.subjects || []).map((s) => s.subjectName).join(", ")}.`,
          conflictingDetails: {
            type: "invalid_subject",
            dayOfWeek,
            startTime: period.startTime,
            endTime: period.endTime,
            resourceName: period.subjectName,
          },
        };
      }

      if (period.teacherId) {
        const teacherExists = await Teacher.findById(period.teacherId);
        if (!teacherExists) {
          return {
            hasConflict: true,
            message: `Teacher assigned to Period ${period.periodNumber} does not exist.`,
            conflictingDetails: {
              type: "invalid_teacher",
              dayOfWeek,
              startTime: period.startTime,
              endTime: period.endTime,
            },
          };
        }
      }
    }
  }

  // 4. Query all existing timetables on the same day and academic year (excluding current timetable document)
  const filter: any = {
    academicYear,
    dayOfWeek,
  };

  if (excludeTimetableId && mongoose.Types.ObjectId.isValid(excludeTimetableId)) {
    filter._id = { $ne: new mongoose.Types.ObjectId(excludeTimetableId) };
  } else {
    // If creating new, exclude any existing for the same classId (since we might be upserting/replacing)
    filter.classId = { $ne: new mongoose.Types.ObjectId(classId) };
  }

  const otherTimetables = await Timetable.find(filter).populate<{ classId: { className: string; section: string; _id: any } }>(
    "classId",
    "className section"
  );

  // 5. Cross-check for Teacher and Classroom conflicts against other classes
  for (const period of periods) {
    // We only check conflicts for periods with a teacher or a roomNumber
    const teacherIdStr = period.teacherId ? period.teacherId.toString() : null;
    const roomStr = period.roomNumber ? period.roomNumber.trim().toLowerCase() : null;

    if (!teacherIdStr && !roomStr) continue;

    for (const otherTt of otherTimetables) {
      const otherClassLabel = otherTt.classId
        ? `${(otherTt.classId as any).className} - ${(otherTt.classId as any).section}`
        : "another class";

      for (const otherPeriod of otherTt.periods) {
        // If times overlap
        if (
          isOverlapping(
            period.startTime,
            period.endTime,
            otherPeriod.startTime,
            otherPeriod.endTime
          )
        ) {
          // Check Teacher conflict
          if (
            teacherIdStr &&
            otherPeriod.teacherId &&
            otherPeriod.teacherId.toString() === teacherIdStr
          ) {
            const teacherDoc = await Teacher.findById(teacherIdStr).select("firstName lastName");
            const teacherName = teacherDoc
              ? `${teacherDoc.firstName} ${teacherDoc.lastName}`
              : "Assigned Teacher";

            return {
              hasConflict: true,
              message: `Teacher Conflict: ${teacherName} is already assigned to ${otherClassLabel} on ${dayOfWeek} from ${otherPeriod.startTime} to ${otherPeriod.endTime}.`,
              conflictingDetails: {
                type: "teacher_conflict",
                dayOfWeek,
                startTime: period.startTime,
                endTime: period.endTime,
                resourceName: teacherName,
                conflictingClass: otherClassLabel,
              },
            };
          }

          // Check Classroom conflict
          if (
            roomStr &&
            otherPeriod.roomNumber &&
            otherPeriod.roomNumber.trim().toLowerCase() === roomStr
          ) {
            return {
              hasConflict: true,
              message: `Classroom Conflict: Room "${period.roomNumber}" is already booked by ${otherClassLabel} on ${dayOfWeek} from ${otherPeriod.startTime} to ${otherPeriod.endTime}.`,
              conflictingDetails: {
                type: "classroom_conflict",
                dayOfWeek,
                startTime: period.startTime,
                endTime: period.endTime,
                resourceName: period.roomNumber || "",
                conflictingClass: otherClassLabel,
              },
            };
          }
        }
      }
    }
  }

  return { hasConflict: false };
}
