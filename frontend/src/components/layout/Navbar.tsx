import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Briefcase, Moon, Sun, User, LogOut } from "lucide-react"
import { useAuth } from "../../contexts/AuthContext"
import { useState, useEffect, useRef } from "react"


export function Navbar() {
  const { currentUser, userProfile, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    try {
      await logout()
      navigate("/login")
    } catch (error) {
      console.error("Failed to log out", error)
    }
  }

  const [isDark, setIsDark] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (document.documentElement.classList.contains("dark")) {
      setIsDark(true)
    }
    
    // Click outside to close profile dropdown
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function toggleTheme() {
    if (isDark) {
      document.documentElement.classList.remove("dark")
      setIsDark(false)
    } else {
      document.documentElement.classList.add("dark")
      setIsDark(true)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#DDE5F5] dark:border-[#24334A] bg-white/85 dark:bg-[#0D1525] backdrop-blur-[12px] supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-[#0D1525]/80">
      <div className="container mx-auto flex h-16 items-center px-4 md:px-8">
        <Link to="/" className="flex items-center gap-2">
          <Briefcase className="h-6 w-6 text-primary" />
          <span className="font-bold tracking-tight text-xl text-[#0F172A] dark:text-white">CareerLens AI</span>
        </Link>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="mr-2 rounded-full">
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            {currentUser ? (
              <>
                <Link to="/dashboard">
                  <Button variant="ghost" className="text-[#0F172A] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">Dashboard</Button>
                </Link>
                
                <div className="relative" ref={profileRef}>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsProfileOpen(!isProfileOpen)} 
                    className={`border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 gap-2 ${isProfileOpen ? 'bg-slate-50 dark:bg-slate-800' : ''}`}
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Button>
                  
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-[#24334A] rounded-xl shadow-lg p-4 z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800/60">
                        <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 rounded-full flex items-center justify-center font-bold text-lg">
                          {(userProfile?.name || currentUser?.email || "U").charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                          <div className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                            {userProfile?.name || "CareerLens User"}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {currentUser?.email}
                          </div>
                        </div>
                      </div>
                      
                      <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400">
                        <LogOut className="h-4 w-4 mr-2" />
                        Log out
                      </Button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost">Log in</Button>
                </Link>
                <Link to="/register">
                  <Button>Get Started</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
