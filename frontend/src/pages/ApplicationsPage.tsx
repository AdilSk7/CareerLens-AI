import { useState } from 'react';
import { useApplications, type ApplicationRecord } from '../hooks/useApplications';
import { useResumes } from '../hooks/useResumes';
import { useAuth } from '../contexts/AuthContext';
import { Briefcase, Plus, Trash2, Edit3, Wand2, ExternalLink, X, Loader2, CheckCircle2, Target, AlertCircle, FileText, Eye } from 'lucide-react';
import { JobDescriptionInput } from '../components/JobDescriptionInput';

export function ApplicationsPage() {
  const { currentUser } = useAuth();
  const { applications, loading, refresh } = useApplications();
  const { resumes } = useResumes();
  
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<ApplicationRecord | null>(null);
  const [viewApp, setViewApp] = useState<ApplicationRecord | null>(null);
  
  const [formData, setFormData] = useState({
    company_name: '',
    job_title: '',
    job_description: '',
    status: 'Saved',
    job_url: '',
    notes: '',
    resume_id: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Resume Tailor States
  const [isTailorModalOpen, setIsTailorModalOpen] = useState(false);
  const [tailorApp, setTailorApp] = useState<ApplicationRecord | null>(null);
  const [isTailoring, setIsTailoring] = useState(false);
  const [tailorError, setTailorError] = useState("");

  const resetForm = () => {
    setFormData({
      company_name: '',
      job_title: '',
      job_description: '',
      status: 'Saved',
      job_url: '',
      notes: '',
      resume_id: ''
    });
    setEditingApp(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsAppModalOpen(true);
  };

  const openEditModal = (app: ApplicationRecord) => {
    setFormData({
      company_name: app.company_name,
      job_title: app.job_title,
      job_description: app.job_description,
      status: app.status,
      job_url: app.job_url,
      notes: app.notes,
      resume_id: app.resume_id
    });
    setEditingApp(app);
    setIsAppModalOpen(true);
  };

  const saveApplication = async () => {
    if (!formData.company_name || !formData.job_title) return;
    setIsSubmitting(true);
    try {
      const token = await currentUser?.getIdToken();
      const url = editingApp 
        ? `${import.meta.env.VITE_API_BASE_URL}/api/applications/${editingApp.id}`
        : `${import.meta.env.VITE_API_BASE_URL}/api/applications`;
      
      const method = editingApp ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) throw new Error("Failed to save application");
      
      await refresh();
      setIsAppModalOpen(false);
      resetForm();
    } catch (e) {
      console.error(e);
      alert("Failed to save application.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteApplication = async (id: string) => {
    if (!confirm("Are you sure you want to delete this application?")) return;
    try {
      const token = await currentUser?.getIdToken();
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/applications/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      await refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const openTailorModal = (app: ApplicationRecord) => {
    setTailorApp(app);
    setTailorError("");
    setIsTailorModalOpen(true);
  };

  const runResumeTailor = async () => {
    if (!tailorApp) return;
    setIsTailoring(true);
    setTailorError("");
    try {
      const token = await currentUser?.getIdToken();
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/applications/${tailorApp.id}/tailor-resume`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to tailor resume");
      }
      
      // Update local state without full refresh immediately for snappier UI
      setTailorApp(prev => prev ? {...prev, tailored_resume_data: data.data} : null);
      await refresh();
    } catch (e: any) {
      console.error(e);
      setTailorError(e.message);
    } finally {
      setIsTailoring(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Applied': return <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-md text-xs font-semibold">Applied</span>;
      case 'Interviewing': return <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-md text-xs font-semibold">Interviewing</span>;
      case 'Offer': return <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md text-xs font-semibold">Offer</span>;
      case 'Rejected': return <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md text-xs font-semibold">Rejected</span>;
      case 'Rejected (Application)': return <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md text-xs font-semibold bg-opacity-70">Rejected (Application)</span>;
      case 'Rejected (Interview)': return <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md text-xs font-semibold">Rejected (Interview)</span>;
      default: return <span className="px-2 py-1 bg-slate-100 dark:bg-[#142038] text-slate-700 dark:text-slate-400 rounded-md text-xs font-semibold">Saved</span>;
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div className="relative isolate">
          <h1 className="text-3xl font-bold tracking-tight text-[#0F172A] dark:text-white relative">Job Tracker</h1>
          <p className="text-[#64748B] dark:text-slate-400 mt-1 font-medium text-[15px]">
            Manage applications and tailor your resume
          </p>
        </div>
        <button 
          onClick={openAddModal}
          className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-[linear-gradient(135deg,#4F46E5,#6366F1)] hover:brightness-110 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md"
        >
          <Plus className="w-4 h-4" /> Add Application
        </button>
      </div>

      <div className="bg-white/80 dark:bg-[#101A2E] backdrop-blur-[10px] dark:backdrop-blur-none border border-[#DCE5F5] dark:border-transparent rounded-2xl shadow-sm dark:shadow-none overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-blue-50 dark:bg-[#111D32] rounded-full flex items-center justify-center mx-auto mb-4 mb-4">
              <Briefcase className="w-8 h-8 text-blue-500 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No Applications Yet</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">Tracking your applications helps CareerLens AI give you better insights and tailor your resume perfectly.</p>
            <button onClick={openAddModal} className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
              Add your first application
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-[#111D32] border-b border-slate-200 dark:border-[#24334A]/50">
                  <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300 text-sm">Role & Company</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300 text-sm">Status</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300 text-sm">Date</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300 text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map(app => (
                  <tr key={app.id} className="border-b border-slate-100 dark:border-[#142038] hover:bg-slate-50/50 dark:hover:bg-[#142038]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {app.job_title}
                        {app.job_url && (
                          <a href={app.job_url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-indigo-500">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">{app.company_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(app.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openTailorModal(app)}
                          className={`p-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                            app.tailored_resume_data 
                              ? "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40" 
                              : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/40"
                          }`}
                          title={app.tailored_resume_data ? "View Tailored Resume" : "Tailor Resume w/ AI"}
                        >
                          <Wand2 className="w-4 h-4" />
                          {app.tailored_resume_data ? "View Tailored" : "Tailor"}
                        </button>
                        <button onClick={() => setViewApp(app)} className="p-2 text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors" title="View Details">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEditModal(app)} className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-amber-400 transition-colors">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteApplication(app.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isAppModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 dark:bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#101A2E] w-full max-w-lg rounded-2xl shadow-xl dark:border dark:border-[#24334A] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 dark:border-[#24334A] flex items-center justify-between">
              <h2 className="text-xl font-bold dark:text-white">{editingApp ? "Edit Application" : "Track Application"}</h2>
              <button onClick={() => setIsAppModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5"/>
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Company</label>
                  <input 
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#142038] border border-slate-200 dark:border-[#24334A] rounded-lg dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} placeholder="e.g. Google"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Job Title</label>
                  <input 
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#142038] border border-slate-200 dark:border-[#24334A] rounded-lg dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    value={formData.job_title} onChange={e => setFormData({...formData, job_title: e.target.value})} placeholder="e.g. Frontend Engineer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                  <select 
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#142038] border border-slate-200 dark:border-[#24334A] rounded-lg dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} 
                  >
                    <option>Saved</option>
                    <option>Applied</option>
                    <option>Interviewing</option>
                    <option>Offer</option>
                    <option>Rejected (Application)</option>
                    <option>Rejected (Interview)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Resume</label>
                  <select 
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#142038] border border-slate-200 dark:border-[#24334A] rounded-lg dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    value={formData.resume_id} onChange={e => setFormData({...formData, resume_id: e.target.value})} 
                  >
                    <option value="">Select a parsed resume...</option>
                    {resumes.map(r => (
                      <option key={r.id} value={r.id}>{r.fileName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Job Description</label>
                <JobDescriptionInput 
                  value={formData.job_description} 
                  onChange={(val) => setFormData({...formData, job_description: val})} 
                  placeholder="Paste job description here for AI Tailoring..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Job URL (optional)</label>
                <input 
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#142038] border border-slate-200 dark:border-[#24334A] rounded-lg dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  value={formData.job_url} onChange={e => setFormData({...formData, job_url: e.target.value})} placeholder="https://..."
                />
              </div>

            </div>
            <div className="p-6 border-t border-slate-100 dark:border-[#24334A] flex justify-end gap-3 bg-slate-50/50 dark:bg-[#0B1220]">
              <button disabled={isSubmitting} onClick={() => setIsAppModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-[#1A263D] rounded-lg transition-colors">Cancel</button>
              <button disabled={isSubmitting || !formData.company_name || !formData.job_title} onClick={saveApplication} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : "Save Tracker"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tailor Modal */}
      {isTailorModalOpen && tailorApp && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/20 dark:bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#101A2E] w-full max-w-4xl rounded-2xl shadow-xl dark:border dark:border-[#24334A] overflow-hidden flex flex-col max-h-[95vh] min-h-[50vh]">
            <div className="p-6 border-b border-slate-100 dark:border-[#24334A] flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                  <Wand2 className="text-indigo-500 w-5 h-5" /> 
                  AI Resume Tailor
                </h2>
                <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                  {tailorApp.job_title} @ {tailorApp.company_name}
                </div>
              </div>
              <button onClick={() => setIsTailorModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-6 h-6"/>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-[#0A1120] p-6 relative">
              {!tailorApp.tailored_resume_data && !isTailoring ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <FileText className="w-16 h-16 text-indigo-300 dark:text-indigo-800/50 mb-4" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Ready to Tailor Your Resume?</h3>
                  <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-6">
                    Our AI will analyze the job description against your exact experiences and safely rewrite your bullet points to maximize ATS match probability.
                  </p>
                  <button 
                    onClick={runResumeTailor}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all"
                  >
                    Analyze & Tailor Resume
                  </button>
                  {tailorError && <p className="text-red-500 mt-4 text-sm font-medium">{tailorError}</p>}
                </div>
              ) : isTailoring ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-20">
                  <div className="w-16 h-16 bg-white dark:bg-[#142038] rounded-2xl shadow-xl flex items-center justify-center mb-6 animate-bounce">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Analyzing gap & tailoring bullets...</h3>
                  <p className="text-slate-500 dark:text-slate-400 max-w-sm">
                    Re-structuring your accomplishments against the requirements of {tailorApp.company_name}.
                  </p>
                </div>
              ) : tailorApp.tailored_resume_data ? (
                <div className="grid md:grid-cols-[300px_1fr] gap-6 items-start">
                  
                  {/* Left panel metrics */}
                  <div className="space-y-4">
                    <div className="bg-white dark:bg-[#142038] rounded-xl border border-slate-200 dark:border-[#24334A] p-4 text-sm">
                       <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-1.5"><CheckCircle2 className="text-green-500 w-4 h-4"/> Matched Skills</h4>
                       <div className="flex flex-wrap gap-1.5">
                         {tailorApp.tailored_resume_data.matched_skills?.map((s: string, i: number) => (
                           <span key={i} className="px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-md font-semibold text-xs border border-green-100 dark:border-green-900/50">{s}</span>
                         ))}
                       </div>
                    </div>
                    <div className="bg-white dark:bg-[#142038] rounded-xl border border-slate-200 dark:border-[#24334A] p-4 text-sm">
                       <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-1.5"><Target className="text-rose-500 w-4 h-4"/> Missing Skills</h4>
                       <div className="flex flex-wrap gap-1.5">
                         {tailorApp.tailored_resume_data.missing_skills?.map((s: string, i: number) => (
                           <span key={i} className="px-2 py-1 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 rounded-md font-semibold text-xs border border-rose-100 dark:border-rose-900/50">{s}</span>
                         ))}
                         {(!tailorApp.tailored_resume_data.missing_skills || tailorApp.tailored_resume_data.missing_skills.length === 0) && (
                           <span className="text-slate-500 dark:text-slate-400">None detected!</span>
                         )}
                       </div>
                    </div>
                    {tailorApp.tailored_resume_data.warnings?.length > 0 && (
                      <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-900/30 p-4 text-sm">
                         <h4 className="font-bold text-amber-800 dark:text-amber-500 mb-2 flex items-center gap-1.5"><AlertCircle className="w-4 h-4"/> Warnings</h4>
                         <ul className="list-disc pl-4 space-y-1 text-amber-700 dark:text-amber-400/80">
                           {tailorApp.tailored_resume_data.warnings.map((w: string, i: number) => (
                             <li key={i}>{w}</li>
                           ))}
                         </ul>
                      </div>
                    )}
                  </div>
                  
                  {/* Right panel text */}
                  <div className="bg-white dark:bg-[#142038] rounded-xl border border-slate-200 dark:border-[#24334A] p-6">
                     <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200 mb-4 pb-4 border-b border-slate-100 dark:border-[#24334A]">
                       <span>Tailored Content</span>
                       <button 
                          onClick={() => {
                            navigator.clipboard.writeText(tailorApp.tailored_resume_data.tailored_resume);
                            alert("Copied directly to clipboard!");
                          }}
                          className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-lg text-sm transition-colors"
                        >
                         Copy Resume
                       </button>
                     </div>
                     <pre className="text-sm font-mono whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed overflow-x-auto">
                       {tailorApp.tailored_resume_data.tailored_resume}
                     </pre>
                  </div>
                </div>
              ) : null}
            </div>
            
            {tailorApp.tailored_resume_data && (
              <div className="p-4 border-t border-slate-100 dark:border-[#24334A] flex justify-between bg-slate-50 dark:bg-[#101A2E]">
                <button onClick={runResumeTailor} disabled={isTailoring} className="px-4 py-2 text-indigo-600 dark:text-indigo-400 font-semibold hover:bg-slate-100 dark:hover:bg-[#142038] rounded-lg transition-colors">
                  Regenerate
                </button>
                <button onClick={() => setIsTailorModalOpen(false)} className="px-6 py-2 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 font-bold rounded-lg hover:bg-slate-700 dark:hover:bg-white transition-colors">
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* View Modal */}
      {viewApp && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/20 dark:bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#101A2E] w-full max-w-2xl rounded-2xl shadow-xl dark:border dark:border-[#24334A] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 dark:border-[#24334A] flex items-center justify-between">
              <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                <Briefcase className="text-blue-500 w-5 h-5" /> 
                {viewApp.job_title} @ {viewApp.company_name}
              </h2>
              <button onClick={() => setViewApp(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-6 h-6"/>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-[#142038] p-4 rounded-xl border border-slate-100 dark:border-[#24334A]">
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status</div>
                  {getStatusBadge(viewApp.status)}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Date Added</div>
                  <div className="font-semibold text-slate-700 dark:text-slate-300">{new Date(viewApp.createdAt).toLocaleDateString()}</div>
                </div>
                {viewApp.job_url && (
                  <div className="col-span-2">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Job Link</div>
                    <a href={viewApp.job_url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center gap-1 font-medium overflow-hidden text-ellipsis whitespace-nowrap">
                      {viewApp.job_url} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                {viewApp.resume_id && (
                  <div className="col-span-2">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Target Resume</div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {resumes.find(r => r.id === viewApp.resume_id)?.fileName || "Unknown Resume"}
                      </span>
                      {resumes.find(r => r.id === viewApp.resume_id)?.fileUrl && (
                        <a 
                          href={resumes.find(r => r.id === viewApp.resume_id)!.fileUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-blue-500 hover:text-blue-600 transition-colors bg-blue-50 dark:bg-blue-900/20 p-1.5 rounded-md" 
                          title="View PDF"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {viewApp.notes && (
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2 border-b border-slate-100 dark:border-[#24334A] pb-2">Notes</h3>
                  <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap text-sm leading-relaxed">
                    {viewApp.notes}
                  </p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2 border-b border-slate-100 dark:border-[#24334A] pb-2">Target Job Description</h3>
                <div className="bg-slate-50 dark:bg-[#0A1120] border border-slate-100 dark:border-[#24334A] rounded-lg p-4 max-h-[300px] overflow-y-auto">
                  <pre className="text-sm font-mono whitespace-pre-wrap text-slate-700 dark:text-slate-400">
                    {viewApp.job_description || "No job description added."}
                  </pre>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 dark:border-[#24334A] flex justify-end bg-slate-50 dark:bg-[#101A2E]">
              <button 
                onClick={() => setViewApp(null)} 
                className="px-6 py-2 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 font-bold rounded-lg hover:bg-slate-700 dark:hover:bg-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
