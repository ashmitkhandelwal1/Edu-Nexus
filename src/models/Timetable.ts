import mongoose, { Document, Model, Schema, Types } from "mongoose";

export type DayOfWeek =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday";

export type PeriodType = "class" | "break" | "lunch";

export interface IPeriod {
  _id?: Types.ObjectId;
  periodNumber: number;
  type: PeriodType;
  startTime: string; // HH:mm (24-hour format)
  endTime: string;   // HH:mm (24-hour format)
  subjectName?: string;
  teacherId?: Types.ObjectId;
  roomNumber?: string;
}

export interface ITimetable extends Document {
  classId: Types.ObjectId;
  academicYear: string;
  dayOfWeek: DayOfWeek;
  periods: IPeriod[];
  createdAt: Date;
  updatedAt: Date;
}

const PeriodSchema = new Schema<IPeriod>(
  {
    periodNumber: {
      type: Number,
      required: [true, "Period number is required"],
      min: [1, "Period number must be at least 1"],
    },
    type: {
      type: String,
      enum: ["class", "break", "lunch"],
      default: "class",
      required: true,
    },
    startTime: {
      type: String,
      required: [true, "Start time is required"],
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, "Start time must be in HH:mm format (00:00 - 23:59)"],
      trim: true,
    },
    endTime: {
      type: String,
      required: [true, "End time is required"],
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, "End time must be in HH:mm format (00:00 - 23:59)"],
      trim: true,
    },
    subjectName: {
      type: String,
      trim: true,
      validate: {
        validator: function (this: IPeriod, val: string | undefined) {
          if (this.type === "class") {
            return typeof val === "string" && val.trim().length > 0;
          }
          return true;
        },
        message: "Subject name is required for class periods",
      },
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: "Teacher",
    },
    roomNumber: {
      type: String,
      trim: true,
    },
  },
  { _id: true }
);

const TimetableSchema = new Schema<ITimetable>(
  {
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "Class is required"],
      index: true,
    },
    academicYear: {
      type: String,
      required: [true, "Academic year is required"],
      trim: true,
      index: true,
    },
    dayOfWeek: {
      type: String,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      required: [true, "Day of week is required"],
      index: true,
    },
    periods: {
      type: [PeriodSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// One timetable document per class, academic year, and day of week
TimetableSchema.index({ classId: 1, academicYear: 1, dayOfWeek: 1 }, { unique: true });

export const Timetable: Model<ITimetable> =
  mongoose.models.Timetable || mongoose.model<ITimetable>("Timetable", TimetableSchema);

export default Timetable;
