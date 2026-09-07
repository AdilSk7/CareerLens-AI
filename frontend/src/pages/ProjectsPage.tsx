import { useState } from "react"
import { useResumes } from "../hooks/useResumes"
import { ArrowLeft, Rocket, FolderGit2, Code, Zap, Lightbulb, Target } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Card } from "../components/ui/card"
import { getAuth } from "firebase/auth"

export function ProjectsPage() {
  const { resumes, loading } = useResumes()
  const navigate = useNavigate()
  
  const [selectedResumeId, setSelectedResumeId] = useState<string>("")
  const [targetDomain, setTargetDomain] = useState<string>("")
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [projectsData, setProjectsData] = useState<any>(null)
  const [error, setError] = useState("")

  const analyzedResumes = resumes.filter(r => r.analysis)

  const handleGenerateProjects = async () => {
    if (!selectedResumeId || !targetDomain.trim()) {
      setError("Please select a resume and a target domain.")
      return
    }
    
    setIsGenerating(true)
    setError("")
    setProjectsData(null)
    
    try {
      const auth = getAuth()
      const user = auth.currentUser
      if (!user) throw new Error("Unauthenticated")
      const token = await user.getIdToken()
      
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/resume/${selectedResumeId}/projects`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          target_domain: targetDomain
        })
      })
      
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || "Failed to generate projects")
      }
      
      setProjectsData(data.data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-[1400px]">
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
            <span className="text-indigo-600 dark:text-indigo-400"><FolderGit2 className="w-8 h-8" /></span>
             Portfolio Architecture
          </h1>
          <p className="text-muted-foreground mt-1">
            Discover tailored capstone projects engineered to bridge your exact skill gaps.
          </p>
        </div>
        
        {/* Resume Selector */}
        <div className="w-full md:w-auto bg-white dark:bg-[#101A2E] border border-slate-200 dark:border-[#24334A] p-2 rounded-xl shadow-sm">
          <select
            value={selectedResumeId}
            onChange={(e) => setSelectedResumeId(e.target.value)}
            className="w-full md:w-[280px] text-sm font-medium rounded-lg border-none bg-slate-50 dark:bg-[#101B2D] px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-slate-100 cursor-pointer"
          >
            <option value="" disabled className="bg-slate-50 dark:bg-[#101B2D] text-slate-900 dark:text-slate-100">Select an existing Resume...</option>
            {analyzedResumes.map(r => (
              <option key={r.id} value={r.id} className="bg-slate-50 dark:bg-[#101B2D] text-slate-900 dark:text-slate-100">{r.fileName}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64 text-slate-400">Loading your profile...</div>
      ) : analyzedResumes.length === 0 ? (
        <div className="flex flex-col justify-center items-center h-[400px] text-center space-y-4 bg-white dark:bg-[#101A2E] rounded-2xl border border-slate-200 dark:border-[#24334A]">
          <p className="text-slate-500 font-medium">You don`t have any parsed resumes yet.</p>
          <button onClick={() => navigate("/dashboard")} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors">
            Go upload a Resume
          </button>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Controls Sidebar */}
          <Card className="w-full lg:w-[350px] flex-shrink-0 p-6 border-slate-200 dark:border-[#24334A] bg-white dark:bg-[#101A2E] shadow-[0_4px_16px_rgba(15,23,42,0.04)] dark:shadow-none rounded-2xl h-fit">
            <div className="space-y-6">
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-indigo-500" /> Target Domain 
                </label>
                <input
                  type="text"
                  placeholder="e.g. Full Stack SaaS, Data Science..."
                  value={targetDomain}
                  onChange={(e) => setTargetDomain(e.target.value)}
                  className="w-full text-sm font-medium rounded-xl border border-slate-200 dark:border-[#24334A] bg-slate-50 dark:bg-[#101B2D] text-slate-900 dark:text-slate-100 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                />
              </div>

              <button
                onClick={handleGenerateProjects}
                disabled={isGenerating || !selectedResumeId || !targetDomain.trim()}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl shadow-[0_4px_14px_rgba(79,70,229,0.3)] transition-all flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Zap className="w-4 h-4 animate-pulse" /> Architecting Repositories...
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4" /> Recommend Projects
                  </>
                )}
              </button>
            </div>
          </Card>

          {/* Main Visualizer Area */}
          <div className="flex-grow min-h-[600px]">
            {!projectsData && !isGenerating ? (
              <div className="w-full h-full rounded-2xl border border-slate-200 dark:border-[#24334A] bg-white dark:bg-[#101A2E] p-6 flex flex-col items-center justify-center text-center shadow-sm dark:shadow-none transition-all hover:bg-slate-50/50 dark:hover:bg-[#1A263D]">
                <FolderGit2 className="w-12 h-12 mb-4 opacity-20 text-indigo-500 dark:text-slate-400" />
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Configure Target Space</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-[400px] text-[15px] leading-relaxed font-medium">
                  We will cross-reference your current skills against the target domain and formulate high-ROI real-world projects you should build to level up.
                </p>
              </div>
            ) : isGenerating ? (
              <div className="w-full h-full rounded-2xl border border-slate-200 dark:border-[#24334A] bg-white dark:bg-[#101A2E] p-6 flex flex-col items-center justify-center text-center shadow-sm dark:shadow-none animate-pulse">
                <Zap className="w-12 h-12 mb-4 text-indigo-500" />
                <h3 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">Analyzing Domain Gaps</h3>
                <p className="text-slate-500 dark:text-slate-400 text-[15px] font-medium max-w-sm">
                  Weaving your skill metrics through the '{targetDomain}' matrix...
                </p>
              </div>
            ) : (
              <div className="w-full rounded-2xl bg-transparent animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                
                {/* Skill Gaps Card */}
                <div className="w-full bg-white dark:bg-[#101A2E] border border-slate-200 dark:border-[#24334A] rounded-2xl p-6 lg:p-8 shadow-sm dark:shadow-none">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                       Detected Domain Gaps
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {projectsData.skill_gaps?.map((gap: any, i: number) => (
                        <div key={i} className="px-3 py-1.5 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50 rounded-lg text-sm font-semibold flex items-center gap-1.5">
                          <Target className="w-3.5 h-3.5" />
                          {gap.skill || gap}
                        </div>
                      ))}
                    </div>
                </div>

                {/* Projects Grid */}
                <div className="grid grid-cols-1 gap-6">
                    {projectsData.projects?.map((proj: any, idx: number) => (
                        <div key={idx} className="w-full bg-white dark:bg-[#101A2E] border border-slate-200 dark:border-[#24334A] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                           {/* Decorative top border */}
                           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                           
                           <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                               <div>
                                   <div className="flex items-center gap-2 mb-1">
                                       <Code className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                                       <h3 className="text-xl font-bold text-slate-900 dark:text-white">{proj.title}</h3>
                                   </div>
                                   <span className={`inline-block px-2.5 py-0.5 mt-1 rounded text-xs font-bold uppercase tracking-wider
                                       ${proj.difficulty.toLowerCase().includes('beg') ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400' :
                                         proj.difficulty.toLowerCase().includes('adv') ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-400' :
                                         'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400'}`}>
                                       {proj.difficulty}
                                   </span>
                               </div>
                           </div>

                           <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6 font-medium">
                               {proj.description}
                           </p>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                               <div className="bg-slate-50 dark:bg-[#142038] p-4 rounded-xl border border-slate-100 dark:border-[#24334A]">
                                   <h4 className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                                       <Lightbulb className="w-3.5 h-3.5" /> Expected Outcome
                                   </h4>
                                   <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                       {proj.expected_outcome}
                                   </p>
                               </div>
                               <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                                   <h4 className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-2">
                                       <Target className="w-3.5 h-3.5" /> Portfolio Value
                                   </h4>
                                   <p className="text-sm font-medium text-indigo-900 dark:text-indigo-200">
                                       {proj.portfolio_value}
                                   </p>
                               </div>
                           </div>

                           <div>
                               <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3">Architectural Stack</h4>
                               <div className="flex flex-wrap gap-2">
                                   {proj.technologies?.map((tech: string, i: number) => (
                                       <span key={i} className="px-3 py-1.5 bg-slate-100 dark:bg-[#101B2D] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#24334A] text-xs font-bold rounded-md flex items-center gap-1">
                                           {tech}
                                       </span>
                                   ))}
                               </div>
                           </div>

                        </div>
                    ))}
                </div>

              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
