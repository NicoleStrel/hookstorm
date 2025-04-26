"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, Github, MessageSquare, Cloud } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface MobileMenuProps {
  routes: {
    name: string
    path: string
  }[]
}

export default function MobileMenu({ routes }: MobileMenuProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="sm:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pr-0">
        <Link href="/" className="flex items-center space-x-2" onClick={() => setOpen(false)}>
          <Cloud className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl">hookstorm</span>
        </Link>
        <div className="my-6 w-full">
          <nav className="flex flex-col space-y-4">
            {routes.map((route) => (
              <Link
                key={route.path}
                href={route.path}
                onClick={() => setOpen(false)}
                className={cn(
                  "text-foreground/60 transition-colors hover:text-foreground",
                  pathname === route.path && "text-foreground",
                )}
              >
                {route.name}
              </Link>
            ))}
            <div className="flex flex-col space-y-2 pt-2">
              <Button variant="outline" size="sm" asChild>
                <a href="https://github.com/hookstorm/hookstorm" target="_blank" rel="noopener noreferrer">
                  <Github className="h-4 w-4 mr-2" />
                  GitHub
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="https://discord.gg/hookstorm" target="_blank" rel="noopener noreferrer">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Discord
                </a>
              </Button>
            </div>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  )
}
