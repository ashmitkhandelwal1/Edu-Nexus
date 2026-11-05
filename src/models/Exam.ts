import mongoose, { Document, Model, Schema, Types } from "mongoose";

export type ExamType = "unit-test" | "mid-term" | "final" | "practical" | "other";
export type ExamStatus = "draft" | "ongoing" | "completed" | "published";

export interface IExamSubject {
  subjectName: string;
  maxMarks: number;
  passMarks: number;
  teacherId?: Types.ObjectId;
}

export interface IExam extends Document {
  examName: string;
  examType: ExamType;
  classId: Types.ObjectId;
  academicYear: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  subjects: IExamSubject[];
  status: ExamStatus;
  createdAt: Date;
  updatedAt: Date;
}

const ExamSubjectSchema = new Schema<IExamSubject>(
  {
    subjectName: {
      type: String,
      required: [true, "Subject name is required"],
      trim: true,
    },
    maxMarks: {
      type: Number,
      required: [true, "Maximum marks are required"],
      min: [1, "Maximum marks must be at least 1"],
      default: 100,
    },
    passMarks: {
      type: Number,
      required: [true, "Passing marks are required"],
      min: [0, "Passing marks cannot be negative"],
      default: 33,
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: "Teacher",
    },
  },
  { _id: false }
);

const ExamSchema = new Schema<IExam>(
  {
    examName: {
      type: String,
      required: [true, "Examination name is required"],
      trim: true,
      index: true,
    },
    examType: {
      type: String,
      enum: ["unit-test", "mid-term", "final", "practical", "other"],
      required: [true, "Examination type is required"],
      default: "unit-test",
      index: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "Class reference is required"],
      index: true,
    },
    academicYear: {
      type: String,
      required: [true, "Academic year is required"],
      trim: true,
      index: true,
    },
    startDate: {
      type: String,
      required: [true, "Start date is required"],
      trim: true,
    },
    endDate: {
      type: String,
      required: [true, "End date is required"],
      trim: true,
    },
    subjects: {
      type: [ExamSubjectSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ["draft", "ongoing", "completed", "published"],
      default: "draft",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

ExamSchema.index({ classId: 1, academicYear: 1 });
ExamSchema.index({ examName: "text" });

const ExamModel: Model<IExam> =
  mongoose.models.Exam || mongoose.model<IExam>("Exam", ExamSchema);

export const Exam = ExamModel;
export default ExamModel;

