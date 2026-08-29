import React, { useEffect, useState } from 'react';
import { 
  Building2, 
  Plus, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Upload, 
  Edit, 
  Send, 
  Check, 
  AlertCircle,
  MessageSquare,
  Award,
  Users,
  Search,
  ExternalLink,
  ChevronDown,
  Sparkles,
  Eye,
  Loader2,
  Shield,
  UserPlus,
  Lock,
  Unlock,
  KeyRound,
  Trash2
} from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const STATUS_OPTIONS = ['Cold', 'Warm', 'Hot', 'Placement Completed'];
const TIERS = ['Super Dream', 'Dream', 'Tier 1', 'Tier 2', 'Tier 3'];

export default function PlacementTeam() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isTeamMember = user?.role === 'team_member';
  const [teamMembers, setTeamMembers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [students, setStudents] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tab switcher in Placement Team: Leads vs User Access Controls
  const [activeSection, setActiveSection] = useState('leads'); // 'leads' or 'users'

  // Modals
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
  const [activeLeadForFollowUp, setActiveLeadForFollowUp] = useState(null);
  const [isJDUploadOpen, setIsJDUploadOpen] = useState(false);
  const [activeLeadForJD, setActiveLeadForJD] = useState(null);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [activeLeadForDrive, setActiveLeadForDrive] = useState(null);

  // User Provisioning Modal (Admin)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    password: 'password123',
    role: 'team_member',
    phone: '+91 98765 00000',
    designation: 'Placement Officer',
    can_manage_leads: true,
    can_upload_jd: true,
    can_complete_drives: true,
    can_manage_students: false,
    can_view_reports: true
  });

  // JD Live Pre-Upload State
  const [jdFile, setJdFile] = useState(null);
  const [jdPreview, setJdPreview] = useState(null);
  const [loadingJDPreview, setLoadingJDPreview] = useState(false);

  // Lead Form
  const [leadForm, setLeadForm] = useState({
    company_name: '',
    location: '',
    poc_name: '',
    poc_email: '',
    poc_phone: '',
    team_member_id: '',
    tier: 'Tier 2',
    ctc: '',
    role: '',
    status: 'Cold',
    drive_date: ''
  });

  // Follow-up Form
  const [followUpForm, setFollowUpForm] = useState({
    notes: '',
    follow_up_date: new Date().toISOString().split('T')[0],
    next_step: ''
  });

  // Drive Completion Form
  const [driveForm, setDriveForm] = useState({
    number_of_offers: '',
    selected_student_ids: [],
    role: '',
    ctc: '',
    drive_date: new Date().toISOString().split('T')[0]
  });

  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      const requests = [
        api.get('/team/members'),
        api.get('/leads'),
        api.get('/students?placement_status=Unplaced'),
      ];
      if (isAdmin) {
        requests.push(api.get('/auth/users'));
      }
      const [membersRes, leadsRes, studentsRes, usersRes] = await Promise.all(requests);
      setTeamMembers(membersRes.data);
      setLeads(leadsRes.data);
      setStudents(studentsRes.data);
      setUsersList(usersRes?.data || []);
      if (membersRes.data.length > 0 && !leadForm.team_member_id) {
        setLeadForm(prev => ({ ...prev, team_member_id: membersRes.data[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [isAdmin]);

  const handleOpenCreateLead = () => {
    setEditingLead(null);
    setLeadForm({
      company_name: '',
      location: '',
      poc_name: '',
      poc_email: '',
      poc_phone: '',
      team_member_id: teamMembers[0]?.id || '',
      tier: 'Tier 2',
      ctc: '',
      role: '',
      status: 'Cold',
      drive_date: ''
    });
    setIsLeadModalOpen(true);
  };

  const handleOpenEditLead = (lead) => {
    setEditingLead(lead);
    setLeadForm({
      company_name: lead.company_name,
      location: lead.location,
      poc_name: lead.poc_name,
      poc_email: lead.poc_email,
      poc_phone: lead.poc_phone,
      team_member_id: lead.team_member_id,
      tier: lead.tier,
      ctc: lead.ctc,
      role: lead.role,
      status: lead.status,
      drive_date: lead.drive_date || ''
    });
    setIsLeadModalOpen(true);
  };

  const handleSaveLead = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...leadForm,
        ctc: parseFloat(leadForm.ctc),
        team_member_id: parseInt(leadForm.team_member_id, 10)
      };
      if (editingLead) {
        await api.put(`/leads/${editingLead.id}`, payload);
        showToast(`Updated company lead: ${payload.company_name}`);
      } else {
        await api.post('/leads', payload);
        showToast(`Created company lead: ${payload.company_name}`);
      }
      setIsLeadModalOpen(false);
      loadAllData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to save company lead.');
    }
  };

  const handleSubmitForApproval = async (leadId, companyName) => {
    try {
      await api.post(`/leads/${leadId}/submit-approval`);
      showToast(`Submitted ${companyName} for Admin approval.`);
      loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReviewLead = async (leadId, action, companyName) => {
    try {
      await api.post(`/leads/${leadId}/review?action=${action}`);
      showToast(`Lead ${companyName} has been ${action}d.`);
      loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // Pre-Upload JD File Selection
  const handleJDFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setJdFile(file);

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoadingJDPreview(true);
      const res = await api.post('/jd/preview-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setJdPreview(res.data);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Could not parse JD file.');
      setJdPreview(null);
    } finally {
      setLoadingJDPreview(false);
    }
  };

  const handleConfirmJDUpload = async () => {
    if (!activeLeadForJD || !jdPreview) return;
    try {
      const formData = new FormData();
      formData.append('company_name', activeLeadForJD.company_name);
      formData.append('lead_id', activeLeadForJD.id);
      if (jdFile) formData.append('file', jdFile);
      formData.append('raw_text', jdPreview.raw_text);

      await api.post('/jd/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showToast(`JD extracted & linked to ${activeLeadForJD.company_name}!`);
      setIsJDUploadOpen(false);
      setJdFile(null);
      setJdPreview(null);
      loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // Follow up save
  const handleSaveFollowUp = async (e) => {
    e.preventDefault();
    if (!activeLeadForFollowUp) return;
    try {
      await api.post('/team/follow-ups', {
        lead_id: activeLeadForFollowUp.id,
        team_member_id: activeLeadForFollowUp.team_member_id,
        ...followUpForm
      });
      showToast(`Follow-up logged for ${activeLeadForFollowUp.company_name}`);
      setIsFollowUpOpen(false);
      setFollowUpForm({ notes: '', follow_up_date: new Date().toISOString().split('T')[0], next_step: '' });
      loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // Drive completion
  const handleOpenDriveCompletion = (lead) => {
    setActiveLeadForDrive(lead);
    setDriveForm({
      number_of_offers: '',
      selected_student_ids: [],
      role: lead.role,
      ctc: lead.ctc,
      drive_date: lead.drive_date || new Date().toISOString().split('T')[0]
    });
    setIsDriveModalOpen(true);
  };

  const handleCompleteDrive = async (e) => {
    e.preventDefault();
    if (!activeLeadForDrive) return;
    if (driveForm.selected_student_ids.length === 0) {
      alert('Please select at least one placed student.');
      return;
    }
    try {
      const compRes = await api.get('/companies');
      const comp = compRes.data.find(c => c.name === activeLeadForDrive.company_name) || compRes.data[0];
      
      const payload = {
        company_id: comp.id,
        drive_date: driveForm.drive_date,
        role: driveForm.role,
        ctc: parseFloat(driveForm.ctc),
        number_of_offers: parseInt(driveForm.number_of_offers, 10) || driveForm.selected_student_ids.length,
        selected_student_ids: driveForm.selected_student_ids
      };

      await api.post('/placements/complete-drive', payload);
      showToast(`Drive completed! ${payload.selected_student_ids.length} students status updated to Placed.`);
      setIsDriveModalOpen(false);
      loadAllData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to complete drive.');
    }
  };

  const toggleStudentSelection = (id) => {
    setDriveForm(prev => {
      const exists = prev.selected_student_ids.includes(id);
      return {
        ...prev,
        selected_student_ids: exists 
          ? prev.selected_student_ids.filter(x => x !== id)
          : [...prev.selected_student_ids, id]
      };
    });
  };

  // Admin User Provisioning
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/users', newUserForm);
      showToast(`Created ${newUserForm.role.toUpperCase()}: ${newUserForm.name}`);
      setIsUserModalOpen(false);
      setNewUserForm({
        name: '',
        email: '',
        password: 'password123',
        role: 'team_member',
        phone: '+91 98765 00000',
        designation: 'Placement Officer',
        can_manage_leads: true,
        can_upload_jd: true,
        can_complete_drives: true,
        can_manage_students: false,
        can_view_reports: true
      });
      loadAllData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to create user account.');
    }
  };

  const handleTogglePermission = async (userId, permKey, currentVal) => {
    try {
      await api.put(`/auth/users/${userId}/permissions`, {
        [permKey]: !currentVal
      });
      showToast(`Updated permissions for user.`);
      loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleUserActive = async (userId, currentActive) => {
    try {
      await api.put(`/auth/users/${userId}/permissions`, {
        is_active: !currentActive
      });
      showToast(`User status updated.`);
      loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Delete user account for ${userName}?`)) return;
    try {
      await api.delete(`/auth/users/${userId}`);
      showToast(`User ${userName} deleted.`);
      loadAllData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Cannot delete primary admin.');
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

      {/* Top Header & Section Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-800">Placement Team & Access Governance</h3>
          <p className="text-xs text-slate-500">Corporate leads, follow-ups, and user role access management</p>
        </div>

        <div className="flex items-center space-x-2 bg-slate-200/70 p-1 rounded-xl">
          <button
            onClick={() => setActiveSection('leads')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSection === 'leads' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Leads & Pipeline
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveSection('users')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                activeSection === 'users' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>User Access Control</span>
            </button>
          )}
        </div>
      </div>

      {activeSection === 'leads' && (
        <>
          {/* 1. Placement Team Overview Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Team Member Accounts</span>
              {isTeamMember && (
                <button
                  onClick={handleOpenCreateLead}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Company Lead</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {teamMembers.map((tm) => (
                <div key={tm.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                        {tm.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs">{tm.name}</h4>
                        <p className="text-[11px] text-slate-500">{tm.designation}</p>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-4 gap-1.5 text-center text-[10px]">
                      <div className="p-1.5 bg-slate-50 rounded-lg">
                        <p className="text-slate-400 font-semibold">Cold</p>
                        <p className="font-extrabold text-slate-700">{tm.cold_leads}</p>
                      </div>
                      <div className="p-1.5 bg-amber-50 rounded-lg">
                        <p className="text-amber-600 font-semibold">Warm</p>
                        <p className="font-extrabold text-amber-800">{tm.warm_leads}</p>
                      </div>
                      <div className="p-1.5 bg-rose-50 rounded-lg">
                        <p className="text-rose-600 font-semibold">Hot</p>
                        <p className="font-extrabold text-rose-800">{tm.hot_leads}</p>
                      </div>
                      <div className="p-1.5 bg-emerald-50 rounded-lg">
                        <p className="text-emerald-600 font-semibold">Done</p>
                        <p className="font-extrabold text-emerald-800">{tm.completed_placements}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{tm.assigned_leads_count} Leads Assigned</span>
                    <span className="font-semibold text-indigo-600">{tm.follow_ups_count} Follow-ups</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Company Leads Table & Workflow Pipeline */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Company Leads & Approval Pipeline</h3>
                <p className="text-xs text-slate-500">Follow-up tracker, JD upload, admin verification, and drive finalization</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                  <tr>
                    <th className="py-3 px-4">Company & Location</th>
                    <th className="py-3 px-4">Contact Person</th>
                    <th className="py-3 px-4">Role & CTC</th>
                    <th className="py-3 px-4">Lead Status</th>
                    <th className="py-3 px-4">Approval Status</th>
                    <th className="py-3 px-4">JD Attachment</th>
                    <th className="py-3 px-4 text-right">Actions & Workflow</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leads.map((lead) => {
                    const getStatusColor = (stg) => {
                      switch (stg) {
                        case 'Cold': return 'bg-slate-100 text-slate-700';
                        case 'Warm': return 'bg-amber-100 text-amber-800';
                        case 'Hot': return 'bg-rose-100 text-rose-800';
                        case 'Placement Completed': return 'bg-emerald-100 text-emerald-800';
                        default: return 'bg-slate-100 text-slate-700';
                      }
                    };

                    const getApprovalColor = (app) => {
                      switch (app) {
                        case 'Approved': return 'bg-purple-100 text-purple-800 border-purple-200';
                        case 'Pending Approval': return 'bg-amber-100 text-amber-800 border-amber-200 animate-pulse';
                        case 'Rejected': return 'bg-rose-100 text-rose-800 border-rose-200';
                        default: return 'bg-slate-100 text-slate-600 border-slate-200';
                      }
                    };

                    return (
                      <tr key={lead.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-800">{lead.company_name}</p>
                          <p className="text-[11px] text-slate-500">{lead.location} • <span className="font-semibold text-indigo-600">{lead.tier}</span></p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-700">{lead.poc_name}</p>
                          <p className="text-[11px] text-slate-500">{lead.poc_email} • {lead.poc_phone}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-800">{lead.role}</p>
                          <p className="text-[11px] font-bold text-indigo-600">{lead.ctc} LPA</p>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${getStatusColor(lead.status)}`}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getApprovalColor(lead.approval_status)}`}>
                            {lead.approval_status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {lead.jd_id ? (
                            <div className="flex items-center space-x-1.5 text-emerald-700 font-semibold text-[11px]">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>{lead.jd_file_name || 'JD Extracted'}</span>
                            </div>
                          ) : isTeamMember ? (
                            <button
                              onClick={() => { setActiveLeadForJD(lead); setIsJDUploadOpen(true); }}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold text-[11px] flex items-center space-x-1 border border-indigo-200"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>Upload JD</span>
                            </button>
                          ) : (
                            <span className="text-[11px] font-semibold text-slate-400">No JD Uploaded</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            {isTeamMember && (
                              <>
                                <button
                                  onClick={() => { setActiveLeadForFollowUp(lead); setIsFollowUpOpen(true); }}
                                  title="Log Follow-Up"
                                  className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg"
                                >
                                  <MessageSquare className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => handleOpenEditLead(lead)}
                                  title="Edit Lead"
                                  className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              </>
                            )}

                            {isTeamMember && lead.approval_status === 'Draft' && (
                              <button
                                onClick={() => handleSubmitForApproval(lead.id, lead.company_name)}
                                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-[11px] flex items-center space-x-1"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Submit</span>
                              </button>
                            )}

                            {isAdmin && lead.approval_status === 'Pending Approval' && (
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => handleReviewLead(lead.id, 'approve', lead.company_name)}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px]"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleReviewLead(lead.id, 'reject', lead.company_name)}
                                  className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[10px]"
                                >
                                  Reject
                                </button>
                              </div>
                            )}

                            {isTeamMember && lead.approval_status === 'Approved' && lead.status !== 'Placement Completed' && (
                              <button
                                onClick={() => handleOpenDriveCompletion(lead)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] flex items-center space-x-1 shadow-xs"
                              >
                                <Award className="w-3.5 h-3.5" />
                                <span>Complete Drive</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Access Control & Staff Management Panel (Admin Only) */}
      {activeSection === 'users' && user?.role === 'admin' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-200 gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                <span>Placement Cell Staff & Role Governance</span>
              </h3>
              <p className="text-xs text-slate-500">Provision new placement officers and managers, and configure granular permissions</p>
            </div>
            <button
              onClick={() => setIsUserModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center space-x-2 shadow-sm shadow-indigo-600/20"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Member / Manager</span>
            </button>
          </div>

          {/* User Table with Permission Toggles */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase">
                <tr>
                  <th className="p-3">Staff Member</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-center">Manage Leads</th>
                  <th className="p-3 text-center">Upload JD</th>
                  <th className="p-3 text-center">Complete Drives</th>
                  <th className="p-3 text-center">Manage Students</th>
                  <th className="p-3 text-center">View Reports</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.map((u) => {
                  const isPrimaryAdmin = u.email === 'admin@college.edu';
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3">
                        <p className="font-bold text-slate-900">{u.name}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{u.email}</p>
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          u.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800 border-purple-300' 
                            : u.role === 'manager'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-blue-100 text-blue-800 border-blue-300'
                        }`}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          disabled={isPrimaryAdmin}
                          onClick={() => handleToggleUserActive(u.id, u.is_active)}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                            u.is_active 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-rose-50 hover:text-rose-700' 
                              : 'bg-slate-100 text-slate-500 border border-slate-300 hover:bg-emerald-50 hover:text-emerald-700'
                          }`}
                        >
                          {u.is_active ? 'Active' : 'Disabled'}
                        </button>
                      </td>

                      {/* Permission Toggles */}
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          disabled={isPrimaryAdmin}
                          checked={u.can_manage_leads}
                          onChange={() => handleTogglePermission(u.id, 'can_manage_leads', u.can_manage_leads)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          disabled={isPrimaryAdmin}
                          checked={u.can_upload_jd}
                          onChange={() => handleTogglePermission(u.id, 'can_upload_jd', u.can_upload_jd)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          disabled={isPrimaryAdmin}
                          checked={u.can_complete_drives}
                          onChange={() => handleTogglePermission(u.id, 'can_complete_drives', u.can_complete_drives)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          disabled={isPrimaryAdmin}
                          checked={u.can_manage_students}
                          onChange={() => handleTogglePermission(u.id, 'can_manage_students', u.can_manage_students)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          disabled={isPrimaryAdmin}
                          checked={u.can_view_reports}
                          onChange={() => handleTogglePermission(u.id, 'can_view_reports', u.can_view_reports)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
                        />
                      </td>

                      <td className="p-3 text-right">
                        {!isPrimaryAdmin && (
                          <button
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                            title="Delete User Account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Create Staff / User (Admin) */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                <span>Create Placement Staff Account</span>
              </h3>
              <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newUserForm.name}
                    onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                    className="w-full p-2 border rounded-lg border-slate-300"
                    placeholder="Prof. / Dr. Name"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Institutional Email *</label>
                  <input
                    type="email"
                    required
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    className="w-full p-2 border rounded-lg border-slate-300"
                    placeholder="name@college.edu"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Initial Password *</label>
                  <input
                    type="text"
                    required
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                    className="w-full p-2 border rounded-lg border-slate-300 font-mono"
                    placeholder="password123"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Account Role *</label>
                  <select
                    value={newUserForm.role}
                    onChange={(e) => {
                      const role = e.target.value;
                      setNewUserForm({
                        ...newUserForm,
                        role: role,
                        designation: role === 'manager' ? 'Placement Manager' : 'Placement Officer',
                        can_manage_leads: role === 'team_member' || role === 'admin',
                        can_manage_students: role === 'manager' || role === 'admin',
                      });
                    }}
                    className="w-full p-2 border rounded-lg border-slate-300 bg-white"
                  >
                    <option value="team_member">Placement Team Member</option>
                    <option value="manager">Placement Manager</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={newUserForm.phone}
                    onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                    className="w-full p-2 border rounded-lg border-slate-300"
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={newUserForm.designation}
                    onChange={(e) => setNewUserForm({ ...newUserForm, designation: e.target.value })}
                    className="w-full p-2 border rounded-lg border-slate-300"
                    placeholder="Designation"
                  />
                </div>
              </div>

              {/* Granular Permission Controls */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <p className="font-bold text-slate-800">Granted Operational Permissions</p>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newUserForm.can_manage_leads}
                      onChange={(e) => setNewUserForm({ ...newUserForm, can_manage_leads: e.target.checked })}
                      className="rounded text-indigo-600"
                    />
                    <span>Manage Company Leads</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newUserForm.can_upload_jd}
                      onChange={(e) => setNewUserForm({ ...newUserForm, can_upload_jd: e.target.checked })}
                      className="rounded text-indigo-600"
                    />
                    <span>Upload & Extract JDs</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newUserForm.can_complete_drives}
                      onChange={(e) => setNewUserForm({ ...newUserForm, can_complete_drives: e.target.checked })}
                      className="rounded text-indigo-600"
                    />
                    <span>Complete Placement Drives</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newUserForm.can_manage_students}
                      onChange={(e) => setNewUserForm({ ...newUserForm, can_manage_students: e.target.checked })}
                      className="rounded text-indigo-600"
                    />
                    <span>Manage Student Master</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newUserForm.can_view_reports}
                      onChange={(e) => setNewUserForm({ ...newUserForm, can_view_reports: e.target.checked })}
                      className="rounded text-indigo-600"
                    />
                    <span>View & Export Reports</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-3.5 py-1.5 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  Provision User Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add / Edit Lead */}
      {isLeadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base">
                {editingLead ? `Edit Lead: ${editingLead.company_name}` : 'Create New Company Lead'}
              </h3>
              <button onClick={() => setIsLeadModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLead} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={leadForm.company_name}
                    onChange={(e) => setLeadForm({ ...leadForm, company_name: e.target.value })}
                    className="w-full p-2 border rounded-lg border-slate-300"
                    placeholder="e.g. Google, Microsoft"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Location *</label>
                  <input
                    type="text"
                    required
                    value={leadForm.location}
                    onChange={(e) => setLeadForm({ ...leadForm, location: e.target.value })}
                    className="w-full p-2 border rounded-lg border-slate-300"
                    placeholder="e.g. Bengaluru, Hyderabad"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Point of Contact Name *</label>
                  <input
                    type="text"
                    required
                    value={leadForm.poc_name}
                    onChange={(e) => setLeadForm({ ...leadForm, poc_name: e.target.value })}
                    className="w-full p-2 border rounded-lg border-slate-300"
                    placeholder="HR / Campus Recruiter"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">POC Email ID *</label>
                  <input
                    type="email"
                    required
                    value={leadForm.poc_email}
                    onChange={(e) => setLeadForm({ ...leadForm, poc_email: e.target.value })}
                    className="w-full p-2 border rounded-lg border-slate-300"
                    placeholder="recruiter@company.com"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">POC Phone *</label>
                  <input
                    type="text"
                    required
                    value={leadForm.poc_phone}
                    onChange={(e) => setLeadForm({ ...leadForm, poc_phone: e.target.value })}
                    className="w-full p-2 border rounded-lg border-slate-300"
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Team Member *</label>
                  <select
                    value={leadForm.team_member_id}
                    onChange={(e) => setLeadForm({ ...leadForm, team_member_id: e.target.value })}
                    className="w-full p-2 border rounded-lg border-slate-300 bg-white"
                  >
                    {teamMembers.map(tm => (
                      <option key={tm.id} value={tm.id}>{tm.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Company Tier *</label>
                  <select
                    value={leadForm.tier}
                    onChange={(e) => setLeadForm({ ...leadForm, tier: e.target.value })}
                    className="w-full p-2 border rounded-lg border-slate-300 bg-white"
                  >
                    {TIERS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Offered CTC (LPA) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={leadForm.ctc}
                    onChange={(e) => setLeadForm({ ...leadForm, ctc: e.target.value })}
                    className="w-full p-2 border rounded-lg border-slate-300"
                    placeholder="e.g. 18.5"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Role Designation *</label>
                  <input
                    type="text"
                    required
                    value={leadForm.role}
                    onChange={(e) => setLeadForm({ ...leadForm, role: e.target.value })}
                    className="w-full p-2 border rounded-lg border-slate-300"
                    placeholder="e.g. Software Engineer"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lead Stage *</label>
                  <select
                    value={leadForm.status}
                    onChange={(e) => setLeadForm({ ...leadForm, status: e.target.value })}
                    className="w-full p-2 border rounded-lg border-slate-300 bg-white"
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tentative Drive Date</label>
                <input
                  type="date"
                  value={leadForm.drive_date}
                  onChange={(e) => setLeadForm({ ...leadForm, drive_date: e.target.value })}
                  className="w-full p-2 border rounded-lg border-slate-300"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsLeadModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: JD Pre-Upload Inspection */}
      {isJDUploadOpen && activeLeadForJD && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-base">
                  Upload & Extract JD: {activeLeadForJD.company_name}
                </h3>
              </div>
              <button onClick={() => { setIsJDUploadOpen(false); setJdPreview(null); }} className="text-slate-400 hover:text-slate-700">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              {!jdPreview ? (
                <div>
                  <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-indigo-50/30 transition-all text-center">
                    <Upload className="w-10 h-10 text-indigo-500 mb-2 animate-bounce" />
                    <span className="text-sm font-semibold text-slate-700">Upload Job Description Document</span>
                    <span className="text-xs text-slate-400 mt-1">Supports PDF or DOCX format (PyMuPDF & python-docx extractor)</span>
                    <input 
                      type="file" 
                      accept=".pdf, .docx, .txt" 
                      className="hidden" 
                      onChange={handleJDFileChange} 
                    />
                  </label>

                  {loadingJDPreview && (
                    <div className="py-8 flex flex-col items-center justify-center space-y-2">
                      <Loader2 className="w-7 h-7 text-indigo-600 animate-spin" />
                      <p className="text-xs font-semibold text-slate-600">Extracting text & parsing NLP skill requirements...</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center justify-between">
                    <div>
                      <p className="font-bold">✓ Extracted Successfully: {jdPreview.extracted_role}</p>
                      <p className="text-[11px] text-emerald-600">Document: {jdPreview.file_name}</p>
                    </div>
                    <button 
                      onClick={() => setJdPreview(null)}
                      className="text-xs text-indigo-600 underline font-semibold"
                    >
                      Change Document
                    </button>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Identified Required Skills</label>
                    <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50 border rounded-xl">
                      {jdPreview.required_skills.map((s, i) => (
                        <span key={i} className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-md font-semibold text-[11px]">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Eligibility & Qualifications</label>
                    <p className="p-2.5 bg-slate-50 border rounded-xl text-slate-700">{jdPreview.qualifications}</p>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Raw Extracted Text Preview</label>
                    <textarea 
                      rows={4} 
                      value={jdPreview.raw_text} 
                      onChange={(e) => setJdPreview({ ...jdPreview, raw_text: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border rounded-xl font-mono text-[11px] text-slate-700" 
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t bg-slate-50 flex justify-between items-center text-xs">
              <button 
                onClick={() => { setIsJDUploadOpen(false); setJdPreview(null); }}
                className="px-4 py-1.5 font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                Cancel
              </button>
              {jdPreview && (
                <button
                  onClick={handleConfirmJDUpload}
                  className="px-5 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  Save JD & Enable Resume Matching
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Follow Up Logger */}
      {isFollowUpOpen && activeLeadForFollowUp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 text-xs">
            <h3 className="font-bold text-slate-800 text-base">
              Log Follow-up: {activeLeadForFollowUp.company_name}
            </h3>

            <form onSubmit={handleSaveFollowUp} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Follow-up Date *</label>
                <input
                  type="date"
                  required
                  value={followUpForm.follow_up_date}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, follow_up_date: e.target.value })}
                  className="w-full p-2 border rounded-lg border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Meeting Notes & Discussion *</label>
                <textarea
                  rows={3}
                  required
                  value={followUpForm.notes}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, notes: e.target.value })}
                  className="w-full p-2 border rounded-lg border-slate-300"
                  placeholder="Discussed test dates, CTC brackets, eligibility criteria..."
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Next Action Step</label>
                <input
                  type="text"
                  value={followUpForm.next_step}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, next_step: e.target.value })}
                  className="w-full p-2 border rounded-lg border-slate-300"
                  placeholder="Send student shortlist, confirm test slot..."
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsFollowUpOpen(false)}
                  className="px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  Record Follow-Up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Complete Placement Drive */}
      {isDriveModalOpen && activeLeadForDrive && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-emerald-900 text-white">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">Complete Drive: {activeLeadForDrive.company_name}</h3>
              </div>
              <button onClick={() => setIsDriveModalOpen(false)} className="text-emerald-300 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCompleteDrive} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Final Role Offered *</label>
                  <input
                    type="text"
                    required
                    value={driveForm.role}
                    onChange={(e) => setDriveForm({ ...driveForm, role: e.target.value })}
                    className="w-full p-2 border rounded-lg border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Final Package (CTC in LPA) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={driveForm.ctc}
                    onChange={(e) => setDriveForm({ ...driveForm, ctc: e.target.value })}
                    className="w-full p-2 border rounded-lg border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Completion Date *</label>
                  <input
                    type="date"
                    required
                    value={driveForm.drive_date}
                    onChange={(e) => setDriveForm({ ...driveForm, drive_date: e.target.value })}
                    className="w-full p-2 border rounded-lg border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Total Number of Offers Released *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 5"
                  value={driveForm.number_of_offers}
                  onChange={(e) => setDriveForm({ ...driveForm, number_of_offers: e.target.value })}
                  className="w-full p-2 border rounded-lg border-slate-300"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-bold text-slate-800">
                    Select Placed Candidates ({driveForm.selected_student_ids.length} selected) *
                  </label>
                  <span className="text-[11px] text-emerald-700 font-semibold">
                    Automatically updates student status to Placed & syncs Reports
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl max-h-56 overflow-y-auto divide-y divide-slate-100">
                  {students.map((st) => {
                    const isChecked = driveForm.selected_student_ids.includes(st.id);
                    return (
                      <div
                        key={st.id}
                        onClick={() => toggleStudentSelection(st.id)}
                        className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                          isChecked ? 'bg-emerald-50/80 font-bold' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="rounded text-emerald-600 focus:ring-emerald-500"
                          />
                          <div>
                            <p className="text-slate-800 font-semibold">{st.name}</p>
                            <p className="text-[11px] text-slate-500 font-mono">{st.reg_no} • {st.dept} (UG: {st.ug_pct}%)</p>
                          </div>
                        </div>
                        {isChecked && (
                          <span className="text-emerald-700 font-extrabold text-[11px] px-2 py-0.5 bg-emerald-100 rounded-full">
                            Placed
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsDriveModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
                >
                  Confirm & Sync Central Records
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
