import React, { useState } from "react"
import { CheckCircle2, AlertTriangle, Briefcase, Loader2, Target, XCircle } from "lucide-react"
import { auth } from "../lib/firebase"
import { InterviewPrep } from "./InterviewPrep"
import { CoverLetterGenerator } from "./CoverLetterGenerator"
import { JobDescriptionInput } from "./JobDescriptionInput"

export interface EducationItem {
  degree: string
  institution: string
  year: string
}

export interface WorkExperienceItem {
  role: string
  company: string
  duration: string
  responsibilities: string[]
}

export interface ProjectItem {
  name: string
  description: string
  technologies: string[]
}

export interface ExtracurricularItem {
  role: string
  organization: string
  duration: string
  description: string[]
}

export interface CategoryScores {
  skills_score: number
  experience_score: number
  education_score: number
  projects_score: number
  keywords_score: number
  formatting_score: number
}

export interface JobMatchAnalysis {
  match_percentage: number
  required_skills: string[]
  exact_matches: string[]
  related_matches: string[]
  missing_skills: string[]
  recommendations: string[]
}

export interface ResumeAnalysis {
  professional_summary: string
  technical_skills: string[]
  soft_skills: string[]
  programming_languages: string[]
  web_technologies: string[]
  frameworks: string[]
  tools: string[]
  ai_ml_technologies: string[]
  certifications: string[]
  education: EducationItem[]
  work_experience: WorkExperienceItem[]
  extracurricular_activities: ExtracurricularItem[]
  projects: ProjectItem[]
  strengths: string[]
  areas_for_improvement: string[]
  suggested_job_roles: string[]
  category_scores: CategoryScores
  overall_score: number
}

interface ResumeAnalysisViewerProps {
  analysis: ResumeAnalysis
  resumeId: string
}

export const Badge = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${className}`}>
    {children}
  </span>
)

export const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={`rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm ${className}`}>{children}</div>
)

export function ResumeAnalysisViewer({ analysis, resumeId }: ResumeAnalysisViewerProps) {
  const [activeTab, setActiveTab] = useState<"skills" | "experience" | "feedback" | "jobmatch" | "interview" | "coverletter">("skills")
  
  // Job Match State
  const [jdText, setJdText] = useState("")
  const [isMatching, setIsMatching] = useState(false)
  const [matchResult, setMatchResult] = useState<JobMatchAnalysis | null>(null)
  const [matchError, setMatchError] = useState("")

  async function handleJobMatch() {
    if (!jdText.trim() || !resumeId) return
    setIsMatching(true)
    setMatchError("")
    
    try {
      const token = await auth.currentUser?.getIdToken()
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/resume/${resumeId}/match`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ job_description: jdText })
      })
      
      const json = await response.json()
      if (!response.ok) throw new Error(json.detail || "Match analysis failed")
      
      setMatchResult(json.data)
    } catch (err: any) {
      console.error(err)
      setMatchError(err.message || "An error occurred during job matching.")
    } finally {
      setIsMatching(false)
    }
  }
  
  // Helpers
  const safeList = (list: any): any[] => Array.isArray(list) ? list : []
  
  const getUniqueTechnicalSkills = () => {
    const allSpecificSkills = new Set([
      ...safeList(analysis.programming_languages).map(s => s.toLowerCase()),
      ...safeList(analysis.web_technologies).map(s => s.toLowerCase()),
      ...safeList(analysis.frameworks).map(s => s.toLowerCase()),
      ...safeList(analysis.tools).map(s => s.toLowerCase()),
      ...safeList(analysis.ai_ml_technologies).map(s => s.toLowerCase())
    ]);
    
    return safeList(analysis.technical_skills).filter(skill => !allSpecificSkills.has(skill.toLowerCase()));
  }
  
  const getScoreColor = (score: number | null | undefined) => {
    if (score === null || score === undefined || score === 0) return "text-slate-400 bg-slate-50 border-slate-200"
    if (score >= 80) return "text-green-600 bg-green-50 border-green-200"
    if (score >= 60) return "text-blue-600 bg-blue-50 border-blue-200"
    return "text-amber-600 bg-amber-50 border-amber-200"
  }

  const getScoreText = (score: number | null | undefined) => {
    if (!score) return "N/A"
    if (score >= 80) return "Excellent match"
    if (score >= 60) return "Good match"
    return "Needs improvement"
  }


  return (
    <div className="w-full">
      {/* Tabs */}
      <div className="sticky top-4 z-20 flex p-1.5 space-x-1 sm:space-x-2 bg-slate-100 dark:bg-slate-800/50 rounded-xl mb-8 flex-wrap md:flex-nowrap border border-slate-200 dark:border-slate-700 max-w-[900px] shadow-sm backdrop-blur-sm">
        {["skills", "experience", "feedback", "jobmatch", "coverletter", "interview"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`w-full rounded-lg py-3 text-sm font-bold tracking-wide leading-5 transition-all outline-none ${
              activeTab === tab
                ? "bg-white dark:bg-slate-700 shadow text-blue-700 dark:text-blue-300"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/50 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            {tab === "skills" ? "Skills" : tab === "experience" ? "Experience" : tab === "feedback" ? "Feedback" : tab === "jobmatch" ? "Job Match" : tab === "coverletter" ? "Cover Letter" : "Mock Interview"}
          </button>
        ))}
      </div>
      
      {/* SKILLS TAB */}
      {activeTab === "skills" && (
        <div className="grid grid-cols-1 lg:grid-cols-[7fr_3fr] gap-8 animate-in fade-in">
          {/* L: 70% */}
          <div className="space-y-6">
            <Card className="p-8">
              <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-6">Technical Skills</h3>
              
              <div className="space-y-6">
                {getUniqueTechnicalSkills().length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Overall / Concepts</h4>
                    <div className="flex flex-wrap gap-2.5">
                      {getUniqueTechnicalSkills().map((skill, i) => (
                        <Badge key={i} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-100 transition-colors">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {safeList(analysis.programming_languages).length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Programming Languages</h4>
                    <div className="flex flex-wrap gap-2.5">
                      {safeList(analysis.programming_languages).map((skill, i) => (
                        <Badge key={i} className="bg-blue-50 text-blue-700 border border-blue-100">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {safeList(analysis.web_technologies).length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Web Technologies</h4>
                    <div className="flex flex-wrap gap-2.5">
                      {safeList(analysis.web_technologies).map((skill, i) => (
                        <Badge key={i} className="bg-indigo-50 text-indigo-700 border border-indigo-100">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {safeList(analysis.frameworks).length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Frameworks</h4>
                    <div className="flex flex-wrap gap-2.5">
                      {safeList(analysis.frameworks).map((skill, i) => (
                        <Badge key={i} className="bg-purple-50 text-purple-700 border border-purple-100">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {safeList(analysis.tools).length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Tools</h4>
                    <div className="flex flex-wrap gap-2.5">
                      {safeList(analysis.tools).map((skill, i) => (
                        <Badge key={i} className="bg-amber-50 text-amber-700 border border-amber-100">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {safeList(analysis.ai_ml_technologies).length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">AI / ML</h4>
                    <div className="flex flex-wrap gap-2.5">
                      {safeList(analysis.ai_ml_technologies).map((skill, i) => (
                        <Badge key={i} className="bg-emerald-50 text-emerald-700 border border-emerald-100">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {(safeList(analysis.soft_skills).length > 0 || safeList(analysis.certifications).length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {safeList(analysis.soft_skills).length > 0 && (
                  <Card className="p-8">
                    <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-6">Soft Skills</h3>
                    <div className="flex flex-wrap gap-2.5">
                      {safeList(analysis.soft_skills).map((skill, i) => (
                        <Badge key={i} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">{skill}</Badge>
                      ))}
                    </div>
                  </Card>
                )}
                
                {safeList(analysis.certifications).length > 0 && (
                  <Card className="p-8 border-indigo-100 dark:border-indigo-900/50">
                    <h3 className="text-sm font-bold text-indigo-700 dark:text-indigo-400 mb-6">Certifications & Awards</h3>
                    <div className="flex flex-col gap-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                      {safeList(analysis.certifications).map((cert, i) => (
                        <div key={i} className="flex gap-2 items-start"><span className="text-indigo-500 mt-1">•</span><span className="leading-snug">{cert}</span></div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            )}
          </div>

          {/* R: 30% */}
          <div className="space-y-6">
             <Card className="p-6 bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center justify-center border-slate-200 dark:border-slate-800 text-center">
               <span className={`text-5xl font-black block ${getScoreColor(analysis.overall_score).split(' ')[0]}`}>
                 {analysis.overall_score || 0}<span className="text-2xl font-bold ml-1">%</span>
               </span>
               <span className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest block mt-3 mb-1">ATS Match</span>
               <span className={`text-xs font-bold px-3 py-1 mt-1 rounded-full ${getScoreColor(analysis.overall_score).split(' ')[1] || 'bg-slate-100'} ${getScoreColor(analysis.overall_score).split(' ')[0] || 'text-slate-600'} border ${getScoreColor(analysis.overall_score).split(' ')[2] || 'border-slate-200'}`}>
                 {getScoreText(analysis.overall_score)}
               </span>
             </Card>

             <Card className="p-6">
               <h3 className="text-xs font-black text-green-700 uppercase tracking-wider mb-4 border-b border-green-100 pb-2">Top Strengths</h3>
               <div className="flex flex-col gap-3">
                 {safeList(analysis.strengths).map((s, i) => (
                    <div key={i} className="text-sm font-medium text-slate-700 dark:text-slate-300 flex gap-2 items-start"><span className="text-green-500 mt-0.5">✓</span><span className="leading-snug">{s}</span></div>
                 ))}
               </div>
             </Card>

             <Card className="p-6">
               <h3 className="text-xs font-black text-amber-700 uppercase tracking-wider mb-4 border-b border-amber-100 pb-2">Skill Gaps</h3>
               <div className="flex flex-col gap-3">
                 {safeList(analysis.areas_for_improvement).map((s, i) => (
                    <div key={i} className="text-sm font-medium text-slate-700 dark:text-slate-300 flex gap-2 items-start"><span className="text-amber-500 mt-0.5">⚠</span><span className="leading-snug">{s}</span></div>
                 ))}
               </div>
             </Card>
          </div>
        </div>
      )}

      {/* EXPERIENCE TAB */}
      {activeTab === "experience" && (
        <div className="grid grid-cols-1 lg:grid-cols-[7fr_3fr] gap-8 animate-in fade-in">
          {/* L: 70% */}
          <div className="space-y-6">
             <h3 className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest pl-2">Work Experience</h3>
             {safeList(analysis.work_experience).length > 0 ? (
               <div className="space-y-4">
                 {analysis.work_experience.map((exp, i) => (
                   <Card key={i} className="p-6 border-slate-200 dark:border-slate-800 hover:border-blue-200 transition-colors">
                     <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                       <div>
                         <h4 className="font-bold text-lg text-slate-900 dark:text-slate-100">{exp.role}</h4>
                         <p className="text-blue-700 font-medium">{exp.company}</p>
                       </div>
                       <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 self-start">{exp.duration}</Badge>
                     </div>
                     <ul className="space-y-2.5 mt-4">
                       {safeList(exp.responsibilities).map((resp, idx) => (
                         <li key={idx} className="flex items-start gap-3 text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                           <span className="text-slate-400 mt-1 flex-shrink-0">•</span> {resp}
                         </li>
                       ))}
                     </ul>
                   </Card>
                 ))}
               </div>
             ) : (
               <Card className="p-8 text-[15px] text-slate-700 dark:text-slate-300 font-medium bg-slate-50 dark:bg-slate-900/50 border-dashed">
                 No professional experience listed on this resume. Projects and academic experience may be available in the Skills or Education sections.
               </Card>
             )}
             {/* PROJECTS */}
             {safeList(analysis.projects).length > 0 && (
               <div className="mt-10">
                 <h3 className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest pl-2 mb-4">Notable Projects</h3>
                 <div className="grid gap-4 md:grid-cols-2">
                   {safeList(analysis.projects).map((proj, i) => (
                     <Card key={i} className="p-6 border-slate-200 dark:border-slate-800 flex flex-col h-full">
                       <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-2">{proj.name}</h4>
                       <p className="text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed font-medium mb-4 flex-1">{proj.description}</p>
                       <div className="flex flex-wrap gap-1.5 mt-auto">
                         {safeList(proj.technologies).map((tech, idx) => (
                           <Badge key={idx} className="bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 text-[10px]">{tech}</Badge>
                         ))}
                       </div>
                     </Card>
                   ))}
                 </div>
               </div>
             )}
             
             {/* EXTRACURRICULARS */}
             {safeList(analysis.extracurricular_activities).length > 0 && (
               <div className="mt-10">
                 <h3 className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest pl-2 mb-4">Extracurriculars & Leadership</h3>
                 <div className="space-y-4">
                   {safeList(analysis.extracurricular_activities).map((extra, i) => (
                     <Card key={i} className="p-6 border-slate-200 dark:border-slate-800 border-l-4 border-l-indigo-500 dark:border-l-indigo-600">
                       <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-2">
                         <div>
                           <h4 className="font-bold text-slate-900 dark:text-slate-100">{extra.role}</h4>
                           <p className="text-indigo-700 dark:text-indigo-400 font-medium text-sm">{extra.organization}</p>
                         </div>
                         <Badge className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 self-start">{extra.duration}</Badge>
                       </div>
                       <ul className="space-y-2 mt-3">
                         {safeList(extra.description).map((desc, idx) => (
                           <li key={idx} className="flex items-start gap-3 text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                             <span className="text-slate-300 dark:text-slate-600 mt-0.5 flex-shrink-0">•</span> {desc}
                           </li>
                         ))}
                       </ul>
                     </Card>
                   ))}
                 </div>
               </div>
             )}

          </div>

          {/* R: 30% */}
          <div className="space-y-6">
             <Card className="p-6 bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center justify-center border-slate-200 dark:border-slate-800">
               <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest block mb-1">Experience Score</span>
               
               {analysis.category_scores?.experience_score > 0 ? (
                 <>
                   <span className={`text-4xl font-black ${getScoreColor(analysis.category_scores.experience_score).split(' ')[0]}`}>
                     {analysis.category_scores.experience_score} <span className="text-xl text-slate-400">/ 100</span>
                   </span>
                 </>
               ) : (
                 <>
                   <span className="text-3xl font-black text-slate-400 mt-1">N/A</span>
                   <span className="text-[10px] uppercase font-bold text-slate-400 mt-2 text-center">No professional<br/>experience detected</span>
                 </>
               )}
             </Card>

             <Card className="p-5">
               <h3 className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Experience Feedback</h3>
               <p className="text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                 {analysis.category_scores?.experience_score > 0 ? 'Ensure all roles contain quantifiable metrics (e.g. "Increased revenue by 15%"). Structure bullets using action verbs.' : 'As an entry-level candidate, focus heavily on highlighting structured complex projects.'}
               </p>
             </Card>
          </div>
        </div>
      )}

      {/* FEEDBACK TAB */}
      {activeTab === "feedback" && (
        <div className="grid grid-cols-1 lg:grid-cols-[7fr_3fr] gap-8 animate-in fade-in">
          {/* L: 70% */}
          <div className="space-y-6">
             
             <div className="space-y-8">
                <div>
                   <h3 className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest mb-4 pl-2">Formatting</h3>
                   <Card className="p-6 border-slate-200 dark:border-slate-800">
                     <div className="flex items-start justify-between">
                       <span className="text-slate-700 dark:text-slate-200 font-medium text-[15px] leading-relaxed">Ensure font choices are ATS readable (Arial, Calibri) and margins are no smaller than 0.5 inches.</span>
                       <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0 ml-4">{analysis.category_scores?.formatting_score || 0}/100</Badge>
                     </div>
                   </Card>
                </div>
                
                <div>
                   <h3 className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest mb-4 pl-2">Keywords</h3>
                   <Card className="p-6 border-slate-200 dark:border-slate-800">
                     <div className="flex items-start justify-between">
                       <span className="text-slate-700 dark:text-slate-200 font-medium text-[15px] leading-relaxed">Expand standard industry keywords relevant to roles you are targeting to rank higher in basic ATS screening thresholds.</span>
                       <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0 ml-4">{analysis.category_scores?.keywords_score || 0}/100</Badge>
                     </div>
                   </Card>
                </div>

                <div>
                   <h3 className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest mb-4 pl-2">Education & Projects</h3>
                   <Card className="p-6 border-slate-200 dark:border-slate-800">
                      <div className="space-y-4">
                         <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                           <span className="text-slate-700 dark:text-slate-200 font-medium text-[15px]">Educational background aligns appropriately with standard engineering thresholds.</span>
                           <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0 ml-4">{analysis.category_scores?.education_score || 0}/100</Badge>
                         </div>
                         <div className="flex items-start justify-between pt-2">
                           <span className="text-slate-700 dark:text-slate-200 font-medium text-[15px]">Projects section well highlighted. Consider adding active links to repositories.</span>
                           <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0 ml-4">{analysis.category_scores?.projects_score || 0}/100</Badge>
                         </div>
                      </div>
                   </Card>
                </div>
             </div>

          </div>

          {/* R: 30% */}
          <div className="space-y-6">
             <Card className="p-6 bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center justify-center border-slate-200 dark:border-slate-800 text-center">
               <span className={`text-5xl font-black block ${getScoreColor(analysis.overall_score).split(' ')[0]}`}>
                 {analysis.overall_score || 0}<span className="text-2xl font-bold ml-1">%</span>
               </span>
               <span className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest block mt-3 mb-1">ATS Match</span>
               <span className={`text-xs font-bold px-3 py-1 mt-1 rounded-full ${getScoreColor(analysis.overall_score).split(' ')[1] || 'bg-slate-100'} ${getScoreColor(analysis.overall_score).split(' ')[0] || 'text-slate-600'} border ${getScoreColor(analysis.overall_score).split(' ')[2] || 'border-slate-200'} bg-opacity-20`}>
                 {getScoreText(analysis.overall_score)}
               </span>
             </Card>

             <Card className="p-6">
               <h3 className="text-xs font-black text-blue-700 uppercase tracking-wider mb-4 border-b border-blue-100 pb-2">Top Recommendations</h3>
               <div className="flex flex-col gap-3">
                 <div className="text-sm font-medium text-slate-700 dark:text-slate-300 flex gap-2 items-start"><span className="text-blue-500 mt-0.5">1.</span><span className="leading-snug">Add measurable impact into bullets</span></div>
                 <div className="text-sm font-medium text-slate-700 dark:text-slate-300 flex gap-2 items-start"><span className="text-blue-500 mt-0.5">2.</span><span className="leading-snug">Integrate missing keywords organically</span></div>
                 <div className="text-sm font-medium text-slate-700 dark:text-slate-300 flex gap-2 items-start"><span className="text-blue-500 mt-0.5">3.</span><span className="leading-snug">Ensure layout is perfectly linear for ancient ATS readers</span></div>
               </div>
             </Card>
          </div>
        </div>
      )}

      {/* JOB MATCH TAB */}
      {activeTab === "jobmatch" && (
        <div className="grid grid-cols-1 lg:grid-cols-[7fr_3fr] gap-8 animate-in fade-in">
          {/* L: 70% */}
          <div className="space-y-8">
            
            {!matchResult ? (
              <Card className="p-8 border-slate-200 dark:border-slate-800">
                <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-2">Analyze Job Fit</h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm mb-6">Paste a Job Description below to see exactly how your resume stacks up, highlighting exact matches and missing skills.</p>
                <JobDescriptionInput
                  value={jdText}
                  onChange={setJdText}
                  placeholder="Paste the target Job Description here..."
                />
                
                <div className="mt-4 flex items-center justify-between">
                  {matchError && <span className="text-sm text-red-500 font-medium">{matchError}</span>}
                  <button
                    onClick={handleJobMatch}
                    disabled={isMatching || jdText.trim() === ""}
                    className="ml-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    {isMatching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
                    {isMatching ? "Analyzing..." : "Analyze Match"}
                  </button>
                </div>
              </Card>
            ) : (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                
                <div className="flex justify-end">
                  <button
                    onClick={() => { setMatchResult(null); setJdText(""); }}
                    className="text-sm font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1 hover:text-slate-800 transition-colors"
                  >
                    <XCircle className="w-4 h-4" /> Reset Analysis
                  </button>
                </div>

                <div>
                   <h3 className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest mb-4 pl-2">Job Description Snapshot</h3>
                   <Card className="p-6 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                     <p className="text-[15px] font-bold text-slate-700 dark:text-slate-200 leading-relaxed font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                       {jdText.substring(0, 400)}{jdText.length > 400 ? '...' : ''}
                     </p>
                   </Card>
                </div>

                <div className="space-y-6">
                   <h3 className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest pl-2 border-b pb-2">Skill Extraction & Matching</h3>
                   
                   <div className="space-y-4 pt-2">
                     <h4 className="text-xs font-bold text-green-700 uppercase tracking-widest flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Exact Matches</h4>
                     <div className="flex flex-wrap gap-2">
                       {safeList(matchResult.exact_matches).length > 0 ? safeList(matchResult.exact_matches).map((s, i) => (
                         <Badge key={i} className="bg-green-100 text-green-800">{s}</Badge>
                       )) : <span className="text-xs text-slate-400 font-medium">None</span>}
                     </div>
                   </div>
                   
                   <div className="space-y-4 pt-2">
                     <h4 className="text-xs font-bold text-amber-700 uppercase tracking-widest flex items-center gap-2"><Briefcase className="w-4 h-4" /> Related Matches</h4>
                     <div className="flex flex-wrap gap-2">
                       {safeList(matchResult.related_matches).length > 0 ? safeList(matchResult.related_matches).map((s, i) => (
                         <Badge key={i} className="bg-amber-100 text-amber-800">{s}</Badge>
                       )) : <span className="text-xs text-slate-400 font-medium">None</span>}
                     </div>
                   </div>

                   <div className="space-y-4 pt-2">
                     <h4 className="text-xs font-bold text-red-700 uppercase tracking-widest flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Missing Skills</h4>
                     <div className="flex flex-wrap gap-2">
                       {safeList(matchResult.missing_skills).length > 0 ? safeList(matchResult.missing_skills).map((s, i) => (
                         <Badge key={i} className="bg-red-100 text-red-800">{s}</Badge>
                       )) : <span className="text-xs text-slate-400 font-medium">None</span>}
                     </div>
                   </div>
                </div>
              </div>
            )}
            
          </div>

          {/* R: 30% */}
          {matchResult && (
            <div className="space-y-6 animate-in slide-in-from-right-4 relative">
               <Card className="p-8 bg-slate-900 border-slate-800 text-white sticky top-6">
                 <div className="flex flex-col flex-wrap text-center items-center justify-center space-y-2 mb-8">
                   <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2 w-full">Job Match Score</h3>
                   <div className="pt-4">
                     <span className={`text-6xl font-black ${getScoreColor(matchResult.match_percentage).split(' ')[0]}`}>{matchResult.match_percentage || 0}<span className="text-3xl text-slate-600">%</span></span>
                   </div>
                   <p className="text-xs font-medium text-slate-400 uppercase tracking-widest pt-2">
                     {matchResult.match_percentage >= 80 ? 'Strong Match' : matchResult.match_percentage >= 50 ? 'Moderate Match' : 'Weak Match'}
                   </p>
                 </div>

                 <div className="space-y-3 pt-6 border-t border-slate-800">
                    <div className="flex justify-between text-sm font-bold"><span className="text-slate-400">Exact</span> <span className="text-green-500">{safeList(matchResult.exact_matches).length}</span></div>
                    <div className="flex justify-between text-sm font-bold"><span className="text-slate-400">Related</span> <span className="text-amber-500">{safeList(matchResult.related_matches).length}</span></div>
                    <div className="flex justify-between text-sm font-bold"><span className="text-slate-400">Missing</span> <span className="text-red-500">{safeList(matchResult.missing_skills).length}</span></div>
                 </div>
               </Card>
            </div>
          )}
        </div>
      )}

      {/* INTERVIEW TAB */}
      {activeTab === "interview" && (
        <div className="animate-in fade-in max-w-[1400px]">
          <InterviewPrep resumeId={resumeId} jobDescription={jdText} />
        </div>
      )}

      {/* COVER LETTER TAB */}
      {activeTab === "coverletter" && (
        <div className="animate-in fade-in h-full">
          <CoverLetterGenerator resumeId={resumeId} />
        </div>
      )}
    </div>
  )
}
