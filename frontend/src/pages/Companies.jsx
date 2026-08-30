import React, { useEffect, useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Sparkles, 
  ExternalLink, 
  Award, 
  Briefcase, 
  Users, 
  CheckCircle,
  FileText,
  Search,
  Eye,
  ShieldAlert
} from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import ResumeMatchingModal from './ResumeMatchingModal';

export default function Companies() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [matchingCompany, setMatchingCompany] = useState(null);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const res = await api.get('/companies');
      setCompanies(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== 'manager') {
      fetchCompanies();
    }
  }, [user]);

  if (user?.role === 'manager') {
    return (
      <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">403 — Access Denied</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Placement Managers do not have permission to view or manage corporate company accounts.
        </p>
      </div>
    );
  }

  const filteredCompanies = companies.filter(c => {
    if (!search) return true;
    return c.name.toLowerCase().includes(search.toLowerCase()) || 
           c.role.toLowerCase().includes(search.toLowerCase()) ||
           c.location.toLowerCase().includes(search.toLowerCase());
  });

  const openGoogleMaps = (location, companyName) => {
    const query = encodeURIComponent(`${companyName} ${location}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-800 text-sm">
            {user?.role === 'team_member' ? 'Your Assigned Approved Companies' : 'Approved Corporate Partners'}
          </h3>
          <p className="text-xs text-slate-500">Official campus recruitment drives, JD requirements, and ATS ranking</p>
        </div>
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search company, role or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300"
          />
        </div>
      </div>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 py-16 text-center text-slate-400 font-medium">
            Loading approved company drives...
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="col-span-3 py-16 text-center text-slate-400 text-xs">
            No approved companies found.
          </div>
        ) : (
          filteredCompanies.map((comp) => (
            <div 
              key={comp.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
            >
              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-base">
                      {comp.name[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">{comp.name}</h4>
                      <button
                        onClick={() => openGoogleMaps(comp.location, comp.name)}
                        className="text-xs text-slate-500 hover:text-indigo-600 font-medium flex items-center space-x-1 mt-0.5"
                        title="View location in Google Maps"
                      >
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        <span className="truncate max-w-[160px]">{comp.location}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                    comp.status === 'Placement Completed' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-indigo-100 text-indigo-800'
                  }`}>
                    {comp.status}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium text-[10px]">ROLE DESIGNATION</span>
                    <p className="font-bold text-slate-800 truncate">{comp.role}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium text-[10px]">PACKAGE (CTC)</span>
                    <p className="font-black text-indigo-600">{comp.ctc} LPA</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium text-[10px]">COMPANY TIER</span>
                    <p className="font-semibold text-slate-700">{comp.tier}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium text-[10px]">TOTAL OFFERS</span>
                    <p className="font-bold text-emerald-700">{comp.offers_count} Offers</p>
                  </div>
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Officer: <strong className="text-slate-700">{comp.team_member_name}</strong>
                </span>
                <button
                  onClick={() => setMatchingCompany(comp)}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs flex items-center space-x-1.5 shadow-xs shadow-indigo-600/20"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Match Resumes (ATS)</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Resume Matching ATS Modal */}
      {matchingCompany && (
        <ResumeMatchingModal
          isOpen={!!matchingCompany}
          onClose={() => setMatchingCompany(null)}
          companyId={matchingCompany.id}
          companyName={matchingCompany.name}
        />
      )}
    </div>
  );
}
