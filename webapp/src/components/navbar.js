'use client'
import { Search, Globe, User, LogOut } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function Navbar() {
  return (
    <nav className="bg-green-800 p-3 h-20">
      <div className="container mx-auto flex items-center justify-between">

        {/* Logo */}
        <Link href="/">
          <Image
            src="/pie_icon.png"
            alt="Pie Logo"
            width={60}
            height={60}
            className="rounded-full cursor-pointer"
          />
        </Link>

        {/* Search */}
        <div className="flex-1 mx-8">
          <div className="relative max-w-2xl mx-auto">
            <input
              type="search"
              placeholder="Hinted search text"
              className="w-full px-4 py-2 rounded-md bg-white/90 pl-4 pr-10 text-lg"
            />
            <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-500" />
          </div>
        </div>

        {/* Icons */}
        <div className="flex items-center gap-4">
          <Globe className="h-6 w-6 text-white cursor-pointer" />
          <User className="h-6 w-6 text-white cursor-pointer" />
          <LogOut className="h-6 w-6 text-white cursor-pointer" 
                  // onClick={HandleLogOut}
          />
        </div>
      </div>
    </nav>
  )
}

