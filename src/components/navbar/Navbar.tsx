"use client"

import type React from "react"

import { Menu } from "lucide-react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { signOut } from "@/app/(auth)/login/actions"

interface User {
  email?: string
  id: string
  name?: string
}

type NavItem = {
  name: string
  href: string
}

type NavigationProps = {
  user: User | null
}

export default function Navigation({ user }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    // Check if URL contains "sessions", "login", or "sign-up" and set isScrolled accordingly
    const shouldShowStyling =
      pathname.includes("sessions") || pathname.includes("/login") || pathname.includes("/sign-up") 
    if (shouldShowStyling) {
      setIsScrolled(true)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [pathname])

  // Check if the current path matches the session join pattern or contains "session"
  const isSessionPage = pathname.includes("/join") || pathname.includes("session")

  const navigationItems: (string | NavItem)[] = isSessionPage
    ? []
    : user
      ? [
          { name: "Concepts", href: "/concepts" },
        ]
      : []

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault()
    
    // Check if we're on login or signup pages
    const isAuthPage = pathname.includes("/login") || pathname.includes("/sign-up") 
    
    if (isAuthPage) {
      // Redirect to home page with hash
      router.push(`/home#${targetId}`)
    } else {
      // Normal smooth scroll behavior
      const element = document.getElementById(targetId)
      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      }
    }
  }

  const shouldShowNavbarStyling =
    pathname.includes("sessions") || pathname.includes("/login") || pathname.includes("/sign-up") 
    || pathname.includes("/concepts") || pathname.includes("/dashboard") || pathname.includes("/progress")
    || pathname.includes("/invitation") || pathname.includes("/simulations") || pathname.includes("/voice-cloning") 

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled || shouldShowNavbarStyling ? "bg-white/80 backdrop-blur-md shadow-lg" : "bg-transparent"
      }`}
    >
      <div className="px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/home" className="text-3xl font-bold mr-8 text-black ml-1">
              Sophia<span className="text-blue-600">.</span>
            </Link>
            <div className="hidden md:flex space-x-6 mt-2">
              {navigationItems.map((item) => (
                <a
                  key={typeof item === "string" ? item : item.name}
                  href={typeof item === "string" ? `#${item.toLowerCase().replace(/\s+/g, "-")}` : item.href}
                  onClick={
                    typeof item === "string"
                      ? (e) => handleSmoothScroll(e, item.toLowerCase().replace(/\s+/g, "-"))
                      : undefined
                  }
                  className={`text-gray-900 hover:text-blue-600 transition-colors duration-200 relative group cursor-pointer ${
                    typeof item !== "string" && pathname === item.href ? "text-blue-600" : ""
                  }`}
                >
                  {typeof item === "string" ? item : item.name}
                  <span
                    className={`absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 transform transition-transform duration-200 ${
                      typeof item !== "string" && pathname === item.href
                        ? "scale-x-100"
                        : "scale-x-0 group-hover:scale-x-100"
                    }`}
                  />
                </a>
              ))}
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/assets/Icons/accountIcon.png" alt="Account" />
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem className="flex items-center gap-2">
                    <div className="flex flex-col">
                      <p className="text-sm font-medium leading-none">{user.email ? user.email : "Guest Account"}</p>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <form action="/home" method="POST" className="w-full">
                      <button className="w-full text-left" formAction={signOut}>
                        Sign Out
                      </button>
                    </form>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              !isSessionPage && (
                <>
                  <Button variant="ghost" asChild>
                    <Link href="/login">Sign In</Link>
                  </Button>
                  <Link
                    href="/sign-up"
                    className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    Get Started
                  </Link>
                </>
              )
            )}
          </div>
          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
            <Menu className="text-gray-900" />
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 backdrop-blur-md bg-white/90">
            {navigationItems.map((item) => (
              <a
                key={typeof item === "string" ? item : item.name}
                href={typeof item === "string" ? `#${item.toLowerCase().replace(/\s+/g, "-")}` : item.href}
                onClick={
                  typeof item === "string"
                    ? (e) => {
                        handleSmoothScroll(e, item.toLowerCase().replace(/\s+/g, "-"))
                        setIsMenuOpen(false)
                      }
                    : () => setIsMenuOpen(false)
                }
                className={`block px-4 py-2 text-gray-900 hover:text-blue-600 transition-colors duration-200 cursor-pointer ${
                  typeof item !== "string" && pathname === item.href ? "text-blue-600 bg-blue-50" : ""
                }`}
              >
                {typeof item === "string" ? item : item.name}
              </a>
            ))}
            {user ? (
              <div className="pt-4 pb-3 border-t border-gray-200">
                <div className="flex items-center px-4">
                  <div className="flex-shrink-0">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/assets/Icons/accountIcon.png" alt="Account" />
                    </Avatar>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{user.email ? user.email : "Guest Account"}</p>
                  </div>
                </div>
                <div className="mt-3 px-4">
                  <form action="/home" method="POST">
                    <button
                      className="w-full text-left py-2 text-gray-900 hover:bg-blue-50 rounded"
                      formAction={signOut}
                    >
                      Sign Out
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              !isSessionPage && (
                <div className="pt-4 pb-3 border-t border-gray-200 px-4 space-y-2">
                  <Link
                    href="/login"
                    className="block w-full text-center py-2 text-gray-900 hover:bg-blue-50 rounded"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/sign-up"
                    className="block w-full text-center py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </nav>
  )
}