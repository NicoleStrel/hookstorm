import Link from "next/link"
import { Cloud, Github, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import MobileMenu from "@/components/mobile-menu"

const routes = [
  {
    name: "Webhook",
    path: "/",
  },
  {
    name: "Examples",
    path: "/examples",
  },
]

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Cloud className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">hookstorm</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            {routes.map((route) => (
              <Link key={route.path} href={route.path} className="transition-colors hover:text-foreground/80">
                {route.name}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            <Button variant="outline" size="sm" asChild className="hidden sm:flex">
              <a href="https://github.com/hookstorm/hookstorm" target="_blank" rel="noopener noreferrer" title="GitHub">
                <Github className="h-4 w-4 mr-2" />
                GitHub
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild className="hidden sm:flex">
              <a href="https://discord.gg/hookstorm" target="_blank" rel="noopener noreferrer" title="Discord">
                <MessageSquare className="h-4 w-4 mr-2" />
                Discord
              </a>
            </Button>
            <MobileMenu routes={routes} />
          </nav>
        </div>
      </div>
    </header>
  )
}
