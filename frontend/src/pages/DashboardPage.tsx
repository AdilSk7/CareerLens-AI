import { useAuth } from "../contexts/AuthContext"
import { ResumeManager } from "../components/ResumeManager"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Briefcase, Calendar, CheckCircle2, FileText, Sparkles, Map, FolderGit2, BarChart } from "lucide-react"
import { Link } from "react-router-dom"
import { useResumes } from "../hooks/useResumes"
import { useInterviews } from "../hooks/useInterviews"
import { useApplications } from "../hooks/useApplications"

export function DashboardPage() {
  const { userProfile } = useAuth()
  const { resumes } = useResumes()
  const { sessions } = useInterviews()
  const { applications } = useApplications()
  
  const analyzedResumes = resumes.filter(r => r.analysis && r.analysis.overall_score)
  const avgAtsScore = analyzedResumes.length > 0
    ? (analyzedResumes.reduce((acc, r) => acc + (r.analysis!.overall_score || 0), 0) / analyzedResumes.length).toFixed(1)
    : "—"

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div className="relative isolate">
          <h1 className="text-3xl font-bold tracking-tight text-[#0F172A] dark:text-foreground relative">Dashboard 👋</h1>
          <p className="text-[#64748B] dark:text-muted-foreground mt-1 font-medium text-[15px]">
            Welcome back, {userProfile?.name || "User"}
          </p>
        </div>
        <Link 
          to="/dashboard/cover-letter" 
          className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-[linear-gradient(135deg,#4F46E5,#6366F1)] hover:brightness-110 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-[0_8px_20px_rgba(79,70,229,0.22)] dark:shadow-md hover:-translate-y-[1px]"
        >
          <Sparkles className="w-4 h-4" /> Cover Letter
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <MetricCard title="Applications" value={applications.length.toString()} icon={<Briefcase className="h-4 w-4" />} gradientClass="bg-[linear-gradient(135deg,#EFF6FF,#F5F3FF)] dark:bg-none dark:bg-[#101A2E]" iconClass="text-blue-600 bg-blue-100/80 dark:bg-[#111D32] dark:text-muted-foreground" />
        <MetricCard title="Interviews" value={sessions.length.toString()} icon={<Calendar className="h-4 w-4" />} gradientClass="bg-[linear-gradient(135deg,#ECFDF5,#E0F2FE)] dark:bg-none dark:bg-[#101A2E]" iconClass="text-emerald-600 bg-emerald-100/80 dark:bg-[#111D32] dark:text-muted-foreground" />
        <MetricCard title="Average ATS Score" value={avgAtsScore !== "—" ? `${avgAtsScore}%` : "—"} icon={<CheckCircle2 className="h-4 w-4" />} gradientClass="bg-[linear-gradient(135deg,#FFF7ED,#FEF3C7)] dark:bg-none dark:bg-[#101A2E]" iconClass="text-amber-600 bg-amber-100/80 dark:bg-[#111D32] dark:text-muted-foreground" />
        <MetricCard title="Total Resumes" value={resumes.length.toString()} icon={<FileText className="h-4 w-4" />} gradientClass="bg-[linear-gradient(135deg,#F5F3FF,#FAF5FF)] dark:bg-none dark:bg-[#101A2E]" iconClass="text-purple-600 bg-purple-100/80 dark:bg-[#111D32] dark:text-muted-foreground" />
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Link 
          to="/dashboard/cover-letter" 
          className="flex items-center gap-4 bg-white/80 dark:bg-[#101A2E] backdrop-blur-[10px] dark:backdrop-blur-none border border-[#DCE5F5] dark:border-transparent p-5 rounded-2xl shadow-[0_10px_35px_rgba(79,70,229,0.04)] dark:shadow-none hover:shadow-[0_10px_40px_rgba(79,70,229,0.1)] transition-all group"
        >
          <div className="p-3 bg-indigo-100/80 dark:bg-[#111D32] text-indigo-600 dark:text-indigo-400 rounded-xl group-hover:scale-110 transition-transform">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-[#0F172A] dark:text-slate-100">Cover Letter</h3>
            <p className="text-sm text-[#64748B] dark:text-slate-400 font-medium mt-0.5">Generate tailored pitches</p>
          </div>
        </Link>
        <Link 
          to="/dashboard/roadmap" 
          className="flex items-center gap-4 bg-white/80 dark:bg-[#101A2E] backdrop-blur-[10px] dark:backdrop-blur-none border border-[#DCE5F5] dark:border-transparent p-5 rounded-2xl shadow-[0_10px_35px_rgba(79,70,229,0.04)] dark:shadow-none hover:shadow-[0_10px_40px_rgba(79,70,229,0.1)] transition-all group"
        >
          <div className="p-3 bg-emerald-100/80 dark:bg-[#111D32] text-emerald-600 dark:text-emerald-400 rounded-xl group-hover:scale-110 transition-transform">
            <Map className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-[#0F172A] dark:text-slate-100">Career Roadmap</h3>
            <p className="text-sm text-[#64748B] dark:text-slate-400 font-medium mt-0.5">Map skill milestones</p>
          </div>
        </Link>
        <Link 
          to="/dashboard/projects" 
          className="flex items-center gap-4 bg-white/80 dark:bg-[#101A2E] backdrop-blur-[10px] dark:backdrop-blur-none border border-[#DCE5F5] dark:border-transparent p-5 rounded-2xl shadow-[0_10px_35px_rgba(79,70,229,0.04)] dark:shadow-none hover:shadow-[0_10px_40px_rgba(79,70,229,0.1)] transition-all group"
        >
          <div className="p-3 bg-amber-100/80 dark:bg-[#111D32] text-amber-600 dark:text-amber-400 rounded-xl group-hover:scale-110 transition-transform">
            <FolderGit2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-[#0F172A] dark:text-slate-100">Portfolio Architect</h3>
            <p className="text-sm text-[#64748B] dark:text-slate-400 font-medium mt-0.5">Discover target projects</p>
          </div>
        </Link>
        <Link 
          to="/dashboard/applications" 
          className="flex items-center gap-4 bg-white/80 dark:bg-[#101A2E] backdrop-blur-[10px] dark:backdrop-blur-none border border-[#DCE5F5] dark:border-transparent p-5 rounded-2xl shadow-[0_10px_35px_rgba(79,70,229,0.04)] dark:shadow-none hover:shadow-[0_10px_40px_rgba(79,70,229,0.1)] transition-all group"
        >
          <div className="p-3 bg-blue-100/80 dark:bg-[#111D32] text-blue-600 dark:text-blue-400 rounded-xl group-hover:scale-110 transition-transform">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-[#0F172A] dark:text-slate-100">Job Applications</h3>
            <p className="text-sm text-[#64748B] dark:text-slate-400 font-medium mt-0.5">Track and tailer resumes</p>
          </div>
        </Link>
        <Link 
          to="/dashboard/analytics" 
          className="flex items-center gap-4 bg-white/80 dark:bg-[#101A2E] backdrop-blur-[10px] dark:backdrop-blur-none border border-[#DCE5F5] dark:border-transparent p-5 rounded-2xl shadow-[0_10px_35px_rgba(79,70,229,0.04)] dark:shadow-none hover:shadow-[0_10px_40px_rgba(79,70,229,0.1)] transition-all group"
        >
          <div className="p-3 bg-indigo-100/80 dark:bg-[#111D32] text-indigo-600 dark:text-indigo-400 rounded-xl group-hover:scale-110 transition-transform">
            <BarChart className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-[#0F172A] dark:text-slate-100">Analytics Insights</h3>
            <p className="text-sm text-[#64748B] dark:text-slate-400 font-medium mt-0.5">Track your progress</p>
          </div>
        </Link>
      </div>

      <div className="w-full mt-8">
        <ResumeManager />
      </div>

      <div className="w-full mt-8">
        <Card className="bg-white/80 dark:bg-[#101A2E] dark:backdrop-blur-none backdrop-blur-[10px] border-[#DCE5F5] dark:border-transparent shadow-[0_10px_35px_rgba(79,70,229,0.06)] dark:shadow-none rounded-[20px] dark:rounded-2xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-[#0F172A] dark:text-white">Interview History</CardTitle>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">You haven't completed any mock interviews yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-[#475569] uppercase bg-[linear-gradient(90deg,#EEF2FF,#F5F3FF)] dark:bg-none dark:bg-[#111D32] dark:text-slate-200 relative z-10">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg">Date</th>
                      <th className="px-4 py-3">Mode</th>
                      <th className="px-4 py-3">Questions</th>
                      <th className="px-4 py-3 rounded-tr-lg">Avg Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.slice().sort((a, b) => {
                      const timeA = (a.completedAt as any)?.toMillis ? (a.completedAt as any).toMillis() : 0;
                      const timeB = (b.completedAt as any)?.toMillis ? (b.completedAt as any).toMillis() : 0;
                      return timeB - timeA;
                    }).map(session => {
                      const dateObj = (session.completedAt as any)?.toDate ? (session.completedAt as any).toDate() : new Date();
                      return (
                        <tr key={session.id} className="bg-white/60 dark:bg-[#142038] border-b border-[#DDE5F2] dark:border-[#24334A] last:border-0 hover:bg-[#EEF2FF]/50 dark:hover:bg-[#1A263D] transition-colors">
                          <td className="px-4 py-4 font-medium text-[#0F172A] dark:text-white">{dateObj.toLocaleDateString()} {dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                          <td className="px-4 py-4 font-semibold text-indigo-600 dark:text-blue-400">
                             <span className="bg-indigo-50 dark:bg-indigo-900/40 px-2 py-0.5 rounded-md">{session.mode || "Technical"}</span>
                          </td>
                          <td className="px-4 py-4 text-[#64748B] dark:text-slate-400">{session.questionsAnswered || 0}</td>
                          <td className="px-4 py-4 font-bold">
                            <span className={session.averageScore >= 8 ? "text-green-600 dark:text-green-500" : session.averageScore >= 6 ? "text-amber-600 dark:text-amber-500" : "text-red-600 dark:text-red-500"}>
                              {session.averageScore?.toFixed(1) || "0.0"}/10
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MetricCard({ title, value, icon, gradientClass, iconClass }: { title: string, value: string, icon: React.ReactNode, gradientClass?: string, iconClass?: string }) {
  return (
    <Card className={`border-slate-200/60 dark:border-transparent shadow-[0_4px_16px_rgba(15,23,42,0.04)] dark:shadow-none rounded-2xl hover:shadow-md dark:hover:shadow-none transition-all hover:-translate-y-[1px] relative overflow-hidden ${gradientClass || 'bg-white dark:bg-[#101A2E]'}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-sm font-semibold text-slate-600 dark:text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-full ${iconClass ? iconClass : 'bg-indigo-50 dark:bg-slate-800/50 text-indigo-600 dark:text-muted-foreground'}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="text-3xl font-bold text-[#0F172A] dark:text-white">{value}</div>
      </CardContent>
    </Card>
  )
}
