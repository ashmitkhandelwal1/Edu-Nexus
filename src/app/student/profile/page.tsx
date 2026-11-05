import React from "react";
import { User, Mail, Phone, MapPin, Calendar, Users, Shield, GraduationCap, Clock } from "lucide-react";
import { getStudentProfile } from "@/lib/student-auth";
import { StudentShell } from "@/components/student/StudentShell";

export default async function StudentProfilePage() {
  const { user, student, classDoc } = await getStudentProfile();

  return (
    <StudentShell
      studentEmail={user.email}
      studentName={`${student.firstName} ${student.lastName}`}
      admissionNumber={student.admissionNumber}
      className={student.className}
      section={student.section}
    >
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* Header Banner */}
        <div className="pb-6 border-b border-slate-800">
          <div className="flex items-center gap-2.5 text-xs font-semibold text-sky-400 uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4" /> Official Student Record
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            My Student Profile
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Official academic enrollment and personal identity details (Read-Only). Contact the administration for any discrepancies.
          </p>
        </div>

        {/* Profile Card Header */}
        <div className="p-6 md:p-8 rounded-2xl bg-slate-900/90 border border-slate-800/80 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center text-3xl font-black shadow-xl shadow-sky-500/20 shrink-0">
            {student.firstName[0]}
            {student.lastName[0]}
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
              <h2 className="text-2xl font-bold text-white">
                {student.firstName} {student.lastName}
              </h2>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 self-center sm:self-auto capitalize">
                {student.status}
              </span>
            </div>

            <div className="text-sm text-slate-400 flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1">
              <span>
                Class: <strong className="text-sky-400">{student.className} - {student.section}</strong>
              </span>
              <span>•</span>
              <span>
                Roll No: <strong className="text-slate-200">{student.rollNumber || "Not assigned"}</strong>
              </span>
              <span>•</span>
              <span>
                Admission No: <strong className="text-slate-200 font-mono">{student.admissionNumber}</strong>
              </span>
            </div>

            <div className="text-xs text-slate-500">
              Enrolled on: {new Date(student.admissionDate).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* 2-Column Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Personal Information */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <User className="w-5 h-5 text-sky-400" />
              <h3 className="text-base font-bold text-white">Personal Information</h3>
            </div>

            <div className="grid grid-cols-1 gap-4 text-sm">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Email Address</label>
                <div className="flex items-center gap-2 text-slate-200">
                  <Mail className="w-4 h-4 text-slate-500" />
                  <span>{student.email || user.email}</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Phone Number</label>
                <div className="flex items-center gap-2 text-slate-200">
                  <Phone className="w-4 h-4 text-slate-500" />
                  <span>{student.phone || "Not provided"}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Gender</label>
                  <span className="text-slate-200 capitalize">{student.gender || "Not specified"}</span>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Date of Birth</label>
                  <span className="text-slate-200">
                    {student.dateOfBirth
                      ? new Date(student.dateOfBirth).toLocaleDateString()
                      : "Not recorded"}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Residential Address</label>
                <div className="flex items-start gap-2 text-slate-200">
                  <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <span>{student.address || "Not recorded"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Academic & Class Details */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <GraduationCap className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">Academic Enrollment</h3>
            </div>

            <div className="grid grid-cols-1 gap-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Current Class</label>
                  <span className="text-white font-semibold">{student.className}</span>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Section</label>
                  <span className="text-white font-semibold">Section {student.section}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Academic Year</label>
                  <span className="text-slate-200">
                    {student.academicYear || classDoc?.academicYear || "Current Session"}
                  </span>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Room Number</label>
                  <span className="text-slate-200">{classDoc?.roomNumber || "Main Hall"}</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Curriculum Subjects</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {classDoc?.subjects && classDoc.subjects.length > 0 ? (
                    classDoc.subjects.map((s: any, idx: number) => (
                      <span
                        key={idx}
                        className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700"
                      >
                        {s.subjectName}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">General Curriculum</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Guardian Information */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-5 md:col-span-2">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <Users className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">Parent / Guardian Details</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Guardian Name</label>
                <span className="text-white font-semibold">{student.guardianName}</span>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Contact Phone</label>
                <span className="text-slate-200">{student.guardianPhone}</span>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Email Address</label>
                <span className="text-slate-200">{student.guardianEmail || "Not provided"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudentShell>
  );
}

