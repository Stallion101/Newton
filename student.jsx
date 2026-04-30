import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { UserPlus, Search, TrendingUp, TrendingDown, Minus, Users, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "../components/shared/PageHeader";
import StatusBadge from "../components/shared/StatusBadge";
import AddStudentDialog from "../components/students/AddStudentDialog";

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
};

const trendColors = {
  up: "text-newton-green",
  down: "text-newton-red",
  flat: "text-muted-foreground",
};

const avatarColors = ["bg-newton-pink", "bg-newton-purple", "bg-newton-cyan", "bg-newton-orange", "bg-newton-green", "bg-newton-blue"];

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  async function loadStudents() {
    try {
      const data = await base44.entities.Student.list();
      setStudents(data);
    } catch (error) {
      console.error("Error loading students:", error);
    } finally {
      setLoading(false);
    }
  }

  async function updateFluency(studentId, newValue) {
    const wpm = parseInt(newValue) || 0;
    
    // Grade 2 Benchmarks: At Risk < 50 WPM
    let newStatus = "On Track";
    if (wpm === 0) newStatus = "Needs Review";
    else if (wpm < 50) newStatus = "At Risk";
    
    let newTrend = "flat";
    if (wpm > 60) newTrend = "up";
    else if (wpm > 0 && wpm < 30) newTrend = "down";

    // Optimistic UI update for speed
    setStudents(prev => prev.map(s => 
      s.id === studentId 
        ? { ...s, fluency_wpm: wpm, status: newStatus, trend: newTrend } 
        : s
    ));

    await base44.entities.Student.update(studentId, { 
      fluency_wpm: wpm,
      status: newStatus,
      trend: newTrend
    });
  }

  async function deleteStudent(studentId) {
    if (window.confirm("Are you sure you want to delete this student?")) {
      await base44.entities.Student.delete(studentId);
      loadStudents();
    }
  }

  useEffect(() => {
    loadStudents();
  }, []);

  const filtered = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-newton-pink/30 border-t-newton-pink rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Students" subtitle="Manage your class roster and track individual progress">
        <Button onClick={() => setDialogOpen(true)} className="bg-newton-pink hover:bg-newton-pink/90 text-white rounded-full px-5 gap-2">
          <UserPlus className="w-4 h-4" /> Add Student
        </Button>
      </PageHeader>

      <div className="bg-card rounded-2xl p-4 shadow-sm border border-border/50 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl border-border/50"
          />
        </div>
      </div>

      {students.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50">
          <Users className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="font-bold text-lg text-slate-800">Your roster is empty</h3>
          <Button onClick={() => setDialogOpen(true)} className="mt-4 bg-newton-pink text-white">Add First Student</Button>
        </div>
      ) : (
        <div className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-secondary/10 text-left">
                  <th className="px-6 py-4 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Student</th>
                  <th className="px-6 py-4 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Fluency (WPM)</th>
                  <th className="px-6 py-4 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider text-center">Trend</th>
                  <th className="px-6 py-4 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Status</th>
                  <th className="px-6 py-4 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((student, i) => {
                  const TrendIcon = trendIcons[student.trend] || Minus;
                  return (
                    <tr key={student.id} className="border-b border-border/30 hover:bg-secondary/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white font-bold`}>
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{student.name}</p>
                            <p className="text-xs text-muted-foreground">{student.grade}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            className="w-16 h-8 text-center text-newton-cyan font-bold border-transparent hover:border-border focus:border-newton-cyan bg-secondary/30"
                            value={student.fluency_wpm || 0}
                            onChange={(e) => updateFluency(student.id, e.target.value)}
                          />
                          <span className="text-[10px] font-bold text-muted-foreground">WPM</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center">
                          <TrendIcon className={`w-4 h-4 ${trendColors[student.trend]}`} />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={student.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteStudent(student.id)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AddStudentDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        onCreated={loadStudents} 
      />
    </div>
  );
}
