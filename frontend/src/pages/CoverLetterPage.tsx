import { useState } from "react"
import { useResumes } from "../hooks/useResumes"
import { CoverLetterGenerator } from "../components/CoverLetterGenerator"
import { ArrowLeft, Sparkles, FileText } from "lucide-react"
import { useNavigate } from "react-router-dom"

export function CoverLetterPage() {
  const { resumes, loading } = useResumes()
  const navigate = useNavigate()
  const [selectedResumeId, setSelectedResumeId] = useState<string>("")

  // Filter out resumes that haven't been successfully analyzed yet
  const analyzedResumes = resumes.filter(r => r.analysis)

  return (
    <div className="container mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <button 
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <span className="text-indigo-600 dark:text-indigo-400"><Sparkles className="w-8 h-8" /></span>
             Standalone Cover Letter Generator
          </h1>
          <p className="text-muted-foreground mt-1">
            Pick a resume from your portfolio to generate a tailored cover letter.
          </p>
        </div>
        
        {/* Resume Selector */}
        <div className="w-full md:w-auto bg-white dark:bg-[#101A2E] border border-slate-200 dark:border-[#24334A] p-2 rounded-xl shadow-sm">
          <select
            value={selectedResumeId}
            onChange={(e) => setSelectedResumeId(e.target.value)}
            className="w-full md:w-[280px] text-sm font-medium rounded-lg border-none bg-slate-50 dark:bg-[#101B2D] px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-slate-100 cursor-pointer"
          >
            <option value="" disabled className="bg-slate-50 dark:bg-[#101B2D] text-slate-900 dark:text-slate-100">Select a parsed Resume...</option>
            {analyzedResumes.map(r => (
              <option key={r.id} value={r.id} className="bg-slate-50 dark:bg-[#101B2D] text-slate-900 dark:text-slate-100">{r.fileName}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64 text-slate-400">Loading resumes...</div>
      ) : analyzedResumes.length === 0 ? (
        <div className="flex flex-col justify-center items-center h-64 text-center space-y-4">
          <p className="text-slate-500 font-medium">You don't have any parsed resumes yet.</p>
          <button onClick={() => navigate("/dashboard")} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors">
            Go upload a Resume
          </button>
        </div>
      ) : (
        <div className="mt-6">
          {selectedResumeId ? (
            <CoverLetterGenerator resumeId={selectedResumeId} />
          ) : (
             <div className="h-[500px] flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-[#24334A] rounded-2xl bg-white dark:bg-[#101A2E] shadow-sm transition-all hover:border-indigo-200 dark:hover:border-indigo-900/50">
               <div className="bg-indigo-50 dark:bg-indigo-900/30 p-5 rounded-full mb-5 shadow-sm">
                 <FileText className="w-10 h-10 text-indigo-500 dark:text-indigo-400" />
               </div>
               <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Select a Resume Context</h3>
               <p className="text-slate-500 dark:text-slate-400 max-w-[400px] text-center text-[15px] leading-relaxed font-medium">
                 To generate a hyper-personalized cover letter, we first need to securely map your skills and experience. Please select a parsed resume from the dropdown above to begin.
               </p>
             </div>
          )}
        </div>
      )}
    </div>
  )
}
