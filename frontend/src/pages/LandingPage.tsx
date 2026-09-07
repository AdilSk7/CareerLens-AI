import { Button } from "@/components/ui/button"
import { ArrowRight, Bot, Target, FileText, CheckCircle } from "lucide-react"
import { Link } from "react-router-dom"

export function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="py-24 md:py-32 px-4 text-center">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
            Your AI-powered <span className="text-primary">job search</span> companion.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Analyze your resume, understand job requirements, discover skill gaps, improve your applications, and prepare for interviews with AI.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register">
              <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-base">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-8 text-base">
                Try Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/50 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Everything you need to land your dream job</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We provide the tools and insights you need to stand out from the crowd and confidently ace your interviews.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard 
              icon={<Bot className="h-10 w-10 text-primary" />}
              title="AI Resume Analysis"
              description="Get instant feedback on your resume tailored to the exact job you want."
            />
            <FeatureCard 
              icon={<Target className="h-10 w-10 text-primary" />}
              title="Identify Skill Gaps"
              description="Discover exactly what skills you're missing and how to acquire them quickly."
            />
            <FeatureCard 
              icon={<FileText className="h-10 w-10 text-primary" />}
              title="Cover Letters"
              description="Generate highly personalized, professional cover letters in seconds."
            />
            <FeatureCard 
              icon={<CheckCircle className="h-10 w-10 text-primary" />}
              title="Mock Interviews"
              description="Practice with AI-generated interview questions specific to your role."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 text-center">
        <div className="container mx-auto max-w-3xl space-y-6">
          <h2 className="text-3xl font-bold tracking-tight">Ready to boost your career?</h2>
          <p className="text-muted-foreground text-lg">
            Join thousands of smart job seekers who are using CareerLens AI to land better jobs faster.
          </p>
          <div className="pt-4">
            <Link to="/register">
              <Button size="lg" className="h-12 px-8 text-base">
                Create Your Free Account
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="flex flex-col items-center text-center p-6 bg-card rounded-xl border shadow-sm">
      <div className="mb-4 p-3 bg-primary/10 rounded-full">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
