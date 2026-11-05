import connectToDatabase from "../src/lib/mongodb";
import { Class } from "../src/models/Class";
import { Teacher } from "../src/models/Teacher";
import { Timetable } from "../src/models/Timetable";
import { User } from "../src/models/User";
import { checkTimetableConflicts } from "../src/lib/timetable-conflict";

async function runTimetableIntegrationTests() {
  await connectToDatabase();
  console.log("[START TIMETABLE INTEGRATION TEST SUITE]");

  const admin = await User.findOne({ role: "admin" });
  if (!admin) throw new Error("Admin user not found");

  // 1. Create a Teacher
  const teacherA = await Teacher.create({
    employeeId: "T-TT-" + Date.now().toString().slice(-4) + "A",
    firstName: "Sarah",
    lastName: "Connor",
    email: `sarah-${Date.now()}@edunexus.internal`,
    qualification: "M.Sc Mathematics",
    department: "Mathematics",
    subjects: ["Mathematics", "Statistics"],
    joiningDate: new Date(),
    employmentType: "full-time",
    status: "active",
  });

  const teacherB = await Teacher.create({
    employeeId: "T-TT-" + Date.now().toString().slice(-4) + "B",
    firstName: "Alan",
    lastName: "Turing",
    email: `alan-${Date.now()}@edunexus.internal`,
    qualification: "Ph.D Computer Science",
    department: "Science",
    subjects: ["Physics", "Computer Science"],
    joiningDate: new Date(),
    employmentType: "full-time",
    status: "active",
  });
  console.log("1. Created Teachers:", teacherA.firstName, teacherB.firstName);

  // 2. Create Classes with Subjects
  const class1 = await Class.create({
    className: "Grade 9",
    section: "TT-A-" + Date.now().toString().slice(-4),
    academicYear: "2026-27",
    capacity: 30,
    roomNumber: "Room 101",
    subjects: [
      { subjectName: "Mathematics", teacher: teacherA._id },
      { subjectName: "Physics", teacher: teacherB._id },
    ],
  });

  const class2 = await Class.create({
    className: "Grade 9",
    section: "TT-B-" + Date.now().toString().slice(-4),
    academicYear: "2026-27",
    capacity: 30,
    roomNumber: "Room 102",
    subjects: [
      { subjectName: "Mathematics", teacher: teacherA._id },
      { subjectName: "Physics", teacher: teacherB._id },
    ],
  });
  console.log("2. Created Classes:", class1.className + " " + class1.section, class2.className + " " + class2.section);

  // 3. Test 1: Create a valid Monday timetable with class, break, lunch periods
  const validPeriods = [
    {
      periodNumber: 1,
      type: "class" as const,
      startTime: "09:00",
      endTime: "09:45",
      subjectName: "Mathematics",
      teacherId: teacherA._id.toString(),
      roomNumber: "Room 101",
    },
    {
      periodNumber: 2,
      type: "break" as const,
      startTime: "09:45",
      endTime: "10:00",
    },
    {
      periodNumber: 3,
      type: "class" as const,
      startTime: "10:00",
      endTime: "10:45",
      subjectName: "Physics",
      teacherId: teacherB._id.toString(),
      roomNumber: "Room 101",
    },
    {
      periodNumber: 4,
      type: "lunch" as const,
      startTime: "10:45",
      endTime: "11:30",
    },
  ];

  const conflictCheck1 = await checkTimetableConflicts({
    classId: class1._id.toString(),
    academicYear: "2026-27",
    dayOfWeek: "Monday",
    periods: validPeriods,
  });

  if (conflictCheck1.hasConflict) {
    throw new Error("Unexpected conflict on valid timetable: " + conflictCheck1.message);
  }

  const tt1 = await Timetable.create({
    classId: class1._id,
    academicYear: "2026-27",
    dayOfWeek: "Monday",
    periods: validPeriods,
  });
  console.log("3. Created valid Monday timetable for Class 1. ID:", tt1._id);

  // 4. Test 2: Save and reload
  const reloaded = await Timetable.findById(tt1._id).populate("classId").populate("periods.teacherId");
  if (!reloaded || reloaded.periods.length !== 4) {
    throw new Error("Failed to reload timetable or incorrect period count");
  }
  console.log("4. Successfully reloaded timetable with 4 periods: true");

  // 5. Test 3: Edit an existing period (e.g. change Room to Room 101-B)
  const updatedPeriods = [...validPeriods];
  updatedPeriods[0] = { ...updatedPeriods[0], roomNumber: "Room 101-B" };
  const conflictCheckUpdate = await checkTimetableConflicts({
    classId: class1._id.toString(),
    academicYear: "2026-27",
    dayOfWeek: "Monday",
    periods: updatedPeriods,
    excludeTimetableId: tt1._id.toString(),
  });
  if (conflictCheckUpdate.hasConflict) {
    throw new Error("Update check conflict: " + conflictCheckUpdate.message);
  }
  reloaded.periods = updatedPeriods as any;
  await reloaded.save();
  console.log("5. Successfully edited period room without conflict: true");

  // 6. Test 4: Reject overlapping periods within the same class schedule
  const overlappingSelf = [
    {
      periodNumber: 1,
      type: "class" as const,
      startTime: "09:00",
      endTime: "10:00",
      subjectName: "Mathematics",
      teacherId: teacherA._id.toString(),
    },
    {
      periodNumber: 2,
      type: "class" as const,
      startTime: "09:30", // overlaps with 09:00-10:00!
      endTime: "10:30",
      subjectName: "Physics",
      teacherId: teacherB._id.toString(),
    },
  ];
  const conflictSelf = await checkTimetableConflicts({
    classId: class1._id.toString(),
    academicYear: "2026-27",
    dayOfWeek: "Tuesday",
    periods: overlappingSelf,
  });
  if (!conflictSelf.hasConflict || conflictSelf.conflictingDetails?.type !== "internal_overlap") {
    throw new Error("Failed to reject internal overlapping periods");
  }
  console.log("6. Correctly rejected internal overlapping periods: true");

  // 7. Test 5: Reject teacher scheduling conflict across classes
  // Teacher A is already teaching Class 1 on Monday 09:00-09:45.
  // Now try scheduling Class 2 on Monday 09:15-10:00 with Teacher A.
  const conflictTeacherPeriods = [
    {
      periodNumber: 1,
      type: "class" as const,
      startTime: "09:15", // overlaps with Teacher A's 09:00-09:45
      endTime: "10:00",
      subjectName: "Mathematics",
      teacherId: teacherA._id.toString(),
      roomNumber: "Room 102",
    },
  ];
  const conflictTeacher = await checkTimetableConflicts({
    classId: class2._id.toString(),
    academicYear: "2026-27",
    dayOfWeek: "Monday",
    periods: conflictTeacherPeriods,
  });
  if (!conflictTeacher.hasConflict || conflictTeacher.conflictingDetails?.type !== "teacher_conflict") {
    throw new Error("Failed to detect teacher conflict across classes: " + JSON.stringify(conflictTeacher));
  }
  console.log("7. Correctly rejected cross-class Teacher collision: true (" + conflictTeacher.message + ")");

  // 8. Test 6: Reject classroom collision across classes
  // Room 101-B is occupied by Class 1 on Monday 09:00-09:45.
  // Now try scheduling Class 2 on Monday 09:30-10:15 in "Room 101-B" (with Teacher B).
  const conflictRoomPeriods = [
    {
      periodNumber: 1,
      type: "class" as const,
      startTime: "09:30", // overlaps 09:00-09:45
      endTime: "10:15",
      subjectName: "Physics",
      teacherId: teacherB._id.toString(),
      roomNumber: "Room 101-B", // occupied!
    },
  ];
  const conflictRoom = await checkTimetableConflicts({
    classId: class2._id.toString(),
    academicYear: "2026-27",
    dayOfWeek: "Monday",
    periods: conflictRoomPeriods,
  });
  if (!conflictRoom.hasConflict || conflictRoom.conflictingDetails?.type !== "classroom_conflict") {
    throw new Error("Failed to detect classroom conflict across classes: " + JSON.stringify(conflictRoom));
  }
  console.log("8. Correctly rejected cross-class Classroom collision: true (" + conflictRoom.message + ")");

  // 9. Test 7: Reject subject not offered in the class
  const invalidSubjPeriods = [
    {
      periodNumber: 1,
      type: "class" as const,
      startTime: "13:00",
      endTime: "13:45",
      subjectName: "Astronomy", // Not assigned to class2
      roomNumber: "Room 102",
    },
  ];
  const conflictSubj = await checkTimetableConflicts({
    classId: class2._id.toString(),
    academicYear: "2026-27",
    dayOfWeek: "Monday",
    periods: invalidSubjPeriods,
  });
  if (!conflictSubj.hasConflict || conflictSubj.conflictingDetails?.type !== "invalid_subject") {
    throw new Error("Failed to detect invalid subject not assigned to class: " + JSON.stringify(conflictSubj));
  }
  console.log("9. Correctly rejected subject not offered by class: true");

  // 10. Test 8: Verify break & lunch periods allow no teacher/subject
  const recessOnly = [
    {
      periodNumber: 1,
      type: "break" as const,
      startTime: "12:00",
      endTime: "12:15",
    },
    {
      periodNumber: 2,
      type: "lunch" as const,
      startTime: "12:15",
      endTime: "13:00",
    },
  ];
  const recessCheck = await checkTimetableConflicts({
    classId: class2._id.toString(),
    academicYear: "2026-27",
    dayOfWeek: "Monday",
    periods: recessOnly,
  });
  if (recessCheck.hasConflict) {
    throw new Error("Break/Lunch period check failed: " + recessCheck.message);
  }
  console.log("10. Successfully validated break and lunch period allowances: true");

  // 11. Clean up test records
  await Timetable.deleteMany({ classId: { $in: [class1._id, class2._id] } });
  await Class.deleteMany({ _id: { $in: [class1._id, class2._id] } });
  await Teacher.deleteMany({ _id: { $in: [teacherA._id, teacherB._id] } });
  console.log("11. Cleaned up temporary test documents");

  console.log("[ALL 11 TIMETABLE INTEGRATION TESTS PASSED]");
}

runTimetableIntegrationTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  });
