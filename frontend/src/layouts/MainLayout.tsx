import { Outlet } from "react-router-dom"
import { Navbar } from "../components/layout/Navbar"
import { Footer } from "../components/layout/Footer"
import { AIChatWidget } from "../components/AIChatWidget"

export function MainLayout() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[linear-gradient(135deg,#F4F7FF_0%,#EEF2FF_45%,#F7F0FF_100%)] dark:bg-none dark:bg-[#0A1120] text-[#0F172A] dark:text-foreground">
      {/* Decorative Blob Backgrounds (Light Mode Only) */}
      <div className="dark:hidden absolute top-[-10%] left-[-10%] w-[50vh] h-[50vh] rounded-full bg-[#E8F4FF] opacity-60 blur-[100px] pointer-events-none -z-10 mix-blend-multiply"></div>
      <div className="dark:hidden absolute top-[40%] right-[-10%] w-[60vh] h-[60vh] rounded-full bg-[#EEE9FF] opacity-50 blur-[120px] pointer-events-none -z-10 mix-blend-multiply"></div>
      <div className="dark:hidden absolute bottom-[-10%] left-[20%] w-[40vh] h-[40vh] rounded-full bg-[#F8EEFF] opacity-60 blur-[90px] pointer-events-none -z-10 mix-blend-multiply"></div>
      <div className="dark:hidden absolute top-[20%] left-[40%] w-[30vh] h-[30vh] rounded-full bg-emerald-50 opacity-40 blur-[80px] pointer-events-none -z-10 mix-blend-multiply"></div>

      <div className="relative z-10 w-full flex-grow flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
        <AIChatWidget />
      </div>
    </div>
  )
}
