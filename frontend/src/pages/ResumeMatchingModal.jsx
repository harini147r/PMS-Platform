import React, { useEffect, useState } from 'react';
import { 
  Sparkles, 
  CheckCircle, 
  XCircle, 
  Filter, 
  Search, 
  User, 
  GraduationCap, 
  Briefcase, 
  X, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Award,
  Loader2
} from 'lucide-react';
import api from '../api';

const GRADE_COLORS = {
  O: { bg: 'bg-purple-100 text-purple-800 border-purple-300', tag: 'Outstanding (91-100)' },
  S: { bg: 'bg-emerald-100 text-emerald-800 border-emerald-300', tag: 'Superior (81-90)' },
  A: { bg: 'bg-blue-100 text-blue-800 border-blue-300', tag: 'Excellent (71-80)' },
  B: { bg: 'bg-amber-100 text-amber-800 border-amber-300', tag: 'Good (61-70)' },
  D: { bg: 'bg-slate-100 text-slate-700 border-slate-300', tag: 'Developing (0-60)' },
};

export default function ResumeMatchingModal({ isOpen, onClose, companyId, companyName }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [search, setSearch] = useState('');

  const fetchMatchingData = async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      const res = await api.get(`/matching/company/${companyId}`, {
        params: {
          dept: deptFilter !== 'All' ? deptFilter : undefined,
          category: categoryFilter !== 'All' ? categoryFilter : undefined,
        }
      });
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMatchingData();
    }
  }, [isOpen, companyId, deptFilter, categoryFilter]);

  if (!isOpen) return null;

  const filteredCandidates = data?.ranked_students.filter(c => {
    if (!search) return true;
    return c.student_name.toLowerCase().includes(search.toLowerCase()) || 
           c.reg_no.toLowerCase().includes(search.toLowerCase());
  }) || [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-white">Resume–JD Match Intelligence</h3>
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/30 text-indigo-300 text-xs font-mono font-bold">
                  {companyName}
                </span>
              </div>
              <p className="text-xs text-slate-400">NLP TF-IDF & Skill Ontology Matching against active student cohort</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              <p className="text-xs font-semibold text-slate-600">Comparing student resumes against JD requirements...</p>
            </div>
          ) : !data ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No matching data available for this company JD.
            </div>
          ) : (
            <>
              {/* Category Counts & KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Evaluated</span>
                  <p className="text-xl font-black text-slate-800 mt-0.5">{data.total_evaluated}</p>
                </div>
                {['O', 'S', 'A', 'B', 'D'].map((cat) => {
                  const style = GRADE_COLORS[cat];
                  const count = data.category_counts[cat] || 0;
                  const isSelected = categoryFilter === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(isSelected ? 'All' : cat)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected 
                          ? `${style.bg} ring-2 ring-indigo-500 shadow-xs` 
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase">Grade {cat}</span>
                        <span className="text-xs px-1.5 py-0.2 rounded-full font-extrabold bg-white/80">{count}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 truncate">{style.tag.split('(')[1].replace(')', '')}</p>
                    </button>
                  );
                })}
              </div>

              {/* JD Required Skills Chips */}
              <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-1.5">
                <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Required Skills for Role: {data.role}</span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {data.required_skills.map((skill, idx) => (
                    <span key={idx} className="px-2.5 py-0.5 bg-white border border-indigo-200 text-indigo-800 rounded-md text-[11px] font-semibold">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center space-x-2 flex-1 min-w-[220px] max-w-sm">
                  <div className="relative w-full">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search candidates by name or reg no..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500 font-medium">Department:</span>
                  <select
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                    className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white text-slate-700"
                  >
                    {['All', 'CSE', 'IT', 'ECE', 'EEE', 'MECH', 'MBA'].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Ranked Candidates Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                    <tr>
                      <th className="p-3">Rank</th>
                      <th className="p-3">Candidate</th>
                      <th className="p-3">Dept & Course</th>
                      <th className="p-3">ATS Score</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Matched Skills</th>
                      <th className="p-3 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCandidates.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400">
                          No candidates found matching criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredCandidates.map((c, idx) => {
                        const style = GRADE_COLORS[c.category] || GRADE_COLORS['D'];
                        return (
                          <tr key={c.student_id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3 font-bold text-slate-500">#{idx + 1}</td>
                            <td className="p-3">
                              <p className="font-bold text-slate-800">{c.student_name}</p>
                              <p className="text-[11px] text-slate-500 font-mono">{c.reg_no}</p>
                            </td>
                            <td className="p-3 text-slate-600 font-medium">{c.dept} ({c.course})</td>
                            <td className="p-3">
                              <div className="flex items-center space-x-2">
                                <span className="font-extrabold text-slate-900 text-sm">{c.ats_score}</span>
                                <div className="w-12 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                  <div 
                                    className="bg-indigo-600 h-full rounded-full" 
                                    style={{ width: `${Math.min(100, c.ats_score)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${style.bg}`}>
                                Grade {c.category}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {c.matched_skills.slice(0, 3).map((s, i) => (
                                  <span key={i} className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-medium">
                                    {s}
                                  </span>
                                ))}
                                {c.matched_skills.length > 3 && (
                                  <span className="text-[10px] text-slate-400 font-semibold self-center">
                                    +{c.matched_skills.length - 3}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => setSelectedCandidate(c)}
                                className="px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg border border-indigo-200 transition-all inline-flex items-center space-x-1"
                              >
                                <span>Inspect</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 flex items-center justify-between bg-slate-50 text-xs">
          <span className="text-slate-500">Intelligent Placement Cell ATS Engine</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-bold text-slate-700 hover:bg-slate-200 rounded-lg"
          >
            Close Dashboard
          </button>
        </div>
      </div>

      {/* Candidate Match Detail Sub-Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in zoom-in-95">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <h4 className="text-base font-bold text-slate-800">{selectedCandidate.student_name}</h4>
                <p className="text-xs text-slate-500 font-mono">{selectedCandidate.reg_no} • {selectedCandidate.dept} ({selectedCandidate.course})</p>
              </div>
              <button 
                onClick={() => setSelectedCandidate(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl flex items-center justify-between border">
              <div>
                <span className="text-[11px] text-slate-500 font-semibold uppercase">Overall ATS Score</span>
                <p className="text-2xl font-black text-indigo-600">{selectedCandidate.ats_score} / 100</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${GRADE_COLORS[selectedCandidate.category]?.bg}`}>
                Grade {selectedCandidate.category} — {GRADE_COLORS[selectedCandidate.category]?.tag}
              </span>
            </div>

            {/* Matched Skills */}
            <div>
              <p className="text-xs font-bold text-emerald-800 mb-1.5 flex items-center space-x-1">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Matched Skills ({selectedCandidate.matched_skills.length})</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {selectedCandidate.matched_skills.length > 0 ? (
                  selectedCandidate.matched_skills.map((s, i) => (
                    <span key={i} className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-xs font-semibold">
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">No exact skill keywords matched.</span>
                )}
              </div>
            </div>

            {/* Missing Skills */}
            <div>
              <p className="text-xs font-bold text-rose-800 mb-1.5 flex items-center space-x-1">
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>Missing / Desired Skills ({selectedCandidate.missing_skills.length})</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {selectedCandidate.missing_skills.length > 0 ? (
                  selectedCandidate.missing_skills.map((s, i) => (
                    <span key={i} className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-xs font-medium">
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-emerald-600 font-semibold">All required skills present!</span>
                )}
              </div>
            </div>

            {/* Extracted Snippet */}
            <div>
              <p className="text-xs font-bold text-slate-700 mb-1">Resume Text Snippet (Extracted via URL / Parser)</p>
              <div className="p-3 bg-slate-100 rounded-lg text-xs text-slate-700 font-mono whitespace-pre-wrap max-h-36 overflow-y-auto">
                {selectedCandidate.resume_snippet || 'No resume text available.'}
              </div>
            </div>

            {selectedCandidate.resume_url && (
              <a
                href={selectedCandidate.resume_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-indigo-600 hover:underline"
              >
                <span>Open Original Resume Document</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedCandidate(null)}
                className="px-4 py-1.5 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-lg"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
