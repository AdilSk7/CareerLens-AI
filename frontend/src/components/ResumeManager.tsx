import { useState, useRef } from "react"
import { useAuth } from "../contexts/AuthContext"
import { FileUp, FileText, CheckCircle2, AlertCircle, Loader2, Trash2, ExternalLink, Sparkles, ChevronDown, ChevronUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ResumeAnalysisViewer } from "./ResumeAnalysisViewer"
import { useResumes, type ResumeRecord } from "../hooks/useResumes"



export function ResumeManager() {
  const { currentUser } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { resumes, loading, refresh } = useResumes()
  
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  
  // Track which resumes are currently being analyzed
  const [analyzingIds, setAnalyzingIds] = useState<Record<string, boolean>>({})
  
  // Track the singular active resume being viewed
  const [activeResumeId, setActiveResumeId] = useState<string | null>(null)

  // Track visibility of the resumes list
  const [isResumesExpanded, setIsResumesExpanded] = useState(true)

  

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      validateAndSetFile(file)
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      validateAndSetFile(file)
    }
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
  }

  function validateAndSetFile(file: File) {
    setErrorMessage("")
    setUploadStatus("idle")
    
    if (file.type !== "application/pdf") {
      setErrorMessage("Only PDF files are allowed.")
      return
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("File size must be less than 5MB.")
      return
    }
    
    setUploadFile(file)
  }

  async function processUpload() {
    if (!uploadFile || !currentUser) return
    
    setUploadStatus("uploading")
    setUploadProgress(50)
    setErrorMessage("")
    
    try {
      const token = await currentUser!.getIdToken()
      
      const formData = new FormData()
      formData.append("file", uploadFile)
            
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/resume/process`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || "Failed to process resume on server")
      }
      
      setUploadProgress(100)
      setUploadStatus("success")
      setUploadFile(null)
      
    } catch (err: any) {
      console.error("Processing error:", err)
      setUploadStatus("error")
      setErrorMessage(err.message || "An error occurred during backend processing.")
    }
  }

  async function handleDelete(resume: ResumeRecord) {
    if (!confirm(`Are you sure you want to delete ${resume.fileName}?`)) return
    
    try {
      const token = await currentUser!.getIdToken()
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/resume/${resume.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error("Failed to delete resume")
      }
      
      refresh()
    } catch (err) {
      console.error("Error deleting resume:", err)
      alert("Failed to delete resume. See console for details.")
    }
  }

  async function handleAnalyze(resumeId: string) {
    if (!currentUser) return
    
    setAnalyzingIds(prev => ({ ...prev, [resumeId]: true }))
    
    try {
      const token = await currentUser!.getIdToken()
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/resume/${resumeId}/analyze`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}))
        throw new Error(errJson.detail || "Analysis failed on the server.")
      }
      
      await response.json()
      
      refresh()
      
    } catch (err: any) {
      console.error("Analysis error", err)
      alert(err.message || "An error occurred during AI analysis. Please try again.")
    } finally {
      setAnalyzingIds(prev => ({ ...prev, [resumeId]: false }))
    }
  }

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto w-full">
    <Card className="w-full bg-white/82 dark:bg-[#101A2E] dark:backdrop-blur-none backdrop-blur-[10px] border-[#DCE5F5] dark:border-transparent shadow-[0_10px_35px_rgba(79,70,229,0.06)] dark:shadow-none rounded-[20px] dark:rounded-2xl overflow-hidden p-2">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-[#0F172A] dark:text-white">Resume Management</CardTitle>
        <CardDescription>
          Upload your PDF resume to extract its contents for analysis.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        
        {/* Upload Area */}
        <div 
          className="border-2 border-dashed border-indigo-200 dark:border-[#24334A] bg-indigo-50 dark:bg-[#111D32] hover:bg-[#EEF2FF] dark:hover:bg-[#1A263D] rounded-xl dark:rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:border-indigo-300"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => uploadStatus !== "uploading" && fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            accept="application/pdf"
            className="hidden" 
          />
          
          <FileUp className="h-10 w-10 text-indigo-500 dark:text-muted-foreground mb-4" />
          
          {uploadFile ? (
            <div className="space-y-2 w-full max-w-sm" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between text-sm font-medium">
                <span className="truncate max-w-[200px]">{uploadFile.name}</span>
                <span className="text-muted-foreground">{(uploadFile.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
              
              {uploadStatus === "idle" && (
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setUploadFile(null)}>Cancel</Button>
                  <Button size="sm" className="w-full" onClick={processUpload}>Upload</Button>
                </div>
              )}
              
              {uploadStatus === "uploading" && (
                <div className="space-y-1 pt-2 text-primary flex items-center justify-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm font-medium">Processing & Saving ({Math.round(uploadProgress)}%)...</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-sm font-medium">Click to upload or drag and drop</p>
              <p className="text-xs text-muted-foreground">PDF only (max. 5MB)</p>
            </div>
          )}
        </div>

        {/* Error Messages */}
        {errorMessage && (
          <div className="p-3 rounded-md bg-destructive/15 text-destructive text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>{errorMessage}</span>
          </div>
        )}
        
        {/* Success State */}
        {uploadStatus === "success" && (
          <div className="p-3 rounded-md bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 font-bold text-sm flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            <span>Resume successfully uploaded and parsed by backend!</span>
          </div>
        )}

        {/* Saved Resumes List */}
        <div className="border border-slate-200 dark:border-[#24334A] rounded-xl overflow-hidden bg-slate-50 dark:bg-[#0F172A]/50">
          <button
            type="button"
            onClick={() => setIsResumesExpanded(!isResumesExpanded)}
            className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 dark:bg-[#142038] dark:hover:bg-[#1A263D] transition-colors gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-0">Your Resumes ({resumes.length})</h3>
            </div>
            {isResumesExpanded ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>
          
          {isResumesExpanded && (
            <div className="p-4 border-t border-slate-100 dark:border-[#24334A]">
              {loading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : resumes.length === 0 ? (
                <div className="text-center p-6 border rounded-md text-sm text-muted-foreground">
                  No resumes uploaded yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {resumes.map((resume, index) => {
                     const score = resume.analysis?.overall_score || 0;
                     let badgeClass = "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
                     if (resume.analysis) {
                       if (score >= 80) badgeClass = "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400";
                       else if (score >= 50) badgeClass = "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400";
                       else badgeClass = "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400";
                     }
                     
                     const iconColors = [
                       "bg-red-50 text-red-500",      
                       "bg-blue-50 text-blue-500",    
                       "bg-green-50 text-green-500",  
                       "bg-purple-50 text-purple-500" 
                     ];
                     const iconClass = iconColors[index % 4];
                 
                 return (
                <div key={resume.id} className={`flex flex-col sm:flex-row p-5 border rounded-xl bg-white dark:bg-[#142038] shadow-[0_2px_10px_rgba(15,23,42,0.04)] dark:shadow-sm gap-4 items-start sm:items-center justify-between transition-all hover:-translate-y-0.5 ${activeResumeId === resume.id ? 'border-indigo-400 ring-4 ring-indigo-500/10 dark:ring-blue-500/20' : 'border-slate-200 dark:border-transparent hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-500'}`}>
                  
                  <div className="flex items-center gap-4 overflow-hidden w-full sm:w-auto">
                    <div className={`h-12 w-12 rounded-lg ${iconClass} dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0`}>
                      <FileText className="h-6 w-6 dark:text-blue-400" />
                    </div>
                    <div className="truncate text-left">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate mb-1">{resume.fileName}</p>
                      <div className="flex items-center gap-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                        <span>Analyzed {new Date(resume.uploadedAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className={`font-bold px-2.5 py-0.5 rounded-md text-xs ${badgeClass}`}>ATS {score > 0 ? score : '?'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 flex-shrink-0 w-full sm:w-auto justify-end">
                    {!resume.analysis ? (
                      <Button 
                         variant="secondary" 
                         size="sm" 
                         onClick={() => handleAnalyze(resume.id)} 
                         disabled={analyzingIds[resume.id]}
                         className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border-indigo-200 dark:border-indigo-800 border shadow-sm font-bold h-10 px-4"
                      >
                        {analyzingIds[resume.id] ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4 mr-2" />
                        )}
                        Analyze with AI
                      </Button>
                    ) : (
                      <Button 
                         variant={activeResumeId === resume.id ? "secondary" : "outline"} 
                         size="sm" 
                         onClick={() => setActiveResumeId(activeResumeId === resume.id ? null : resume.id)}
                         className={`shadow-sm font-bold h-10 px-5 transition-all dark:bg-transparent ${activeResumeId === resume.id ? 'bg-[#EEF2FF] text-[#4F46E5] border-[#A5B4FC] hover:bg-[#E0E7FF] dark:bg-slate-800 dark:text-slate-200' : 'bg-white text-[#4F46E5] border-[#CBD5E1] hover:bg-[#EEF2FF] dark:border-slate-700'}`}
                      >
                        {activeResumeId === resume.id ? <><span className="w-2 h-2 rounded-full bg-blue-600 mr-2 animate-pulse"></span> Close Analysis</> : 'Open Analysis'}
                      </Button>
                    )}
                    
                    <a href={resume.fileUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="h-10 px-3 border-[#CBD5E1] hover:bg-[#EEF2FF] dark:border-slate-700">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(resume)} className="h-10 px-3 bg-[#EF4444] hover:bg-[#DC2626] dark:bg-red-900 dark:hover:bg-red-800">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )})}
            </div>
          )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>

    {/* DOM ACTIVE RESUME ANALYSIS PORTAL */}
    {activeResumeId && resumes.find(r => r.id === activeResumeId)?.analysis && (
      <div className="pt-8 border-t-2 border-slate-200 dark:border-slate-800 mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-6 flex items-center justify-between">
           <div>
             <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-wide">Active Workspace</h3>
             <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{resumes.find(r => r.id === activeResumeId)?.fileName}</p>
           </div>
        </div>
        
        <ResumeAnalysisViewer 
           analysis={resumes.find(r => r.id === activeResumeId)!.analysis!} 
           resumeId={activeResumeId} 
        />
      </div>
    )}
    </div>
  )
}
