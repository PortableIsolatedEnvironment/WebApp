'use client'
import { Search, Globe, User, ArrowRight } from "lucide-react"
import Image from "next/image"

export default function Navbar() {
  return (
    <nav className="bg-green-800 p-4">
      <div className="container mx-auto flex items-center justify-between">

        {/* Logo */}
        <Image
          src="/pie_icon.png"
          alt="Pie Logo"
          width={40}
          height={40}
          className="rounded-full"
        />

        {/* Search */}
        <div className="flex-1 mx-8">
          <div className="relative max-w-2xl mx-auto">
            <input
              type="search"
              placeholder="Hinted search text"
              className="w-full px-4 py-2 rounded-md bg-white/90 pl-4 pr-10"
            />
            <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-500" />
          </div>
        </div>

        {/* Icons */}
        <div className="flex items-center gap-4">
          <Globe className="h-6 w-6 text-white cursor-pointer" />
          <User className="h-6 w-6 text-white cursor-pointer" />
          <ArrowRight className="h-6 w-6 text-white cursor-pointer" />
        </div>
      </div>
    </nav>
  )
}

