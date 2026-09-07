import { useState } from "react"
import { Loader2, FileText, CheckCircle2, RefreshCw, Copy, Building, Briefcase, Zap } from "lucide-react"
import { getAuth } from "firebase/auth"
import { JobDescriptionInput } from "./JobDescriptionInput"

interface CoverLetterGeneratorProps {
  resumeId: string
}

// Inline minimal UI components for rapid integration matching current architecture
const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={`rounded-xl border bg-card text-card-foreground shadow-sm ${className}`}>{children}</div>
)

export function CoverLetterGenerator({ resumeId }: CoverLetterGeneratorProps) {
  const [jobDescription, setJobDescription] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [jobTitle, setJobTitle] = useState("")
  const [tone, setTone] = useState("Professional")
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [coverLetterText, setCoverLetterText] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    if (!jobDescription.trim() || !companyName.trim() || !jobTitle.trim()) {
      setError("Please fill out all fields before generating.")
      return
    }

    setIsGenerating(true)
    setError(null)
    setCopied(false)
    
    try {
      const auth = getAuth()
      const user = auth.currentUser
      if (!user) throw new Error("Not authenticated")
      const token = await user.getIdToken()

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/resume/${resumeId}/cover-letter`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          job_description: jobDescription,
          company_name: companyName,
          job_title: jobTitle,
          tone: tone
        })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.detail || "Failed to generate cover letter")
      }

      const data = await res.json()
      setCoverLetterText(data.data.cover_letter)
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = () => {
    if (coverLetterText) {
      navigator.clipboard.writeText(coverLetterText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full animate-in fade-in ease-out duration-300">
      
      {/* Left side: Inputs */}
      <div className="space-y-6 flex flex-col h-full">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <FileText className="w-5 h-5" />
            </span>
            Cover Letter Generator
          </h2>
          <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
            Generate a personalized, highly effective cover letter customized to the target company, role, and your specific experience profile.
          </p>
        </div>

        <Card className="p-6 border-slate-200 dark:border-[#24334A] bg-white dark:bg-[#101A2E] shadow-[0_4px_16px_rgba(15,23,42,0.04)] dark:shadow-none rounded-2xl flex-grow flex flex-col justify-between">
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5"><Building className="w-3.5 h-3.5" /> Company Name</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Corp"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full text-sm font-medium rounded-xl border border-slate-200 dark:border-[#24334A] bg-slate-50 dark:bg-[#101B2D] text-slate-900 dark:text-slate-100 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /> Job Title</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Frontend Engineer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full text-sm font-medium rounded-xl border border-slate-200 dark:border-[#24334A] bg-slate-50 dark:bg-[#101B2D] text-slate-900 dark:text-slate-100 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">🎯 Select Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full text-sm font-medium rounded-xl border border-slate-200 dark:border-[#24334A] bg-slate-50 dark:bg-[#101B2D] text-slate-900 dark:text-slate-100 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer"
              >
                <option value="Professional">Professional (Corporate & Standard)</option>
                <option value="Confident">Confident (Assertive & Bold)</option>
                <option value="Concise">Concise (To the point)</option>
                <option value="Friendly">Friendly (Approachable & Enthusiastic)</option>
              </select>
            </div>

            <div className="space-y-2 flex-grow flex flex-col">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Target Job Description</label>
              <JobDescriptionInput
                value={jobDescription}
                onChange={setJobDescription}
                placeholder="Paste the full job description here. Our AI will analyze the key requirements and write a cover letter demonstrating your alignment..."
              />
            </div>
            
            {error && (
              <div className="text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/40 p-4 rounded-lg flex items-center gap-2">
                <span className="shrink-0 text-lg">⚠️</span> {error}
              </div>
            )}
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 disabled:hover:bg-indigo-600 text-white font-bold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] hover:-translate-y-0.5"
          >
            {isGenerating ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Drafting Cover Letter...</>
            ) : (
               coverLetterText ? <><RefreshCw className="w-5 h-5" /> Regenerate Draft</> : <><Zap className="w-5 h-5" /> Generate Cover Letter</>
            )}
          </button>
        </Card>
      </div>

      {/* Right side: Output */}
      <div className="h-full flex flex-col relative z-0">
        <div className="flex items-center justify-between mb-4 mt-2 lg:mt-0">
           <h3 className="text-xl font-bold text-slate-900 dark:text-slate-200">Generated Draft</h3>
           {coverLetterText && (
             <button 
               onClick={handleCopy}
               className={`text-xs font-bold py-1.5 px-3 rounded-md transition-colors flex items-center gap-1.5 border
                 ${copied 
                   ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                   : 'bg-white hover:bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                 }`}
             >
               {copied ? <><CheckCircle2 className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Text</>}
             </button>
           )}
        </div>
        <div className="flex-grow relative h-full min-h-[500px] w-full">
          {isGenerating && (
            <div className="absolute inset-0 z-10 bg-white/80 dark:bg-[#101A2E]/80 backdrop-blur-[2px] flex flex-col items-center justify-center text-indigo-700 dark:text-indigo-400 rounded-2xl">
              <Loader2 className="w-10 h-10 animate-spin mb-4" />
              <div className="font-bold tracking-wide animate-pulse">Generating your professional edge...</div>
            </div>
          )}
          
          {coverLetterText ? (
            <textarea
              value={coverLetterText}
              onChange={(e) => setCoverLetterText(e.target.value)}
              className="w-full h-full min-h-[500px] resize-none rounded-2xl border border-slate-200 dark:border-[#24334A] bg-white dark:bg-[#101A2E] text-slate-900 dark:text-white p-6 md:p-8 text-[15px] leading-relaxed shadow-sm dark:shadow-none outline-none focus:border-indigo-400 font-medium transition-all"
              spellCheck="false"
            />
          ) : (
            <div className="w-full h-full min-h-[500px] rounded-2xl border border-slate-200 dark:border-[#24334A] bg-white dark:bg-[#101A2E] p-6 md:p-8 flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500 shadow-sm dark:shadow-none transition-all hover:bg-slate-50/50 dark:hover:bg-[#1A263D]">
               <Zap className="w-12 h-12 mb-4 opacity-20 text-indigo-500 dark:text-slate-400" />
               <p className="font-medium max-w-sm text-slate-600 dark:text-slate-500">Hit "Generate Cover Letter" to see your personalized draft appear here.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
