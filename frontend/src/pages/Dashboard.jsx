import React, { useEffect, useState } from 'react';
import { 
  Users, 
  GraduationCap, 
  Building2, 
  Award, 
  TrendingUp, 
  Briefcase,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

export default function Dashboard({ setActiveTab }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard');
      setData(res.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Loading authorized placement metrics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center space-x-3">
        <AlertCircle className="w-6 h-6 shrink-0" />
        <div>
          <p className="font-semibold">Unable to fetch dashboard</p>
          <p className="text-sm text-rose-600">{error || 'Server error'}</p>
        </div>
      </div>
    );
  }

  const { kpis, department_analytics, company_pipeline, recent_activities, team_performance = [] } = data;
  const isManager = user?.role === 'manager';
  const isTeamMember = user?.role === 'team_member';

  const kpiList = [
    { label: 'Total Students', value: kpis.total_students, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', sub: 'Eligible 2026 Cohort' },
    { label: 'Placed Students', value: kpis.placed_students, icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-emerald-50', sub: `${kpis.placement_percentage}% Placed` },
    { label: 'Unplaced Students', value: kpis.unplaced_students, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', sub: 'In Active Pipeline' },
    ...(!isManager ? [
      { label: isTeamMember ? 'Assigned Companies' : 'Total Companies', value: kpis.total_companies, icon: Building2, color: 'text-indigo-600', bg: 'bg-indigo-50', sub: isTeamMember ? 'Your Accounts' : 'Approved Partners' },
      { label: isTeamMember ? 'Your Completed Drives' : 'Completed Drives', value: kpis.completed_drives, icon: CheckCircle2, color: 'text-purple-600', bg: 'bg-purple-50', sub: 'Finalized & Verified' },
      { label: isTeamMember ? 'Your Offers Released' : 'Total Offers Released', value: kpis.total_offers, icon: Award, color: 'text-rose-600', bg: 'bg-rose-50', sub: `Avg CTC: ${kpis.average_ctc} LPA` },
    ] : [])
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* KPI Cards Grid */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${isManager ? 'xl:grid-cols-3' : 'xl:grid-cols-6'} gap-4`}>
        {kpiList.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div 
              key={idx} 
              className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{kpi.label}</span>
                <div className={`p-2 rounded-lg ${kpi.bg} ${kpi.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl font-bold text-slate-800">{kpi.value}</h3>
                <p className="text-[11px] font-medium text-slate-500 mt-0.5">{kpi.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Placement Comparison (Bar Chart) */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">Department Placement Breakdown</h3>
              <p className="text-xs text-slate-500">Placed vs Unplaced distribution across engineering and management departments</p>
            </div>
            <button 
              onClick={() => setActiveTab('students')}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center space-x-1"
            >
              <span>View Students</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={department_analytics} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="dept" tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }} 
                  itemStyle={{ color: '#fff' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                <Bar dataKey="placed_students" name="Placed Students" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="unplaced_students" name="Unplaced Students" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Placement Percentage (Donut) */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800">Placement % by Dept</h3>
            <p className="text-xs text-slate-500">Success conversion rate by discipline</p>
          </div>
          <div className="h-56 w-full flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={department_analytics}
                  dataKey="placement_percentage"
                  nameKey="dept"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {department_analytics.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val, name) => [`${val}%`, `${name} Placement Rate`]}
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
            {department_analytics.slice(0, 3).map((d, i) => (
              <div key={d.dept} className="p-1.5 bg-slate-50 rounded-lg">
                <p className="text-[11px] font-semibold text-slate-600">{d.dept}</p>
                <p className="text-xs font-bold text-indigo-600">{d.placement_percentage}%</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Company Pipeline + Recent Activity */}
      {(isManager || user?.role === 'admin') && team_performance.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200">
            <h3 className="text-base font-bold text-slate-800">Placement Team Performance</h3>
            <p className="text-xs text-slate-500">Read-only contribution overview across all placement team members</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                <tr>
                  <th className="py-3 px-4">Team Member</th>
                  <th className="py-3 px-4 text-center">Assigned Companies</th>
                  <th className="py-3 px-4 text-center">Cold</th>
                  <th className="py-3 px-4 text-center">Warm</th>
                  <th className="py-3 px-4 text-center">Hot</th>
                  <th className="py-3 px-4 text-center">Completed Drives</th>
                  <th className="py-3 px-4 text-center">Follow-ups</th>
                  <th className="py-3 px-4 text-center">Total Offers</th>
                  <th className="py-3 px-4 text-center">Contribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {team_performance.map((member) => (
                  <tr key={member.team_member_id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-bold text-slate-800">{member.team_member_name}</td>
                    <td className="py-3 px-4 text-center font-semibold">{member.assigned_companies}</td>
                    <td className="py-3 px-4 text-center">{member.cold_leads}</td>
                    <td className="py-3 px-4 text-center text-amber-700 font-semibold">{member.warm_leads}</td>
                    <td className="py-3 px-4 text-center text-rose-700 font-semibold">{member.hot_leads}</td>
                    <td className="py-3 px-4 text-center text-emerald-700 font-semibold">{member.completed_drives}</td>
                    <td className="py-3 px-4 text-center">{member.follow_ups}</td>
                    <td className="py-3 px-4 text-center font-bold text-indigo-700">{member.total_offers}</td>
                    <td className="py-3 px-4 text-center font-extrabold text-slate-800">{member.overall_contribution}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bottom Grid: Company Pipeline + Recent Activity */}
      <div className={`grid grid-cols-1 ${isManager ? 'lg:grid-cols-1' : 'lg:grid-cols-3'} gap-6`}>
        {/* Company Pipeline (Only for Admin & Team Member) */}
        {!isManager && (
          <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  {isTeamMember ? 'Your Assigned Leads Pipeline' : 'Company Engagement Pipeline'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isTeamMember ? 'Live status of corporate leads assigned to you' : 'Real-time status of corporate outreach & campus hiring'}
                </p>
              </div>
              <button 
                onClick={() => setActiveTab('team')}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center space-x-1"
              >
                <span>Manage Leads</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {company_pipeline.map((stage) => {
                const getBadgeStyle = (stg) => {
                  switch (stg) {
                    case 'Cold': return { border: 'border-slate-300', bg: 'bg-slate-50', tag: 'bg-slate-200 text-slate-700' };
                    case 'Warm': return { border: 'border-amber-300', bg: 'bg-amber-50/50', tag: 'bg-amber-100 text-amber-800' };
                    case 'Hot': return { border: 'border-rose-300', bg: 'bg-rose-50/50', tag: 'bg-rose-100 text-rose-800' };
                    case 'Placement Completed': return { border: 'border-emerald-300', bg: 'bg-emerald-50/50', tag: 'bg-emerald-100 text-emerald-800' };
                    default: return { border: 'border-slate-300', bg: 'bg-slate-50', tag: 'bg-slate-200 text-slate-700' };
                  }
                };
                const style = getBadgeStyle(stage.stage);
                return (
                  <div key={stage.stage} className={`p-4 rounded-xl border ${style.border} ${style.bg} flex flex-col justify-between`}>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-0.5 text-[11px] font-bold rounded-md ${style.tag}`}>
                          {stage.stage}
                        </span>
                        <span className="text-lg font-extrabold text-slate-800">{stage.count}</span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">Active Accounts</p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-200/60 space-y-1">
                      {stage.companies.slice(0, 3).map((comp, idx) => (
                        <p key={idx} className="text-xs text-slate-700 truncate font-medium flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          <span>{comp}</span>
                        </p>
                      ))}
                      {stage.companies.length > 3 && (
                        <p className="text-[10px] text-slate-400 italic">+{stage.companies.length - 3} more</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Activity Stream */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <h3 className="text-base font-bold text-slate-800 mb-1">Recent Activity</h3>
          <p className="text-xs text-slate-500 mb-4">Official Placement Cell audit log</p>
          <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
            {recent_activities.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No recent activities recorded.</p>
            ) : (
              recent_activities.map((act) => {
                const getIcon = (type) => {
                  switch (type) {
                    case 'PLACEMENT_COMPLETED': return <Award className="w-4 h-4 text-emerald-600" />;
                    case 'COMPANY_APPROVED': return <CheckCircle2 className="w-4 h-4 text-purple-600" />;
                    case 'JD_UPLOADED': return <Briefcase className="w-4 h-4 text-indigo-600" />;
                    default: return <TrendingUp className="w-4 h-4 text-blue-600" />;
                  }
                };
                return (
                  <div key={act.id} className="flex items-start space-x-3 text-left">
                    <div className="p-1.5 rounded-lg bg-slate-100 shrink-0 mt-0.5">
                      {getIcon(act.activity_type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 leading-tight">{act.title}</p>
                      <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">{act.description}</p>
                      <span className="text-[10px] text-slate-400">
                        {new Date(act.created_at).toLocaleDateString()} at {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
