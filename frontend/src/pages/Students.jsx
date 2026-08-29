import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Archive, 
  RotateCcw, 
  FileSpreadsheet, 
  ExternalLink, 
  FileText, 
  Video, 
  X, 
  Check, 
  AlertCircle,
  Briefcase,
  GraduationCap,
  Mail,
  Phone,
  User,
  Building,
  Award,
  Globe,
  Code2,
  Lock
} from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import ExcelImportModal from '../components/ExcelImportModal';

const DEPARTMENTS = ['All', 'CSE', 'IT', 'ECE', 'EEE', 'MECH', 'MBA'];
const STATUSES = ['All', 'Placed', 'Unplaced'];

export default function Students() {
  const { user } = useAuth();
  const canManageStudents = user?.role === 'admin' || user?.role === 'manager';

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showArchived, setShowArchived] = useState(false);

  // Modals & Drawers
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [studentToArchive, setStudentToArchive] = useState(null);
  const [archiveReason, setArchiveReason] = useState('');
  const [archiveNote, setArchiveNote] = useState('');
  const [isExcelOpen, setIsExcelOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [formData, setFormData] = useState({
    reg_no: '',
    name: '',
    dept: 'CSE',
    course: 'B.Tech',
    gender: 'Male',
    is_hosteller: false,
    sslc_pct: '',
    hsc_pct: '',
    ug_pct: '',
    pg_pct: '',
    github_url: '',
    linkedin_url: '',
    resume_url: '',
    intro_video_url: '',
    photo_url: '',
    grad_year: 2026,
    portfolio_url: '',
    email: '',
    phone: ''
  });
  const [formErrors, setFormErrors] = useState({});

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/students', {
        params: {
          dept: deptFilter,
          placement_status: statusFilter,
          is_archived: showArchived,
          search: search || undefined
        }
      });
      setStudents(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [deptFilter, statusFilter, showArchived, search, user]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleOpenCreate = () => {
    if (!canManageStudents) return;
    setEditingStudent(null);
    setFormData({
      reg_no: '',
      name: '',
      dept: 'CSE',
      course: 'B.Tech',
      gender: 'Male',
      is_hosteller: false,
      sslc_pct: '',
      hsc_pct: '',
      ug_pct: '',
      pg_pct: '',
      github_url: '',
      linkedin_url: '',
      resume_url: '',
      intro_video_url: '',
      photo_url: '',
      grad_year: 2026,
      portfolio_url: '',
      email: '',
      phone: ''
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleOpenEdit = (student) => {
    if (!canManageStudents) return;
    setEditingStudent(student);
    setFormData({
      reg_no: student.reg_no,
      name: student.name,
      dept: student.dept,
      course: student.course,
      gender: student.gender,
      is_hosteller: student.is_hosteller,
      sslc_pct: student.sslc_pct,
      hsc_pct: student.hsc_pct,
      ug_pct: student.ug_pct,
      pg_pct: student.pg_pct || '',
      github_url: student.github_url || '',
      linkedin_url: student.linkedin_url || '',
      resume_url: student.resume_url || '',
      intro_video_url: student.intro_video_url || '',
      photo_url: student.photo_url || '',
      grad_year: student.grad_year,
      portfolio_url: student.portfolio_url || '',
      email: student.email,
      phone: student.phone
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.reg_no.trim()) errs.reg_no = 'Registration Number is required';
    if (!formData.name.trim()) errs.name = 'Full Name is required';
    if (!formData.email.trim() || !formData.email.includes('@')) errs.email = 'Valid Email is required';
    if (!formData.phone.trim()) errs.phone = 'Phone Number is required';
    
    const sslc = parseFloat(formData.sslc_pct);
    if (isNaN(sslc) || sslc < 0 || sslc > 100) errs.sslc_pct = 'Must be 0-100%';

    const hsc = parseFloat(formData.hsc_pct);
    if (isNaN(hsc) || hsc < 0 || hsc > 100) errs.hsc_pct = 'Must be 0-100%';

    const ug = parseFloat(formData.ug_pct);
    if (isNaN(ug) || ug < 0 || ug > 100) errs.ug_pct = 'Must be 0-100%';

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    if (!canManageStudents) return;
    if (!validateForm()) return;

    try {
      const payload = {
        ...formData,
        sslc_pct: parseFloat(formData.sslc_pct),
        hsc_pct: parseFloat(formData.hsc_pct),
        ug_pct: parseFloat(formData.ug_pct),
        pg_pct: formData.pg_pct ? parseFloat(formData.pg_pct) : null,
        grad_year: parseInt(formData.grad_year, 10)
      };

      if (editingStudent) {
        await api.put(`/students/${editingStudent.id}`, payload);
        showToast(`Updated student: ${payload.name}`);
      } else {
        await api.post('/students', payload);
        showToast(`Added student: ${payload.name}`);
      }
      setIsFormOpen(false);
      fetchStudents();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to save student record.');
    }
  };

  const handleArchiveConfirm = async () => {
    if (!canManageStudents) return;
    if (!archiveReason.trim()) {
      alert('Archive reason is required.');
      return;
    }
    try {
      await api.post(`/students/${studentToArchive.id}/archive`, {
        reason: archiveReason,
        note: archiveNote
      });
      showToast(`Archived student ${studentToArchive.name}`);
      setIsArchiveOpen(false);
      setStudentToArchive(null);
      setArchiveReason('');
      setArchiveNote('');
      fetchStudents();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnarchive = async (id, name) => {
    if (!canManageStudents) return;
    try {
      await api.post(`/students/${id}/unarchive`);
      showToast(`Recovered student: ${name}`);
      fetchStudents();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePermanent = async (id, name) => {
    if (!canManageStudents) return;
    if (!window.confirm(`Permanently delete student ${name}? This action cannot be undone.`)) return;
    try {
      await api.delete(`/students/${id}`);
      showToast(`Deleted ${name}`);
      fetchStudents();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-800 text-xs font-semibold flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, reg no, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-slate-500">Dept:</span>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-700"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-700"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {canManageStudents && (
            <button
              type="button"
              onClick={() => setShowArchived(!showArchived)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                showArchived 
                  ? 'bg-amber-100 text-amber-900 border-amber-300' 
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {showArchived ? 'Viewing Archived' : 'Show Archived'}
            </button>
          )}
        </div>

        {/* Action Buttons (Only for Admin & Manager) */}
        {canManageStudents ? (
          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => setIsExcelOpen(true)}
              className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel Import</span>
            </button>
            <button
              onClick={handleOpenCreate}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-sm shadow-indigo-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add Student</span>
            </button>
          </div>
        ) : (
          <div className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-500 font-medium flex items-center space-x-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Read-Only Placement Candidate View</span>
          </div>
        )}
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Reg No</th>
                <th className="py-3 px-4">Department & Course</th>
                <th className="py-3 px-4">Academic Score</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                    Loading student records...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No student records found matching the active filters.
                  </td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <img 
                          src={s.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'} 
                          alt={s.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <p className="font-bold text-slate-800">{s.name}</p>
                          <p className="text-[11px] text-slate-500">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-700">{s.reg_no}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">{s.dept}</span>
                      <span className="text-slate-400 mx-1">•</span>
                      <span className="text-slate-600">{s.course}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-indigo-600">{s.ug_pct}%</span>
                      <span className="text-[11px] text-slate-400 ml-1">(HSC: {s.hsc_pct}%)</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        s.placement_status === 'Placed' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {s.placement_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => setSelectedStudent(s)}
                          title="View Profile"
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canManageStudents && !s.is_archived && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(s)}
                              title="Edit Record"
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setStudentToArchive(s); setIsArchiveOpen(true); }}
                              title="Archive Record"
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-lg"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {canManageStudents && s.is_archived && (
                          <button
                            onClick={() => handleUnarchive(s.id, s.name)}
                            title="Recover Student"
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                        {canManageStudents && (
                          <button
                            onClick={() => handleDeletePermanent(s.id, s.name)}
                            title="Delete Permanently"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Details Drawer */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end animate-in fade-in">
          <div className="w-full max-w-xl bg-white shadow-2xl h-full flex flex-col overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-start justify-between bg-slate-50">
              <div className="flex items-center space-x-4">
                <img 
                  src={selectedStudent.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                  alt={selectedStudent.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-indigo-200 shadow-sm"
                />
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{selectedStudent.name}</h3>
                  <p className="text-xs font-semibold text-slate-500 font-mono">{selectedStudent.reg_no}</p>
                  <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    selectedStudent.placement_status === 'Placed' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {selectedStudent.placement_status}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedStudent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 flex-1 text-xs">
              <div>
                <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
                  <GraduationCap className="w-4 h-4" />
                  <span>Academic Information</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
                    <p className="text-[10px] text-slate-500">Department</p>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">{selectedStudent.dept}</p>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
                    <p className="text-[10px] text-slate-500">Course</p>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">{selectedStudent.course}</p>
                  </div>
                  <div className="p-2.5 bg-indigo-50 rounded-lg border border-indigo-100">
                    <p className="text-[10px] text-indigo-600">UG Score</p>
                    <p className="font-extrabold text-indigo-900 text-sm mt-0.5">{selectedStudent.ug_pct}%</p>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
                    <p className="text-[10px] text-slate-500">HSC / SSLC</p>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">{selectedStudent.hsc_pct}% / {selectedStudent.sslc_pct}%</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
                  <User className="w-4 h-4" />
                  <span>Personal & Contact Info</span>
                </h4>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Gender / Hosteller:</span>
                    <span className="font-semibold text-slate-800">{selectedStudent.gender} • {selectedStudent.is_hosteller ? 'Hosteller' : 'Day Scholar'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Email ID:</span>
                    <a href={`mailto:${selectedStudent.email}`} className="font-semibold text-indigo-600 hover:underline">{selectedStudent.email}</a>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Phone:</span>
                    <span className="font-semibold text-slate-800">{selectedStudent.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Graduation Year:</span>
                    <span className="font-semibold text-slate-800">{selectedStudent.grad_year}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
                  <ExternalLink className="w-4 h-4" />
                  <span>Professional Links & Resume</span>
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {selectedStudent.resume_url ? (
                    <a 
                      href={selectedStudent.resume_url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="p-2.5 bg-indigo-50/80 border border-indigo-200 rounded-lg flex items-center space-x-2 text-indigo-700 font-semibold hover:bg-indigo-100 transition-all"
                    >
                      <FileText className="w-4 h-4 text-indigo-600" />
                      <span className="truncate">View Resume (Link)</span>
                    </a>
                  ) : (
                    <span className="p-2.5 bg-slate-100 rounded-lg text-slate-400 font-medium">No Resume Link</span>
                  )}

                  {selectedStudent.github_url && (
                    <a 
                      href={selectedStudent.github_url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="p-2.5 bg-slate-100 border border-slate-200 rounded-lg flex items-center space-x-2 text-slate-700 font-semibold hover:bg-slate-200 transition-all"
                    >
                      <Code2 className="w-4 h-4" />
                      <span className="truncate">GitHub Profile</span>
                    </a>
                  )}

                  {selectedStudent.linkedin_url && (
                    <a 
                      href={selectedStudent.linkedin_url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg flex items-center space-x-2 text-blue-700 font-semibold hover:bg-blue-100 transition-all"
                    >
                      <Globe className="w-4 h-4 text-blue-600" />
                      <span className="truncate">LinkedIn Profile</span>
                    </a>
                  )}

                  {selectedStudent.intro_video_url && (
                    <a 
                      href={selectedStudent.intro_video_url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center space-x-2 text-rose-700 font-semibold hover:bg-rose-100 transition-all"
                    >
                      <Video className="w-4 h-4 text-rose-600" />
                      <span className="truncate">Intro Video</span>
                    </a>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
                  <Award className="w-4 h-4" />
                  <span>Placement History</span>
                </h4>
                {selectedStudent.placement_history && selectedStudent.placement_history.length > 0 ? (
                  <div className="space-y-2">
                    {selectedStudent.placement_history.map((p, idx) => (
                      <div key={idx} className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="font-bold text-emerald-900 text-sm">{p.company_name}</p>
                          <p className="text-emerald-700 text-[11px] font-medium">{p.role} • Drive: {p.drive_date}</p>
                        </div>
                        <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold text-xs">
                          {p.ctc} LPA
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-center">
                    No confirmed placements recorded yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Student Modal */}
      {isFormOpen && canManageStudents && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 text-base">
                {editingStudent ? `Edit Student: ${editingStudent.name}` : 'Register New Student'}
              </h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="p-6 space-y-4 text-xs overflow-y-auto max-h-[75vh]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Registration Number *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingStudent}
                    value={formData.reg_no}
                    onChange={(e) => setFormData({ ...formData, reg_no: e.target.value })}
                    className="w-full p-2 border rounded-lg border-slate-300 disabled:bg-slate-100"
                    placeholder="e.g. 2022CSE101"
                  />
                  {formErrors.reg_no && <p className="text-rose-600 mt-0.5">{formErrors.reg_no}</p>}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 border rounded-lg border-slate-300"
                    placeholder="Student Name"
                  />
                  {formErrors.name && <p className="text-rose-600 mt-0.5">{formErrors.name}</p>}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department *</label>
                  <select
                    value={formData.dept}
                    onChange={(e) => setFormData({ ...formData, dept: e.target.value })}
                    className="w-full p-2 border rounded-lg border-slate-300 bg-white"
                  >
                    {DEPARTMENTS.filter(d => d !== 'All').map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Course *</label>
                  <select
                    value={formData.course}
                    onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                    className="w-full p-2 border rounded-lg border-slate-300 bg-white"
                  >
                    <option value="B.Tech">B.Tech</option>
                    <option value="M.Tech">M.Tech</option>
                    <option value="MCA">MCA</option>
                    <option value="MBA">MBA</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email ID *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2 border rounded-lg border-slate-300"
                    placeholder="student@college.edu"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2 border rounded-lg border-slate-300"
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">UG Score (%) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.ug_pct}
                    onChange={(e) => setFormData({ ...formData, ug_pct: e.target.value })}
                    className="w-full p-2 border rounded-lg border-slate-300"
                    placeholder="e.g. 85.5"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">HSC (%) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.hsc_pct}
                    onChange={(e) => setFormData({ ...formData, hsc_pct: e.target.value })}
                    className="w-full p-2 border rounded-lg border-slate-300"
                    placeholder="e.g. 88.0"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">SSLC (%) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.sslc_pct}
                    onChange={(e) => setFormData({ ...formData, sslc_pct: e.target.value })}
                    className="w-full p-2 border rounded-lg border-slate-300"
                    placeholder="e.g. 92.0"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">PG Score (%) (Optional)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.pg_pct}
                    onChange={(e) => setFormData({ ...formData, pg_pct: e.target.value })}
                    className="w-full p-2 border rounded-lg border-slate-300"
                    placeholder="Optional"
                  />
                </div>
              </div>

              {/* Professional URLs */}
              <div className="pt-2 border-t border-slate-200 space-y-3">
                <p className="font-bold text-slate-700">Resume & Professional Links (Extracted automatically for JD Matching)</p>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Resume Link (Google Drive / Direct PDF link)</label>
                  <input
                    type="url"
                    value={formData.resume_url}
                    onChange={(e) => setFormData({ ...formData, resume_url: e.target.value })}
                    className="w-full p-2 border rounded-lg border-slate-300"
                    placeholder="https://drive.google.com/file/d/... or public PDF link"
                  />
                  {formData.resume_url && (
                    <div className="mt-1.5 p-2 bg-indigo-50 text-indigo-700 rounded-md text-[11px] flex items-center justify-between">
                      <span>✓ Link detected for AI text extraction</span>
                      <a href={formData.resume_url} target="_blank" rel="noreferrer" className="underline font-bold">Preview Link</a>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">GitHub Link</label>
                    <input
                      type="url"
                      value={formData.github_url}
                      onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                      className="w-full p-2 border rounded-lg border-slate-300"
                      placeholder="https://github.com/..."
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">LinkedIn Link</label>
                    <input
                      type="url"
                      value={formData.linkedin_url}
                      onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                      className="w-full p-2 border rounded-lg border-slate-300"
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  Save Student Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Archive Modal */}
      {isArchiveOpen && studentToArchive && canManageStudents && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-bold text-slate-800 text-base">Archive Student: {studentToArchive.name}</h3>
            <p className="text-xs text-slate-500">
              Archiving hides the student from active drive registries but preserves all historical records for recovery.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Archival *</label>
              <select
                value={archiveReason}
                onChange={(e) => setArchiveReason(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
              >
                <option value="">Select a reason</option>
                <option value="Opted for Higher Studies">Opted for Higher Studies</option>
                <option value="Entrepreneurship / Startup">Entrepreneurship / Startup</option>
                <option value="Family Business">Family Business</option>
                <option value="Off-Campus Placed">Off-Campus Placed</option>
                <option value="Disciplinary Action">Disciplinary Action</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Archive Note (Optional)</label>
              <textarea
                value={archiveNote}
                onChange={(e) => setArchiveNote(e.target.value)}
                rows={3}
                className="w-full text-xs p-2 rounded-lg border border-slate-300"
                placeholder="Additional placement cell remarks..."
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsArchiveOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleArchiveConfirm}
                className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm"
              >
                Confirm Archival
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excel Import Modal */}
      {canManageStudents && (
        <ExcelImportModal
          isOpen={isExcelOpen}
          onClose={() => setIsExcelOpen(false)}
          onSuccess={(count) => {
            showToast(`Successfully imported ${count} students!`);
            fetchStudents();
          }}
        />
      )}
    </div>
  );
}
