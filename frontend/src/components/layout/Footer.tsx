export function Footer() {
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row px-4 md:px-8">
        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
          Built for job seekers and students. The modern AI career companion.
        </p>
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} CareerLens AI. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
