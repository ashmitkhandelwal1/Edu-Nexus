"use client";

import React, { useState } from "react";
import { X, Layers, Plus, Calendar, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ClassOption {
  _id: string;
  className: string;
  section: string;
  academicYear: string;
}

interface FeeStructureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  classes: ClassOption[];
}

export function FeeStructureModal({
  isOpen,
  onClose,
  onSuccess,
  classes,
}: FeeStructureModalProps) {
  const [classId, setClassId] = useState(classes[0]?._id || "");
  const [academicYear, setAcademicYear] = useState(classes[0]?.academicYear || "2026-27");
  const [feeName, setFeeName] = useState("");
  const [amount, setAmount] = useState<number | string>("");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");

  const [generateRecordsNow, setGenerateRecordsNow] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClassChange = (cId: string) => {
    setClassId(cId);
    const cls = classes.find((c) => c._id === cId);
    if (cls?.academicYear) setAcademicYear(cls.academicYear);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = Number(amount);
    if (!feeName.trim() || !classId || !dueDate || isNaN(numAmount) || numAmount <= 0) {
      setError("Please fill in all required fields with valid values.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/fees/structures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId,
          academicYear,
          feeName: feeName.trim(),
          amount: numAmount,
          dueDate: new Date(dueDate).toISOString(),
          description: description.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create fee structure");

      // Automatically generate fee records for all enrolled students if selected
      if (generateRecordsNow && data.structure?._id) {
        await fetch("/api/fees/records", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            feeStructureId: data.structure._id,
          }),
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" /> Define Class Fee Structure
            </h3>
            <p className="text-xs text-slate-400">
              Set tuition, lab, exam, or term fees for target classes
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Class & Section <span className="text-rose-400">*</span>
            </label>
            <select
              value={classId}
              onChange={(e) => handleClassChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
            >
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.className} - {c.section} ({c.academicYear})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Fee Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={feeName}
              onChange={(e) => setFeeName(e.target.value)}
              placeholder="e.g. Term 1 Tuition Fee / Annual Sports Fee"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Amount ($) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                required
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 500"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Due Date <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description (Optional)</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional billing context..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-2.5">
            <input
              type="checkbox"
              id="genRecords"
              checked={generateRecordsNow}
              onChange={(e) => setGenerateRecordsNow(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
            />
            <label htmlFor="genRecords" className="text-xs text-slate-300 cursor-pointer">
              Automatically generate invoices for all enrolled class students now
            </label>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-slate-800 text-slate-300 hover:bg-slate-800 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs"
            >
              {loading ? "Creating..." : "Save Fee Structure"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

