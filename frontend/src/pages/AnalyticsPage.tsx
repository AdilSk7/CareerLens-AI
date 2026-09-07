import React, { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { Card } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from "recharts"
import { BarChart, Activity, Target, Briefcase, GraduationCap, ArrowRight, Loader2, BrainCircuit, AlertCircle, XCircle } from "lucide-react"

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 m-6 bg-red-50 border border-red-200 rounded-xl text-red-600">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5" />
            <h2 className="font-bold">Analytics Render Error</h2>
          </div>
          <p className="text-sm mb-4">An error occurred while compiling your analytics data for display.</p>
          <pre className="text-xs bg-red-100 p-3 rounded-md overflow-x-auto whitespace-pre-wrap font-mono">
            {this.state.error?.toString()}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function AnalyticsPageContent() {
  const { currentUser } = useAuth()
  const [loading, setLoading] = useState(true)
  
  const [overview, setOverview] = useState<any>(null)
  const [progress, setProgress] = useState<any>(null)
  const [insights, setInsights] = useState<any>(null)
  const [insightsLoading, setInsightsLoading] = useState(false)

  useEffect(() => {
    if (!currentUser) return
    loadData()
  }, [currentUser])

  async function loadData() {
    try {
      setLoading(true)
      const token = await currentUser?.getIdToken()
      
      const [resOverview, resProgress] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/analytics/overview`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/analytics/progress`, { headers: { Authorization: `Bearer ${token}` } })
      ])
      
      const dataOverview = await resOverview.json()
      const dataProgress = await resProgress.json()
      
      setOverview(dataOverview.data)
      setProgress(dataProgress.data)
      
      // Load AI Insights in background
      loadInsights(dataOverview.data)
      
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }
  
  async function loadInsights(metrics: any) {
    if (!currentUser) return
    try {
      setInsightsLoading(true)
      const token = await currentUser.getIdToken()
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/analytics/ai-insights`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ metrics })
      })
      const data = await res.json()
      setInsights(data.data)
    } catch (e) {
      console.error(e)
    } finally {
      setInsightsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-6xl p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl">
          <BarChart className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Career Analytics</h1>
          <p className="text-slate-500 dark:text-slate-400">Track your progress, pinpoint skill gaps, and optimize your job hunt.</p>
        </div>
      </div>
      
      {/* 1. KEY METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-12 relative">
        <Card className="p-6 bg-white dark:bg-[#101A2E] border-slate-200 dark:border-[#24334A] rounded-2xl shadow-sm hover:shadow-md transition-shadow relative">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">Applications</h3>
            <Briefcase className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-slate-100 mb-6">
            {overview?.applications || 0}
          </div>
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-4 border-white dark:border-[#0A1120] z-10 md:-right-4 md:bottom-1/2 md:translate-y-1/2 md:translate-x-0 md:left-auto text-slate-400 font-black">
             <ArrowRight className="w-4 h-4 hidden md:block" />
             <ArrowRight className="w-4 h-4 md:hidden" style={{transform: "rotate(90deg)"}}/>
          </div>
        </Card>
        
        <Card className="p-6 bg-white dark:bg-[#101A2E] border-slate-200 dark:border-[#24334A] rounded-2xl shadow-sm hover:shadow-md transition-shadow relative">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">Job Interviews</h3>
            <Target className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-end gap-2 mb-6">
            <div className="text-3xl font-black text-slate-900 dark:text-slate-100">
              {overview?.jobInterviews || 0}
            </div>
            <div className="text-sm font-medium text-emerald-500 mb-1">
              {overview?.appToInterviewConversion}
            </div>
          </div>
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-4 border-white dark:border-[#0A1120] z-10 md:-right-4 md:bottom-1/2 md:translate-y-1/2 md:translate-x-0 md:left-auto text-slate-400 font-black">
             <ArrowRight className="w-4 h-4 hidden md:block" />
             <ArrowRight className="w-4 h-4 md:hidden" style={{transform: "rotate(90deg)"}}/>
          </div>
        </Card>
        
        <Card className="p-6 bg-white dark:bg-[#101A2E] border-slate-200 dark:border-[#24334A] rounded-2xl shadow-sm hover:shadow-md transition-shadow relative">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">Offers</h3>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-end gap-2 mb-6">
            <div className="text-3xl font-black text-slate-900 dark:text-slate-100">
              {overview?.offers || 0}
            </div>
            <div className="text-sm font-medium text-emerald-500 mb-1">
              {overview?.interviewToOfferConversion}
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white dark:bg-[#101A2E] border-slate-200 dark:border-[#24334A] rounded-2xl shadow-sm hover:shadow-md transition-shadow relative">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">Rejections</h3>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-end gap-2 mb-6">
            <div className="text-3xl font-black text-slate-900 dark:text-slate-100">
              {overview?.rejections || 0}
            </div>
          </div>
        </Card>

        {/* MOCK INTERVIEW STATS */}
        <Card className="p-6 bg-indigo-50/50 dark:bg-[#101A2E] border-indigo-100 dark:border-indigo-900/30 rounded-2xl shadow-sm hover:shadow-md transition-shadow lg:ml-4 relative before:hidden lg:before:block before:absolute before:-left-4 before:top-1/2 before:-translate-y-1/2 before:w-[2px] before:h-2/3 before:bg-indigo-100 dark:before:bg-indigo-900/40">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">Avg Mock Score</h3>
            <GraduationCap className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-slate-100 mt-2">
            {overview?.averageMockScore !== "N/A" ? `${overview?.averageMockScore}/10` : "N/A"}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">{overview?.mockSessions || 0} Mock Sessions</div>
        </Card>
      </div>

      {/* 2. CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* ATS Score Chart */}
        <Card className="p-6 bg-white dark:bg-[#101A2E] border-slate-200 dark:border-[#24334A] rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">ATS Score Progression</h3>
            {progress?.atsProgress?.length === 1 ? (
              <span className="text-xs font-bold px-3 py-1 rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                First recorded score
              </span>
            ) : progress?.atsImprovement !== undefined && progress?.atsImprovement !== null ? (
              <span className={`text-xs font-bold px-3 py-1 rounded-md ${progress.atsImprovement >= 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                {progress.atsImprovement > 0 ? "+" : ""}{progress.atsImprovement}% from last
              </span>
            ) : null}
          </div>
          
          {Array.isArray(progress?.atsProgress) && progress.atsProgress.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={progress.atsProgress} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                    itemStyle={{ color: '#818cf8' }}
                  />
                  <Area type="monotone" dataKey="atsScore" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorAts)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center opacity-60">
              <BarChart className="w-10 h-10 text-slate-400 mb-2" />
              <p className="text-slate-500 dark:text-slate-400 text-sm">No ATS score history available yet.</p>
            </div>
          )}
        </Card>

        {/* Interview Chart */}
        <Card className="p-6 bg-white dark:bg-[#101A2E] border-slate-200 dark:border-[#24334A] rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6">Interview Performance</h3>
          
          {Array.isArray(progress?.interviewProgress) && progress.interviewProgress.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progress.interviewProgress} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} domain={[0, 10]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                    itemStyle={{ color: '#34d399' }}
                  />
                  <Line type="monotone" dataKey="score" stroke="#34d399" strokeWidth={3} dot={{ r: 4, fill: '#34d399', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center opacity-60">
              <Target className="w-10 h-10 text-slate-400 mb-2" />
              <p className="text-slate-500 dark:text-slate-400 text-sm">Complete a mock interview to track interview performance.</p>
            </div>
          )}
        </Card>

      </div>

      {/* 3. SKILL GAPS & AI INSIGHTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <Card className="lg:col-span-1 p-6 bg-white dark:bg-[#101A2E] border-slate-200 dark:border-[#24334A] rounded-2xl shadow-sm flex flex-col h-full overflow-hidden">
          <div className="flex justify-between items-start mb-6 shrink-0">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Skill Gap Progress</h3>
              <p className="text-xs text-slate-500 font-medium">Target: <span className="text-indigo-600 dark:text-indigo-400">{typeof progress?.targetRole === "string" ? progress.targetRole : (progress?.targetRole ? String(progress.targetRole) : "None")}</span></p>
            </div>
          </div>
          
          {Array.isArray(progress?.skillGaps) && progress.skillGaps.length > 0 ? (
            <div className="space-y-5 overflow-y-auto pr-2 custom-scrollbar flex-1 mb-8">
              {progress.skillGaps.map((skill: any, i: number) => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="flex justify-between items-end text-sm">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate pr-2">{typeof skill.name === 'string' ? skill.name : String(skill.name)}</span>
                    <span className={`text-xs font-bold whitespace-nowrap ${
                      skill.progress === 100 ? "text-emerald-500" :
                      skill.progress !== null ? "text-amber-500" : "text-indigo-400 dark:text-indigo-300"
                    }`}>
                      {skill.status}
                    </span>
                  </div>
                  {skill.progress !== null && (
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shrink-0">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          skill.progress === 100 ? "bg-emerald-500" :
                          skill.progress > 20 ? "bg-amber-400" : "bg-rose-500"
                        }`}
                        style={{ width: `${skill.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60 mb-8 py-8">
              <BarChart className="w-10 h-10 text-slate-400 mb-2" />
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                {progress?.targetRole && progress?.targetRole !== "Unknown Role" 
                  ? "Generate a career roadmap to analyze your skill gaps." 
                  : "Select a target role to track skill gaps."}
              </p>
            </div>
          )}

          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 shrink-0">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 uppercase tracking-wider">Roadmap Progress</h3>
            {progress?.roadmapProgress ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-slate-600 dark:text-slate-400">{progress.roadmapProgress.completed} / {progress.roadmapProgress.total} tasks completed</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">{progress.roadmapProgress.percentage}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shrink-0">
                      <div 
                        className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                        style={{ width: `${progress.roadmapProgress.percentage}%` }}
                      />
                  </div>
                </div>
                {progress.roadmapProgress.months && progress.roadmapProgress.months.length > 0 && (
                  <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/50">
                    {progress.roadmapProgress.months.map((m: any, i: number) => (
                      <div key={i} className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400 font-medium font-mono">
                        <span className="w-20 truncate">{m.name}</span>
                        <span className="flex-1 text-center opacity-80">{m.completed} / {m.total} completed</span>
                        <span className="w-12 text-right opacity-80">{m.percentage}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic font-medium">Generate a career roadmap to track your learning progress.</p>
            )}
          </div>
        </Card>

        <Card className="lg:col-span-2 p-6 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-[#111A30] dark:to-[#0D1525] border-indigo-100 dark:border-[#24334A] rounded-2xl shadow-sm flex flex-col h-full relative overflow-hidden">
          {/* Subtle decoration */}
          <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-[0.03] pointer-events-none">
            <BrainCircuit className="w-64 h-64 text-indigo-900" />
          </div>
          
          <div className="relative z-10 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-6 shrink-0">
              <BrainCircuit className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">AI Career Insights</h3>
            </div>
            
            {insightsLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center min-h-[160px]">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">
                  Synthesizing your career data...
                </p>
              </div>
            ) : insights ? (
              <div className="space-y-6 flex-1">
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  {typeof insights.insight === 'object' ? JSON.stringify(insights.insight) : String(insights.insight)}
                </p>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider mb-4 border-t border-indigo-100 dark:border-[#24334A] pt-4">Recommended Next Actions</h4>
                  <ul className="space-y-3">
                    {Array.isArray(insights.next_actions) ? insights.next_actions.map((action: string, i: number) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="mt-0.5 w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0 shadow-sm">
                          <ArrowRight className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{typeof action === 'object' ? JSON.stringify(action) : String(action)}</span>
                      </li>
                    )) : (
                      <li className="flex items-start gap-3">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {typeof insights.next_actions === 'string' ? insights.next_actions : "No actions recommended yet."}
                        </span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60 min-h-[160px]">
                <p className="text-slate-500 dark:text-slate-400 text-sm">Upload more data to unlock customized AI insights.</p>
              </div>
            )}
          </div>
        </Card>

      </div>
    </div>
  )
}

export function AnalyticsPage() {
  return (
    <ErrorBoundary>
      <AnalyticsPageContent />
    </ErrorBoundary>
  )
}
