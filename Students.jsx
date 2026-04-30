import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus, Search, UserCircle, BarChart2, Hash } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // State for privacy-focused editing
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState({ name: "", sightWordScore: "", mathScore: "" });
  
  // State for new student entry
  const [formData, setFormData] = useState({
    nickname: "",
    sightWordScore: "",
    mathScore: ""
  });

  useEffect(() => {
    // Mock data including your new CBM fields
    const mockData = [
      { id: 1, name: "Aiko", sightWordScore: "45", mathScore: "12" },
      { id: 2, name: "Newt", sightWordScore: "32", mathScore: "8" }
    ];
    setStudents(mockData);
    setLoading(false);
  }, []);

const handleAddStudent = () => {
    // 1. Validation check
    if (!formData.nickname.trim()) return;
    
    // 2. Create the student object
    const newEntry = {
      id: Date.now(),
      name: formData.nickname,
      sightWordScore: formData.sightWordScore || "—",
      mathScore: formData.mathScore || "—",
    };

    // 3. Update state and permanent memory
    const updatedList = [...students, newEntry];
    setStudents(updatedList);
    localStorage.setItem('newton_students', JSON.stringify(updatedList));

    // 4. Reset the form and close
    setFormData({ nickname: "", sightWordScore: "", mathScore: "" });
    setDialogOpen(false);
    toast.success("Student added to roster and Lab.");
 
    toast.success("Student added with CBM data.");
  };

  const startEditing = (student) => {
    setEditingId(student.id);
    setEditValue({ 
      name: student.name, 
      sightWordScore: student.sightWordScore, 
      mathScore: student.mathScore 
    });
  };

  const saveEdit = (id) => {
    setStudents(students.map(s => 
      s.id === id ? { 
        ...s, 
        name: editValue.name, 
        sightWordScore: editValue.sightWordScore, 
        mathScore: editValue.mathScore 
      } : s
    ));
    setEditingId(null);
    toast.success("Student data updated.");
  };

  const deleteStudent = (id) => {
    setStudents(students.filter(s => s.id !== id));
    toast.error("Student removed.");
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Student Roster</h1>
          <p className="text-slate-500">Manage nicknames and CBM baseline data.</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="mr-2 h-4 w-4" /> Add Student
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Student & CBM Data</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Nickname</label>
                <Input 
                  placeholder="e.g. Student A" 
                  value={formData.nickname}
                  onChange={(e) => setFormData({...formData, nickname: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block text-indigo-600">Sight Word CBM</label>
                  <Input 
                    placeholder="WPM" 
                    value={formData.sightWordScore}
                    onChange={(e) => setFormData({...formData, sightWordScore: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block text-emerald-600">Math CBM</label>
                  <Input 
                    placeholder="Score" 
                    value={formData.mathScore}
                    onChange={(e) => setFormData({...formData, mathScore: e.target.value})}
                  />
                </div>
              </div>
              <p className="text-xs text-slate-400">Values are pulled from your results in The Lab.</p>
            </div>
            <DialogFooter>
              <Button onClick={handleAddStudent}>Save Student Profile</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-slate-700">Student Nickname</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-700 text-center">Sight Words</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-700 text-center">Math CBM</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-700 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredStudents.map((student) => (
              <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  {editingId === student.id ? (
                    <Input 
                      value={editValue.name}
                      onChange={(e) => setEditValue({...editValue, name: e.target.value})}
                      className="h-8 w-32"
                    />
                  ) : (
                    <span className="font-medium text-slate-700">{student.name}</span>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  {editingId === student.id ? (
                    <Input 
                      value={editValue.sightWordScore}
                      onChange={(e) => setEditValue({...editValue, sightWordScore: e.target.value})}
                      className="h-8 w-16 mx-auto text-center"
                    />
                  ) : (
                    <span className="text-indigo-600 font-semibold">{student.sightWordScore}</span>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  {editingId === student.id ? (
                    <Input 
                      value={editValue.mathScore}
                      onChange={(e) => setEditValue({...editValue, mathScore: e.target.value})}
                      className="h-8 w-16 mx-auto text-center"
                    />
                  ) : (
                    <span className="text-emerald-600 font-semibold">{student.mathScore}</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    {editingId === student.id ? (
                      <Button size="sm" onClick={() => saveEdit(student.id)} className="bg-green-600 h-8">Save</Button>
                    ) : (
                      <Button variant="ghost" size="icon" onClick={() => startEditing(student)}>
                        <Pencil className="h-4 w-4 text-slate-500" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => deleteStudent(student.id)}>
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
