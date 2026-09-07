import { useState, useEffect, useRef } from "react"
import { useResumes } from "../hooks/useResumes"
import { getAuth } from "firebase/auth"
import { MessageSquare, X, Send, Bot, User, Loader2, ChevronDown, Sparkles } from "lucide-react"

export function AIChatWidget() {
  const { resumes } = useResumes()
  const auth = getAuth()
  
  const [isOpen, setIsOpen] = useState(false)
  const [selectedResumeId, setSelectedResumeId] = useState<string>("")
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const analyzedResumes = resumes.filter(r => r.analysis)

  // Default to first parsed resume if none selected
  useEffect(() => {
    if (!selectedResumeId && analyzedResumes.length > 0) {
      setSelectedResumeId(analyzedResumes[0].id)
    }
  }, [analyzedResumes, selectedResumeId])

  // Load history when a resume is selected and widget is open
  useEffect(() => {
    if (isOpen && selectedResumeId) {
      loadHistory()
    }
  }, [isOpen, selectedResumeId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const loadHistory = async () => {
    try {
      const user = auth.currentUser
      if (!user) return
      const token = await user.getIdToken()
      
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/resume/${selectedResumeId}/chat`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok && data.data) {
        setMessages(data.data)
      }
    } catch (e) {
      console.error("Failed to load chat history:", e)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || !selectedResumeId) return
    
    const userText = input.trim()
    setInput("")
    setMessages(prev => [...prev, { role: "user", content: userText }])
    setIsLoading(true)

    try {
      const user = auth.currentUser
      if (!user) return
      const token = await user.getIdToken()
      
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/resume/${selectedResumeId}/chat`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: userText })
      })
      const data = await res.json()
      
      if (res.ok) {
        setMessages(prev => [...prev, { role: "assistant", content: data.data.reply }])
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: "**Error:** Coach is currently offline." }])
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: "**Error:** Connection lost." }])
    } finally {
      setIsLoading(false)
    }
  }

  // Only render if user is authed
  if (!auth.currentUser) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* Expanded Chat Widget */}
      {isOpen && (
        <div className="w-[360px] md:w-[420px] h-[580px] max-h-[80vh] flex flex-col bg-white dark:bg-[#0D1525] border border-slate-200 dark:border-[#24334A] rounded-2xl shadow-2xl mb-4 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          
          {/* Header */}
          <div className="bg-indigo-600 dark:bg-[#101A2E] p-4 flex flex-col gap-3 border-b border-transparent dark:border-[#24334A]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <Bot className="w-5 h-5 bg-white/20 p-1 rounded backdrop-blur-sm" />
                <h3 className="font-bold text-sm tracking-wide">AI Career Coach</h3>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white/70 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Context Selector */}
            {analyzedResumes.length > 0 ? (
              <div className="relative">
                <select
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  className="w-full appearance-none bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-medium rounded-lg px-3 py-2 outline-none transition-colors cursor-pointer dark:bg-[#101B2D] dark:border-[#24334A] dark:text-slate-200"
                >
                  {analyzedResumes.map(r => (
                    <option key={r.id} value={r.id} className="text-slate-900 dark:text-slate-200 dark:bg-[#142038]">
                      Focus: {r.fileName}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white p-0.5 pointer-events-none" />
              </div>
            ) : (
              <div className="w-full bg-white/10 border border-white/20 text-white/80 text-xs font-medium rounded-lg px-3 py-2 text-center shadow-sm">
                Unlock Coach by uploading a resume
              </div>
            )}
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-[#0A1120]">
            
            {analyzedResumes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-80">
                <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-2">
                  <Bot className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                </div>
                <h3 className="font-bold text-slate-700 dark:text-slate-300">Awaiting Context</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium max-w-[240px]">
                  Please upload and analyze your resume on the Dashboard first. I need a resume to provide tailored career advice!
                </p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-60">
                <Sparkles className="w-8 h-8 text-indigo-500 mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium max-w-[200px]">
                  I`m evaluating your resume. Ask me anything about interviews, skill gaps, or career paths.
                </p>
              </div>
            ) : null}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`flex items-start max-w-[85%] gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  
                  <div className={`w-7 h-7 shrink-0 flex items-center justify-center rounded-full shadow-sm 
                    ${msg.role === "user" ? "bg-slate-200 dark:bg-[#24334A] text-slate-600 dark:text-slate-300" : "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400"}`}>
                    {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div className={`p-3 rounded-2xl text-sm font-medium leading-relaxed whitespace-pre-wrap
                    ${msg.role === "user" 
                      ? "bg-indigo-600 text-white rounded-tr-sm shadow-sm" 
                      : "bg-white dark:bg-[#111D32] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#24334A] rounded-tl-sm shadow-sm"}`}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center rounded-full shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white dark:bg-[#111D32] border border-slate-200 dark:border-[#24334A] px-4 py-2.5 rounded-2xl rounded-tl-sm flex items-center gap-1.5 shadow-sm">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white dark:bg-[#0D1525] border-t border-slate-200 dark:border-[#24334A]">
            <form 
              onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                disabled={analyzedResumes.length === 0}
                onChange={e => setInput(e.target.value)}
                placeholder={analyzedResumes.length === 0 ? "Upload resume to chat..." : "Ask about your career path..."}
                className="flex-1 bg-slate-100 dark:bg-[#101B2D] border-none text-slate-900 dark:text-slate-100 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading || analyzedResumes.length === 0}
                className="bg-indigo-600 disabled:bg-indigo-400 dark:disabled:bg-indigo-600/50 hover:bg-indigo-700 text-white p-3 rounded-xl transition-colors shadow-sm"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 text-white ml-0.5" />}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center justify-center w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-[0_4px_20px_rgba(79,70,229,0.4)] transition-all hover:scale-105 active:scale-95"
        >
          <MessageSquare className="w-6 h-6 group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-indigo-600 shadow-sm"></span>
          </span>
        </button>
      )}
      
    </div>
  )
}
