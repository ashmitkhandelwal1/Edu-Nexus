import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IMarks extends Document {
  examId: Types.ObjectId;
  studentId: Types.ObjectId;
  subjectName: string;
  marksObtained: number;
  remarks?: string;
  enteredBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MarksSchema = new Schema<IMarks>(
  {
    examId: {
      type: Schema.Types.ObjectId,
      ref: "Exam",
      required: [true, "Exam reference is required"],
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student reference is required"],
      index: true,
    },
    subjectName: {
      type: String,
      required: [true, "Subject name is required"],
      trim: true,
      index: true,
    },
    marksObtained: {
      type: Number,
      required: [true, "Marks obtained is required"],
      min: [0, "Marks obtained cannot be negative"],
    },
    remarks: {
      type: String,
      trim: true,
    },
    enteredBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index preventing duplicate marks records for a student per subject per exam
MarksSchema.index(
  { examId: 1, studentId: 1, subjectName: 1 },
  { unique: true }
);

MarksSchema.index({ examId: 1, studentId: 1 });

const MarksModel: Model<IMarks> =
  mongoose.models.Marks || mongoose.model<IMarks>("Marks", MarksSchema);

export const Marks = MarksModel;
export default MarksModel;

