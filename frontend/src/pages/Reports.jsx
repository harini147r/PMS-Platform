import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Filter, 
  Search, 
  Building2, 
  GraduationCap, 
  Award,
  CheckCircle,
  Clock,
  Layers,
  ChevronDown
} from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const ALL_REPORTS = [
  { id: '1', title: 'Company-wise Registered Students', sub: 'Registered cohort breakdown per corporate partner', roles: ['admin', 'team_member'] },
  { id: '2', title: 'Completed Drives & Placed Students', sub: 'Final offer release logs, selected candidates, and CTC', roles: ['admin', 'manager', 'team_member'] },
  { id: '3', title: 'Student Placement Status', sub: 'Comprehensive student registry with drive history', roles: ['admin', 'manager'] },
  { id: '4', title: 'Company Status Pipeline', sub: 'Corporate outreach funnel from Cold to Completed', roles: ['admin', 'team_member'] },
];

const DEPARTMENTS = ['All', 'Computer Science', 'Cyber Security', 'Business Administration', 'Information Technology', 'Electronics and Communication'];

export default function Reports() {
  const { user } = useAuth();
  const role = user?.role || 'admin';
  const permittedTabs = ALL_REPORTS.filter(t => t.roles.includes(role));
  const [activeReport, setActiveReport] = useState(() => permittedTabs[0]?.id || '1');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedStudents, setExpandedStudents] = useState({});

  // Filters
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Keep activeReport valid when role changes
  useEffect(() => {
    if (!permittedTabs.some(t => t.id === activeReport)) {
      setActiveReport(permittedTabs[0]?.id || '1');
    }
  }, [role]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      let endpoint = '';
      if (activeReport === '1') endpoint = '/reports/company-registered';
      else if (activeReport === '2') endpoint = '/reports/completed-drives';
      else if (activeReport === '3') endpoint = '/reports/student-status';
      else if (activeReport === '4') endpoint = '/reports/company-status';

      const res = await api.get(endpoint, {
        params: {
          dept: deptFilter !== 'All' ? deptFilter : undefined,
          placement_status: statusFilter !== 'All' ? statusFilter : undefined,
          search: search || undefined
        }
      });
      setReportData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [activeReport, deptFilter, statusFilter, search, user]);

  const exportCSV = () => {
    if (!reportData || reportData.length === 0) return;
    
    let csvContent = 'data:text/csv;charset=utf-8,';
    if (activeReport === '1') {
      csvContent += 'Company,Drive Date,Tier,Role,Registered Count\n';
      reportData.forEach(r => {
        csvContent += `"${r.company_name}","${r.drive_date}","${r.tier}","${r.role}",${r.registered_count}\n`;
      });
    } else if (activeReport === '2') {
      csvContent += 'Company,Drive Date,Role,CTC (LPA),Offers Count,Placed Candidates\n';
      reportData.forEach(r => {
        const names = r.selected_students.map(s => s.student_name).join('; ');
        csvContent += `"${r.company_name}","${r.drive_date}","${r.role}",${r.ctc},${r.number_of_offers},"${names}"\n`;
      });
    } else if (activeReport === '3') {
      csvContent += 'Registration Number,Student Name,Department,Course,Placement Status,Current Company,CTC (LPA)\n';
      reportData.forEach(r => {
        csvContent += `"${r.reg_no}","${r.student_name}","${r.dept}","${r.course}","${r.placement_status}","${r.current_company}",${r.ctc}\n`;
      });
    } else if (activeReport === '4') {
      csvContent += 'Company,Location,Company Tier,Officer,Lead Status,Approval Status,Role,CTC (LPA),Offers\n';
      reportData.forEach(r => {
        csvContent += `"${r.company_name}","${r.location}","${r.company_tier || r.tier}","${r.team_member}","${r.lead_status || r.status}","${r.approval_status}","${r.role}",${r.ctc},${r.number_of_offers}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `placement_report_${activeReport}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const formatValue = (value) => {
    if (value === null || value === undefined || value === '' || Number.isNaN(value)) return 'Not provided';
    return value;
  };

  const formatTier = (tier) => {
    if (!tier) return 'Not provided';
    if (['Tier 1', 'Tier 2', 'Tier 3'].includes(tier)) return tier;
    if (tier === 'Super Dream' || tier === 'Dream') return 'Tier 1';
    return tier;
  };

  const toggleStudentDetails = (reportIndex, studentId) => {
    const key = `${reportIndex}-${studentId}`;
    setExpandedStudents(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Report Selection Tabs (Filtered by Role) */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${permittedTabs.length > 2 ? 'lg:grid-cols-4' : 'lg:grid-cols-2'} gap-3`}>
        {permittedTabs.map((tab) => {
          const isActive = activeReport === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveReport(tab.id)}
              className={`p-4 rounded-xl border text-left transition-all ${
                isActive 
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20' 
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <h4 className={`font-bold text-xs ${isActive ? 'text-white' : 'text-slate-800'}`}>
                {tab.title}
              </h4>
              <p className={`text-[11px] mt-1 line-clamp-2 ${isActive ? 'text-indigo-100' : 'text-slate-500'}`}>
                {tab.sub}
              </p>
            </button>
          );
        })}
      </div>

      {/* Filter & Export Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500">Filter Dept:</span>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white text-slate-700"
            >
              {DEPARTMENTS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {(activeReport === '3') && (
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-500">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white text-slate-700"
              >
                {['All', 'Placed', 'Unplaced'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}

          <div className="relative min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search in report..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
          <button
            onClick={exportCSV}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Report Tables */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 font-medium text-xs">
            Loading authorized report data...
          </div>
        ) : reportData.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No records found for the selected criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Report 1 */}
            {activeReport === '1' && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b text-slate-600 font-bold uppercase">
                  <tr>
                    <th className="p-3.5">Company Name</th>
                    <th className="p-3.5">Drive Date</th>
                    <th className="p-3.5">Company Tier & Role</th>
                    <th className="p-3.5">Registered Cohort Count</th>
                    <th className="p-3.5">Sample Registered Students</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/80">
                      <td className="p-3.5 font-bold text-slate-900">{r.company_name}</td>
                      <td className="p-3.5 font-medium text-slate-600">{r.drive_date}</td>
                      <td className="p-3.5">
                        <span className="font-bold text-indigo-600">Company Tier: {formatTier(r.tier)}</span> • {r.role}
                      </td>
                      <td className="p-3.5 font-bold text-slate-800">{r.registered_count} Students</td>
                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1 max-w-md">
                          {r.students.slice(0, 3).map((st, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px]">
                              {st.student_name} ({st.dept})
                            </span>
                          ))}
                          {r.students.length > 3 && (
                            <span className="text-[10px] text-slate-400 font-semibold self-center">
                              +{r.students.length - 3} more
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Report 2 */}
            {activeReport === '2' && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b text-slate-600 font-bold uppercase">
                  <tr>
                    <th className="p-3.5">Company</th>
                    <th className="p-3.5">Drive Date</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">CTC</th>
                    <th className="p-3.5">Offers Released</th>
                    <th className="p-3.5">Selected Students List</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/80">
                      <td className="p-3.5 font-bold text-slate-900">{r.company_name}</td>
                      <td className="p-3.5 text-slate-600">{r.drive_date}</td>
                      <td className="p-3.5 font-semibold text-slate-800">{r.role}</td>
                      <td className="p-3.5 font-black text-indigo-600">{r.ctc} LPA</td>
                      <td className="p-3.5 font-bold text-emerald-700">{r.number_of_offers} Offers</td>
                      <td className="p-3.5">
                        <div className="space-y-1">
                          {r.selected_students.map((st, idx) => {
                            const key = `${i}-${st.student_id || st.reg_no}`;
                            const isExpanded = !!expandedStudents[key];
                            return (
                              <div key={key} className="mb-2">
                                <button
                                  type="button"
                                  onClick={() => toggleStudentDetails(i, st.student_id || st.reg_no)}
                                  className="inline-flex items-center mr-2 px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded font-semibold text-[11px]"
                                >
                                  {st.student_name} ({st.dept} - {st.reg_no})
                                </button>
                                {isExpanded && (
                                  <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-700 max-w-2xl">
                                    <p><strong>Name:</strong> {formatValue(st.student_name)}</p>
                                    <p><strong>Registration Number:</strong> {formatValue(st.reg_no)}</p>
                                    <p><strong>Department:</strong> {formatValue(st.dept)}</p>
                                    <p><strong>Course:</strong> {formatValue(st.course)}</p>
                                    <p><strong>Gender:</strong> {formatValue(st.gender)}</p>
                                    <p><strong>Hosteller:</strong> {st.is_hosteller ? 'Yes' : 'No'}</p>
                                    <p><strong>SSLC %:</strong> {formatValue(st.sslc_pct)}</p>
                                    <p><strong>HSC %:</strong> {formatValue(st.hsc_pct)}</p>
                                    <p><strong>UG %:</strong> {formatValue(st.ug_pct)}</p>
                                    <p><strong>PG %:</strong> {formatValue(st.pg_pct)}</p>
                                    <p><strong>Email:</strong> {formatValue(st.email)}</p>
                                    <p><strong>Phone:</strong> {formatValue(st.phone)}</p>
                                    <p><strong>GitHub:</strong> {st.github_url ? <a className="text-indigo-600 font-semibold" href={st.github_url} target="_blank" rel="noreferrer">Open</a> : 'Not provided'}</p>
                                    <p><strong>LinkedIn:</strong> {st.linkedin_url ? <a className="text-indigo-600 font-semibold" href={st.linkedin_url} target="_blank" rel="noreferrer">Open</a> : 'Not provided'}</p>
                                    <p><strong>Portfolio:</strong> {st.portfolio_url ? <a className="text-indigo-600 font-semibold" href={st.portfolio_url} target="_blank" rel="noreferrer">Open</a> : 'Not provided'}</p>
                                    <p><strong>Resume:</strong> {st.resume_url ? <a className="text-indigo-600 font-semibold" href={st.resume_url} target="_blank" rel="noreferrer">Open</a> : 'Not provided'}</p>
                                    <p><strong>Placement Status:</strong> {formatValue(st.placement_status)}</p>
                                    <p><strong>Company Placed:</strong> {formatValue(st.company_placed || r.company_name)}</p>
                                    <p><strong>Role:</strong> {formatValue(st.role || r.role)}</p>
                                    <p><strong>CTC:</strong> {formatValue(st.ctc || r.ctc)} LPA</p>
                                    <p><strong>Drive Date:</strong> {formatValue(st.drive_date || r.drive_date)}</p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Report 3 */}
            {activeReport === '3' && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b text-slate-600 font-bold uppercase">
                  <tr>
                    <th className="p-3.5">Student</th>
                    <th className="p-3.5">Reg No</th>
                    <th className="p-3.5">Department</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Registered / Attended</th>
                    <th className="p-3.5">Current Company & Package</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/80">
                      <td className="p-3.5 font-bold text-slate-800">{r.student_name}</td>
                      <td className="p-3.5 font-mono text-slate-600">{r.reg_no}</td>
                      <td className="p-3.5 text-slate-700">{r.dept} ({r.course})</td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          r.placement_status === 'Placed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {r.placement_status}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {r.companies_registered} Drives Reg. • {r.companies_attended} Attended
                      </td>
                      <td className="p-3.5">
                        {r.current_company !== '-' ? (
                          <div>
                            <span className="font-bold text-slate-900">{r.current_company}</span>
                            <span className="text-emerald-700 font-extrabold ml-2">({r.ctc} LPA)</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">In Process</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Report 4 */}
            {activeReport === '4' && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b text-slate-600 font-bold uppercase">
                  <tr>
                    <th className="p-3.5">Company</th>
                    <th className="p-3.5">Company Tier & Location</th>
                    <th className="p-3.5">Assigned Officer</th>
                    <th className="p-3.5">Funnel Status</th>
                    <th className="p-3.5">Approval</th>
                    <th className="p-3.5">Role & CTC</th>
                    <th className="p-3.5">Offers</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/80">
                      <td className="p-3.5 font-bold text-slate-900">{r.company_name}</td>
                      <td className="p-3.5 text-slate-600">
                        <span className="font-bold text-indigo-700">Company Tier: {formatTier(r.company_tier || r.tier)}</span>
                        <span className="mx-1">•</span>
                        {r.location}
                      </td>
                      <td className="p-3.5 font-medium text-slate-700">{r.team_member}</td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800">
                          {r.lead_status || r.status}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800">
                          {r.approval_status}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-slate-800">{r.role}</span>
                        <span className="text-indigo-600 font-extrabold ml-1">({r.ctc} LPA)</span>
                      </td>
                      <td className="p-3.5 font-bold text-emerald-700">{r.number_of_offers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
