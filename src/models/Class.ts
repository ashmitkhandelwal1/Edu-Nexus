import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface ISubjectAssignment {
  subjectName: string;
  teacher?: Types.ObjectId;
}

export interface IClass extends Document {
  className: string;
  section: string;
  academicYear: string;
  classTeacher?: Types.ObjectId;
  subjects: ISubjectAssignment[];
  roomNumber?: string;
  capacity: number;
  createdAt: Date;
  updatedAt: Date;
}

const SubjectAssignmentSchema = new Schema<ISubjectAssignment>(
  {
    subjectName: {
      type: String,
      required: [true, "Subject name is required"],
      trim: true,
    },
    teacher: {
      type: Schema.Types.ObjectId,
      ref: "Teacher",
    },
  },
  { _id: false }
);

const ClassSchema = new Schema<IClass>(
  {
    className: {
      type: String,
      required: [true, "Class name is required"],
      trim: true,
      index: true,
    },
    section: {
      type: String,
      required: [true, "Section is required"],
      trim: true,
      index: true,
    },
    academicYear: {
      type: String,
      required: [true, "Academic year is required"],
      trim: true,
      index: true,
    },
    classTeacher: {
      type: Schema.Types.ObjectId,
      ref: "Teacher",
    },
    subjects: {
      type: [SubjectAssignmentSchema],
      default: [],
    },
    roomNumber: {
      type: String,
      trim: true,
    },
    capacity: {
      type: Number,
      required: [true, "Class capacity is required"],
      min: [1, "Capacity must be at least 1"],
      default: 40,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index ensuring no duplicates for className + section + academicYear
ClassSchema.index(
  { className: 1, section: 1, academicYear: 1 },
  { unique: true }
);

const ClassModel: Model<IClass> =
  mongoose.models.Class || mongoose.model<IClass>("Class", ClassSchema);

export const Class = ClassModel;
export default ClassModel;

