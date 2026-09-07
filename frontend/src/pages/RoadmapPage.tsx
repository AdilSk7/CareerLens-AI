import { useState, useEffect } from "react"
import { useResumes } from "../hooks/useResumes"
import { ArrowLeft, Sparkles, Map, Target, Clock, Zap, CheckCircle2, Square, CheckSquare } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Card } from "../components/ui/card"
import { getAuth } from "firebase/auth"

export function RoadmapPage() {
  const { resumes, loading } = useResumes()
  const navigate = useNavigate()
  
  const [selectedResumeId, setSelectedResumeId] = useState<string>("")
  const [targetRole, setTargetRole] = useState<string>("")
  const [timeframe, setTimeframe] = useState<string>("6 months")
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [roadmapData, setRoadmapData] = useState<any>(null)
  const [error, setError] = useState("")

  const analyzedResumes = resumes.filter(r => r.analysis)

  useEffect(() => {
    if (selectedResumeId) {
      const resume = resumes.find(r => r.id === selectedResumeId)
      if (resume?.roadmap) {
        setRoadmapData(resume.roadmap)
        setTargetRole(resume.target_role || "")
      } else {
        setRoadmapData(null)
      }
    }
  }, [selectedResumeId, resumes])

  const handleGenerateRoadmap = async () => {
    if (!selectedResumeId || !targetRole.trim() || !timeframe) {
      setError("Please select a resume, target role, and timeframe.")
      return
    }
    
    if (roadmapData) {
      const completed = roadmapData.milestones?.reduce((acc: number, m: any) => acc + (m.tasks?.filter((t: any) => t.completed).length || 0), 0) || 0
      if (completed > 0) {
        const confirmStr = `Generate a new roadmap?\nYour current roadmap has ${completed} completed tasks. Creating a new roadmap will start a new progress plan.`
        if (!window.confirm(confirmStr)) return
      }
    }
    
    setIsGenerating(true)
    setError("")
    setRoadmapData(null)
    
    try {
      const auth = getAuth()
      const user = auth.currentUser
      if (!user) throw new Error("Unauthenticated")
      const token = await user.getIdToken()
      
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/resume/${selectedResumeId}/roadmap`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          target_role: targetRole,
          timeframe: timeframe
        })
      })
      
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || "Failed to generate roadmap")
      }
      
      setRoadmapData(data.data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleTaskToggle = async (milestoneId: string, taskId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus
    
    // Optimistic UI update
    setRoadmapData((prev: any) => {
      const newData = { ...prev }
      const ms = newData.milestones?.find((m: any) => m.milestone_id === milestoneId)
      if (ms && ms.tasks) {
        const ts = ms.tasks.find((t: any) => t.task_id === taskId)
        if (ts) ts.completed = newStatus
      }
      return newData
    })

    try {
      const auth = getAuth()
      const user = auth.currentUser
      if (!user) throw new Error("Unauthenticated")
      const token = await user.getIdToken()
      
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/resume/${selectedResumeId}/roadmap/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ completed: newStatus })
      })
      
      if (!res.ok) throw new Error("Failed to save progress")
    } catch (err) {
      alert("Failed to save progress. Please try again.")
      // Rollback
      setRoadmapData((prev: any) => {
        const newData = { ...prev }
        const ms = newData.milestones?.find((m: any) => m.milestone_id === milestoneId)
        if (ms && ms.tasks) {
          const ts = ms.tasks.find((t: any) => t.task_id === taskId)
          if (ts) ts.completed = currentStatus
        }
        return newData
      })
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
            <span className="text-indigo-600 dark:text-indigo-400"><Map className="w-8 h-8" /></span>
             Career Roadmap Generator
          </h1>
          <p className="text-muted-foreground mt-1">
            Map out your personalized path to your dream role based on your current skills.
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
                  <Target className="w-4 h-4 text-indigo-500" /> Target Role
                </label>
                <input
                  type="text"
                  placeholder="e.g. Senior Frontend Engineer"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full text-sm font-medium rounded-xl border border-slate-200 dark:border-[#24334A] bg-slate-50 dark:bg-[#101B2D] text-slate-900 dark:text-slate-100 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-500" /> Timeframe
                </label>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="w-full text-sm font-medium rounded-xl border border-slate-200 dark:border-[#24334A] bg-slate-50 dark:bg-[#101B2D] text-slate-900 dark:text-slate-100 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer"
                >
                  <option value="3 months">3 Months (Aggressive)</option>
                  <option value="6 months">6 Months (Balanced)</option>
                  <option value="12 months">12 Months (Comprehensive)</option>
                </select>
              </div>

              <button
                onClick={handleGenerateRoadmap}
                disabled={isGenerating || !selectedResumeId || !targetRole.trim()}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl shadow-[0_4px_14px_rgba(79,70,229,0.3)] transition-all flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Zap className="w-4 h-4 animate-pulse" /> Architecting path...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Generate Roadmap
                  </>
                )}
              </button>
            </div>
          </Card>

          {/* Main Visualizer Area */}
          <div className="flex-grow min-h-[600px]">
            {!roadmapData && !isGenerating ? (
              <div className="w-full h-full rounded-2xl border border-slate-200 dark:border-[#24334A] bg-white dark:bg-[#101A2E] p-6 flex flex-col items-center justify-center text-center shadow-sm dark:shadow-none transition-all hover:bg-slate-50/50 dark:hover:bg-[#1A263D]">
                <Map className="w-12 h-12 mb-4 opacity-20 text-indigo-500 dark:text-slate-400" />
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Configure your Journey</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-[400px] text-[15px] leading-relaxed font-medium">
                  We'll analyze your current baseline and architect a step-by-step structural progression to cross the gap into your target role.
                </p>
              </div>
            ) : isGenerating ? (
              <div className="w-full h-full rounded-2xl border border-slate-200 dark:border-[#24334A] bg-white dark:bg-[#101A2E] p-6 flex flex-col items-center justify-center text-center shadow-sm dark:shadow-none animate-pulse">
                <Zap className="w-12 h-12 mb-4 text-indigo-500" />
                <h3 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">Mapping Contextual Gaps</h3>
                <p className="text-slate-500 dark:text-slate-400 text-[15px] font-medium max-w-sm">
                  Calculating bridging metrics between your resume and market {targetRole} standards...
                </p>
              </div>
            ) : (
              <div className="w-full h-full rounded-2xl border border-slate-200 dark:border-[#24334A] bg-white dark:bg-[#101A2E] p-6 lg:p-8 shadow-sm dark:shadow-none overflow-y-auto">
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Skill Gaps Overview */}
                  <div className="mb-10">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                       Primary Skill Gaps
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {roadmapData.skill_gaps?.map((gap: any, i: number) => (
                        <div key={i} className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/50 rounded-lg text-sm font-semibold flex items-center gap-1.5">
                          <Target className="w-3.5 h-3.5" />
                          {gap.skill || gap}
                        </div>
                      ))}
                      {(!roadmapData.skill_gaps || roadmapData.skill_gaps.length === 0) && (
                        <div className="text-slate-500 dark:text-slate-400 text-sm font-medium italic">
                          No major hard-skill gaps detected. Focused on portfolio depth instead.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-200 dark:before:bg-[#24334A]">
                    {roadmapData.milestones?.map((milestone: any, index: number) => (
                      <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-[#101A2E] bg-indigo-500 dark:bg-indigo-600 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute left-0 md:left-1/2 -ml-5 md:ml-0 z-10">
                          {index + 1}
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-50 dark:bg-[#142038] border border-slate-200 dark:border-[#24334A] p-5 rounded-xl ml-16 md:ml-0 shadow-sm transition-all hover:shadow-md">
                          <div className="flex flex-col gap-1 mb-4">
                            <span className="text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">{milestone.phase}</span>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{milestone.focus}</h3>
                          </div>
                          
                          <div className="space-y-4">
                            <div>
                               <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Tasks</h4>
                               <ul className="space-y-1.5">
                                 {milestone.tasks?.map((task: any, i: number) => (
                                   <li 
                                     key={task.task_id || i} 
                                     onClick={() => handleTaskToggle(milestone.milestone_id, task.task_id, task.completed)}
                                     className={`flex items-start gap-2 text-sm cursor-pointer transition-all ${task.completed ? 'text-slate-400 dark:text-slate-500 line-through opacity-75' : 'text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400'}`}
                                   >
                                     {task.completed ? (
                                       <CheckSquare className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                     ) : (
                                       <Square className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                     )}
                                     <span>{task.description}</span>
                                   </li>
                                 ))}
                                 {/* Fallback for older roadmaps without trackable tasks structure */}
                                 {(!milestone.tasks && milestone.actions) && milestone.actions.map((act: string, i: number) => (
                                   <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                                     <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                     <span>{act}</span>
                                   </li>
                                 ))}
                               </ul>
                            </div>
                            
                            {milestone.resources && milestone.resources.length > 0 && (
                                <div>
                                   <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Resources & Target Concepts</h4>
                                   <div className="flex flex-wrap gap-1.5">
                                     {milestone.resources.map((res: string, i: number) => (
                                       <span key={i} className="px-2.5 py-1 bg-white dark:bg-[#101A2E] border border-slate-300 dark:border-[#24334A] text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-md shadow-sm">
                                         {res}
                                       </span>
                                     ))}
                                   </div>
                                </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
