import { useState, useRef, useEffect } from "react"
import { PlayCircle, Mic, ArrowRight, Loader2, StopCircle, RefreshCw } from "lucide-react"
import { getAuth } from "firebase/auth"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "../lib/firebase"
interface InterviewPrepProps {
  resumeId: string
  jobDescription: string
}

interface EvaluationScorecard {
  scores: {
    relevance: number
    technical_accuracy: number
    completeness: number
    communication: number
    clarity: number
  }
  good_points: string[]
  missing_points: string[]
  better_approach: string
  overall_score: number
  follow_up_question?: string
}

// Global declaration for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

// Minimal Inline Component Definitions
const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={`rounded-xl border bg-white dark:bg-slate-900 shadow-sm ${className}`}>{children}</div>
)

const Button = ({ children, onClick, disabled, className, variant = "default", size = "default" }: any) => {
  const base = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none ring-offset-background"
  const variants: any = {
    default: "bg-slate-900 text-white hover:bg-slate-900/90",
    destructive: "bg-red-500 text-white hover:bg-red-500/90",
    outline: "border border-input hover:bg-slate-100 hover:text-slate-900 dark:text-slate-100"
  }
  const sizes: any = {
    default: "h-10 py-2 px-4",
    sm: "h-9 px-3 rounded-md",
  }
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </button>
  )
}

const Badge = ({ children, className, variant }: any) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${className} ${variant === 'outline' ? 'border' : ''}`}>
    {children}
  </span>
)

const Textarea = (props: any) => (
  <textarea 
    {...props} 
    className={`flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${props.className}`}
  />
)

const Alert = ({ children, variant = "default", className }: any) => (
  <div className={`relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground ${variant === 'destructive' ? 'border-red-500/50 text-red-900 dark:border-red-500 [&>svg]:text-red-900' : ''} ${className}`}>
    {children}
  </div>
)
const AlertTitle = ({ children }: any) => <h5 className="mb-1 font-medium leading-none tracking-tight">{children}</h5>
const AlertDescription = ({ children }: any) => <div className="text-sm [&_p]:leading-relaxed">{children}</div>


export function InterviewPrep({ resumeId, jobDescription }: InterviewPrepProps) {
  const [mode, setMode] = useState<string>("Technical")
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null)
  const [history, setHistory] = useState<string[]>([])
  const [mainQuestionCount, setMainQuestionCount] = useState(0)
  const [sessionEvaluations, setSessionEvaluations] = useState<EvaluationScorecard[]>([])
  const [isSummaryView, setIsSummaryView] = useState(false)
  const [isBetterApproachExpanded, setIsBetterApproachExpanded] = useState(false)
  
  const [transcript, setTranscript] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isSpeaking, setIsSpeaking] = useState(false)
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [evaluation, setEvaluation] = useState<EvaluationScorecard | null>(null)
  const [error, setError] = useState<string | null>(null)

  const recognitionRef = useRef<any>(null)
  const timerRef = useRef<any>(null)
  const synth = window.speechSynthesis

  useEffect(() => {
    // Setup Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      
      recognitionRef.current.onresult = (event: any) => {
        let currentTranscript = ""
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript
        }
        setTranscript(currentTranscript)
      }
      
      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error)
        if (event.error === 'not-allowed') {
          setError("Microphone permission denied. You can manually type your answer below.")
          stopRecording()
        }
      }
    }

    return () => {
      synth.cancel() // Stop speaking if unmounted
      if (recognitionRef.current && isRecording) {
        recognitionRef.current.stop()
      }
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const generateQuestion = async () => {
    if (!jobDescription.trim()) {
      setError("Please paste a Job Description before starting the interview.")
      return
    }
    
    // Guard: prevent duplicate API calls from double-clicks or strict mode
    if (isGenerating) return
    
    setError(null)
    setIsGenerating(true)
    setEvaluation(null)
    setTranscript("")
    setCurrentQuestion(null)
    
    try {
      const auth = getAuth()
      const user = auth.currentUser
      if (!user) throw new Error("Not authenticated")
      const token = await user!.getIdToken()
      
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/resume/${resumeId}/interview/question`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          job_description: jobDescription,
          mode: mode,
          question_history: history
        })
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.detail || "Failed to generate question")
      }
      
      const data = await res.json()
      setCurrentQuestion(data.data.question)
      setHistory(prev => [...prev, data.data.question])
      setMainQuestionCount(prev => prev + 1)
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  const evaluateAnswer = async () => {
    if (!transcript.trim()) {
      setError("Transcript cannot be empty.")
      return
    }
    
    setError(null)
    setIsEvaluating(true)
    
    try {
      if (isRecording) {
        stopRecording()
      }
      synth.cancel() // stop reading if still reading
      
      const auth = getAuth()
      const user = auth.currentUser
      if (!user) throw new Error("Not authenticated")
      const token = await user!.getIdToken()
      
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/resume/${resumeId}/interview/evaluate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          job_description: jobDescription,
          question: currentQuestion,
          transcript: transcript
        })
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.detail || "Failed to evaluate answer")
      }
      
      const data = await res.json()
      setEvaluation(data.data)
      setSessionEvaluations(prev => [...prev, data.data])
      setIsBetterApproachExpanded(false)
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsEvaluating(false)
    }
  }

  const answerFollowUp = () => {
    if (!evaluation?.follow_up_question) return
    const fq = evaluation.follow_up_question
    setCurrentQuestion(fq)
    setHistory(prev => [...prev, fq])
    setTranscript("")
    setEvaluation(null)
    setIsBetterApproachExpanded(false)
  }

  const listenToQuestion = () => {
    if (!currentQuestion) return
    synth.cancel() // stop previous
    const utterance = new SpeechSynthesisUtterance(currentQuestion)
    utterance.rate = 0.95
    
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    
    synth.speak(utterance)
  }

  const stopListening = () => {
    synth.cancel()
    setIsSpeaking(false)
  }

  const startRecording = () => {
    setError(null)
    if (!recognitionRef.current) {
      setError("Speech recognition is not supported in this browser. Please type your answer below.")
      return
    }
    
    synth.cancel() // stop reading
    
    try {
      setTranscript("")
      recognitionRef.current.start()
      setIsRecording(true)
      setRecordingTime(0)
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (err) {
      console.error(err)
      setError("Could not start recording. Permission might be denied.")
    }
  }

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsRecording(false)
    if (timerRef.current) clearInterval(timerRef.current)
  }
  
  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600 bg-green-50 border-green-200"
    if (score >= 5) return "text-amber-600 bg-amber-50 border-amber-200"
    return "text-red-600 bg-red-50 border-red-200"
  }

  const getScoreTextColor = (score: number) => {
    if (score >= 8) return "text-green-600"
    if (score >= 5) return "text-amber-600"
    return "text-red-600"
  }

  // Pre-Interview State (no question generated yet)
  if (!currentQuestion && !isGenerating && !evaluation) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-6 bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 dark:text-slate-100">AI Mock Interview</h3>
          <p className="text-slate-600 dark:text-slate-400 font-medium max-w-md mx-auto">
            Practice answering realistic questions generated from your Resume and the target Job Description.
          </p>
        </div>
        
        <div className="flex items-center gap-4 w-full max-w-sm">
          <select 
            value={mode} 
            onChange={(e) => setMode(e.target.value)}
            className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:bg-slate-800 px-3 py-2 text-sm outline-none dark:text-slate-200"
          >
            <option value="Technical">Technical Interview</option>
            <option value="HR / Behavioral">HR / Behavioral</option>
            <option value="Project-Based">Project-Based</option>
            <option value="Mixed">Mixed Interview</option>
          </select>
          <Button onClick={generateQuestion} className="w-full">
            Start Selected Mode
          </Button>
        </div>
        
        {error && (
          <Alert variant="destructive" className="max-w-sm mt-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    )
  }

  const finishInterview = async () => {
    // Save completed interview session to Firestore
    if (sessionEvaluations.length > 0) {
      try {
        const auth = getAuth()
        const user = auth.currentUser
        if (user) {
          const avgScore = parseFloat(
            (sessionEvaluations.reduce((acc, e) => acc + e.overall_score, 0) / sessionEvaluations.length).toFixed(1)
          )
          await addDoc(collection(db, "interviewSessions"), {
            userId: user.uid,
            resumeId,
            mode,
            questionsAnswered: sessionEvaluations.length,
            averageScore: avgScore,
            completedAt: serverTimestamp(),
          })
        }
      } catch (err) {
        console.error("Failed to save interview session:", err)
        // Non-blocking — still show summary
      }
    }
    setIsSummaryView(true)
  }

  const startNewInterview = () => {
    setHistory([])
    setMainQuestionCount(0)
    setSessionEvaluations([])
    setMode("Technical")
    setCurrentQuestion(null)
    setEvaluation(null)
    setIsSummaryView(false)
    setTranscript("")
  }

  // --- RENDERING ---

  if (isSummaryView) {
    const avgScore = (sessionEvaluations.reduce((acc, curr) => acc + curr.overall_score, 0) / sessionEvaluations.length).toFixed(1)
    const avgTech = (sessionEvaluations.reduce((acc, curr) => acc + curr.scores.technical_accuracy, 0) / sessionEvaluations.length).toFixed(1)
    const avgRel = (sessionEvaluations.reduce((acc, curr) => acc + curr.scores.relevance, 0) / sessionEvaluations.length).toFixed(1)
    const avgComp = (sessionEvaluations.reduce((acc, curr) => acc + curr.scores.completeness, 0) / sessionEvaluations.length).toFixed(1)
    const avgComm = (sessionEvaluations.reduce((acc, curr) => acc + curr.scores.communication, 0) / sessionEvaluations.length).toFixed(1)
    const avgClar = (sessionEvaluations.reduce((acc, curr) => acc + curr.scores.clarity, 0) / sessionEvaluations.length).toFixed(1)

    // Aggregate feedback
    const allGood = sessionEvaluations.flatMap(e => e.good_points)
    const allMissing = sessionEvaluations.flatMap(e => e.missing_points)
    
    // Pick a few distinct ones
    const topStrengths = Array.from(new Set(allGood)).slice(0, 5)
    const topImprovements = Array.from(new Set(allMissing)).slice(0, 5)

    return (
      <div className="space-y-6 animate-in fade-in max-w-4xl mx-auto">
        <Card className="p-8 border-slate-200">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 mb-2">Interview Summary</h2>
            <p className="text-slate-500 font-medium">You completed {sessionEvaluations.length} questions in {mode} mode.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-widest block mb-2">Final Overall Score</span>
              <span className={`text-6xl font-black ${getScoreTextColor(parseFloat(avgScore))}`}>
                {avgScore} <span className="text-3xl text-slate-400">/ 10</span>
              </span>
            </div>
            
            <div className="space-y-4 pt-2">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 tracking-wide uppercase text-sm border-b border-slate-200 dark:border-slate-800 pb-2">Average Metrics</h4>
              <div className="flex justify-between items-center"><span className="text-sm font-medium text-slate-700 dark:text-slate-300">Technical Accuracy</span><span className="font-bold dark:text-slate-100">{avgTech}/10</span></div>
              <div className="flex justify-between items-center"><span className="text-sm font-medium text-slate-700 dark:text-slate-300">Relevance</span><span className="font-bold dark:text-slate-100">{avgRel}/10</span></div>
              <div className="flex justify-between items-center"><span className="text-sm font-medium text-slate-700 dark:text-slate-300">Completeness</span><span className="font-bold dark:text-slate-100">{avgComp}/10</span></div>
              <div className="flex justify-between items-center"><span className="text-sm font-medium text-slate-700 dark:text-slate-300">Communication</span><span className="font-bold dark:text-slate-100">{avgComm}/10</span></div>
              <div className="flex justify-between items-center"><span className="text-sm font-medium text-slate-700 dark:text-slate-300">Clarity</span><span className="font-bold dark:text-slate-100">{avgClar}/10</span></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
             <div>
                <h4 className="font-bold text-green-700 dark:text-green-500 flex items-center gap-2 mb-3 tracking-wide text-sm uppercase border-b border-slate-200 dark:border-slate-800 pb-2">Consistent Strengths</h4>
                <ul className="space-y-3">
                  {topStrengths.map((pt, i) => <li key={i} className="text-base font-medium text-slate-700 dark:text-slate-300 break-words flex gap-2"><span className="text-green-500 shrink-0">✓</span><span>{pt}</span></li>)}
                </ul>
             </div>
             <div>
                <h4 className="font-bold text-amber-700 dark:text-amber-500 flex items-center gap-2 mb-3 tracking-wide text-sm uppercase border-b border-slate-200 dark:border-slate-800 pb-2">Areas for Improvement</h4>
                <ul className="space-y-3">
                  {topImprovements.map((pt, i) => <li key={i} className="text-base font-medium text-slate-700 dark:text-slate-300 break-words flex gap-2"><span className="text-amber-500 shrink-0">⚠</span><span>{pt}</span></li>)}
                </ul>
             </div>
          </div>

          <div className="flex justify-center pt-6 border-t border-slate-100 dark:border-slate-800">
            <Button onClick={startNewInterview} className="px-8 h-12 gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full">
              <RefreshCw className="w-5 h-5" /> Start New Interview
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (!currentQuestion && !isSummaryView && history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
          <Mic className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 dark:text-slate-100 mb-3 text-center">AI Mock Interview</h2>
        <p className="text-slate-600 dark:text-slate-400 font-medium text-center max-w-md mb-8 leading-relaxed">
          Practice answering realistic 10-question interviews generated contextually from your Resume and the target Job Description.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-md">
          <select 
            value={mode} 
            onChange={(e) => setMode(e.target.value)}
            className="flex h-12 w-full items-center justify-between rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:bg-slate-800 px-4 py-2 text-sm outline-none font-medium text-slate-700 dark:text-slate-200"
          >
            <option value="Technical">Technical Interview</option>
            <option value="HR / Behavioral">HR / Behavioral</option>
            <option value="Project-Based">Project-Based</option>
            <option value="Mixed">Mixed Interview</option>
          </select>
          <Button onClick={generateQuestion} className="w-full sm:w-auto h-12 px-6 whitespace-nowrap bg-blue-600 hover:bg-blue-700 text-white">
            Start Selected Mode
          </Button>
        </div>
        
        {error && (
          <Alert variant="destructive" className="max-w-md mt-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[7fr_3fr] gap-8">
      
      {/* LEFT: MAIN WORKSPACE */}
      <div className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isGenerating ? (
          <Card className="flex flex-col items-center justify-center h-[400px] border-slate-200 bg-white dark:bg-slate-900">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <p className="text-slate-600 font-medium tracking-wide">Generating Question {history.length + 1} of 10...</p>
          </Card>
        ) : currentQuestion && !evaluation ? (
          <div className="space-y-6 animate-in fade-in">
            
            {/* Question Box */}
            <Card className="p-8 border-slate-200 bg-white dark:bg-slate-900 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🤖</span>
                    <p className="font-semibold text-slate-600 uppercase tracking-wider text-sm">Interviewer</p>
                  </div>
                  <p className="text-xl font-medium text-slate-900 dark:text-slate-100 leading-relaxed max-w-full">"{currentQuestion}"</p>
                  
                  <div className="flex items-center gap-3 mt-4">
                    <Button variant="outline" size="sm" onClick={listenToQuestion} disabled={isSpeaking} className="gap-2 border-slate-300">
                      <PlayCircle className="w-4 h-4" /> Listen to Question
                    </Button>
                    {isSpeaking && (
                      <Button variant="outline" size="sm" onClick={stopListening} className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                        <StopCircle className="w-4 h-4" /> Stop Voice
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
            
            {/* Answer Box */}
            <Card className="p-8 border-slate-200 bg-white dark:bg-slate-900 shadow-sm">
              <div className="flex flex-col sm:flex-row items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-6 mb-6">
                {isRecording ? (
                  <div className="flex items-center gap-4 w-full">
                    <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-md">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </span>
                      <span className="font-bold text-red-700">{formatTime(recordingTime)}</span>
                      <span className="text-red-600 font-medium ml-2">Recording Active...</span>
                    </div>
                    <Button variant="destructive" onClick={stopRecording} className="gap-2 shrink-0 h-12 px-6">
                      <StopCircle className="w-5 h-5" /> Stop
                    </Button>
                  </div>
                ) : (
                  <Button onClick={startRecording} className="w-full sm:w-auto h-12 px-8 gap-2 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white rounded-full font-semibold">
                    <Mic className="w-5 h-5" /> Start Voice Answer
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-widest">Transcript</label>
                  <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded">Edit freely before hitting submit</span>
                </div>
                <Textarea 
                  value={transcript}
                  onChange={(e: any) => setTranscript(e.target.value)}
                  placeholder="Your spoken answer will appear here, or you can manually type/paste your answer if you prefer..."
                  className="min-h-[160px] text-lg resize-y p-4 border-slate-300 dark:border-slate-700 focus-visible:ring-blue-500 leading-relaxed font-semibold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900"
                />
              </div>
              
              <div className="flex justify-end pt-6">
                <Button 
                  onClick={evaluateAnswer} 
                  disabled={isEvaluating || transcript.length < 5 || isRecording}
                  className="gap-2 h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold shadow-sm shadow-blue-200"
                >
                  {isEvaluating ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                  {isEvaluating ? "Evaluating..." : "Submit Answer"}
                </Button>
              </div>
            </Card>
          </div>
        ) : null}

        {/* Evaluation Scorecard */}
        {evaluation && currentQuestion && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4">
            <Card className="p-8 border-slate-200 bg-white dark:bg-slate-900">
              
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8 border-b border-slate-100 dark:border-slate-800 pb-8">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-2 uppercase tracking-wide">Answer Evaluation</h2>
                  <p className="text-slate-500 font-medium">Scores are deterministically verified against your Resume and the JD.</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 p-4 rounded-xl min-w-[160px] text-center flex flex-col justify-center">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Overall Score</span>
                  <span className={`text-4xl font-black ${getScoreTextColor(evaluation.overall_score)}`}>{evaluation.overall_score.toFixed(1)} <span className="text-xl text-slate-400">/ 10</span></span>
                </div>
              </div>

              {/* Side-by-Side Evaluation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Left: Score Breakdown */}
                <div className="space-y-5 border-r border-transparent md:border-slate-100 dark:border-slate-800 md:pr-10">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 tracking-wider uppercase text-sm mb-4">Detailed Breakdown</h4>
                  {[
                    { label: "Technical Accuracy", score: evaluation.scores.technical_accuracy },
                    { label: "Relevance", score: evaluation.scores.relevance },
                    { label: "Completeness", score: evaluation.scores.completeness },
                    { label: "Communication", score: evaluation.scores.communication },
                    { label: "Clarity", score: evaluation.scores.clarity }
                  ].map(metric => (
                    <div key={metric.label} className="flex items-center justify-between pb-3 border-b border-slate-50 dark:border-slate-800 border-dotted last:border-none">
                      <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{metric.label}</span>
                      <Badge variant="outline" className={`font-bold px-3 py-1 ${getScoreColor(metric.score)}`}>
                        {metric.score}/10
                      </Badge>
                    </div>
                  ))}
                </div>

                {/* Right: Feedback */}
                <div className="space-y-8">
                  <div>
                    <h4 className="font-bold text-green-700 flex items-center gap-2 mb-3 tracking-wider uppercase text-xs">
                      <span className="text-sm">✓</span> What you did well
                    </h4>
                    <ul className="space-y-2">
                      {evaluation.good_points.map((pt, i) => (
                        <li key={i} className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium flex gap-2"><span className="text-green-500 mt-1">•</span><span>{pt}</span></li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-bold text-amber-600 flex items-center gap-2 mb-3 tracking-wider uppercase text-xs">
                      <span className="text-sm">⚠</span> What was missing
                    </h4>
                    <ul className="space-y-2">
                      {evaluation.missing_points.map((pt, i) => (
                        <li key={i} className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium flex gap-2"><span className="text-amber-500 mt-1">•</span><span>{pt}</span></li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Better Approach Collapsible */}
              <div className="mt-10 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 overflow-hidden">
                <button 
                  onClick={() => setIsBetterApproachExpanded(!isBetterApproachExpanded)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-100 transition-colors duration-200"
                >
                  <h4 className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2 tracking-wide text-sm uppercase">
                    <span className="text-lg">💡</span> A Better Approach
                  </h4>
                  <span className="text-xs font-bold text-slate-500 px-3 py-1 bg-white dark:bg-slate-900 rounded-md border border-slate-200">
                    {isBetterApproachExpanded ? 'Hide Improved Answer ↑' : 'View Improved Answer ↓'}
                  </span>
                </button>
                
               {isBetterApproachExpanded && (
                   <div className="p-6 border-t border-slate-200 bg-white dark:bg-slate-900">
                     <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium whitespace-pre-line">
                       {evaluation.better_approach}
                     </p>
                   </div>
                )}
              </div>
              
              {evaluation.follow_up_question && (
                <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl">
                  <h4 className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2 mb-2 tracking-wide text-sm uppercase">
                    <span className="text-lg">🔄</span> Follow-up Question
                  </h4>
                  <p className="text-base text-slate-800 dark:text-slate-200 font-medium leading-relaxed mb-4">
                    {evaluation.follow_up_question}
                  </p>
                  <Button onClick={answerFollowUp} className="w-full sm:w-auto gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 px-8 rounded-full">
                    <Mic className="w-4 h-4" /> Answer Follow-up
                  </Button>
                </div>
              )}

              <div className="flex justify-end mt-10 pt-6 border-t border-slate-100 dark:border-slate-800">
                {mainQuestionCount >= 10 && !evaluation.follow_up_question ? (
                  <Button onClick={finishInterview} className="gap-2 h-14 px-10 rounded-full font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                    Finish & View Summary <ArrowRight className="w-5 h-5" />
                  </Button>
                ) : !evaluation.follow_up_question ? (
                  <Button onClick={generateQuestion} className="gap-2 h-14 px-10 rounded-full font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-md shadow-slate-200">
                    Next Question <ArrowRight className="w-5 h-5" />
                  </Button>
                ) : null}
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* RIGHT: SESSION SIDEBAR */}
      {!isSummaryView && history.length > 0 && (
         <div className="space-y-6 lg:sticky lg:top-6 lg:self-start hidden lg:block">
           <Card className="p-6 border-slate-200 bg-white dark:bg-slate-900 shadow-sm relative overflow-hidden">
             
             {/* Progress Bar background graphic */}
             <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100 dark:bg-slate-800">
                <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${(mainQuestionCount / 10) * 100}%` }}></div>
             </div>
             
             <div className="space-y-6 mt-2">
                <div>
                   <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Interview Mode</h3>
                   <div className="font-bold text-slate-800 dark:text-slate-200">{mode}</div>
                </div>
                
                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
                   <div>
                     <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Session Progress</h3>
                     <div className="font-black text-2xl text-blue-600 whitespace-nowrap">
                       Q {mainQuestionCount} <span className="text-slate-300 dark:text-slate-600 text-lg">/ 10</span>
                     </div>
                   </div>
                   <div className="text-right">
                     <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Estimated Difficulty</h3>
                     <Badge className="bg-amber-100 text-amber-800 shadow-none border-none pointer-events-none mt-1 uppercase text-[10px]">Medium</Badge>
                   </div>
                </div>
             </div>
             
             <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3">
               <button onClick={finishInterview} className="text-xs font-semibold text-slate-500 hover:text-slate-800 py-2 text-center transition-colors">
                 End Interview Early
               </button>
             </div>
             
           </Card>
         </div>
      )}

    </div>

  )
}
