'use client'
import { Search, User, LogOut } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import LanguageSwitcher from "./language-switcher"
import { useTranslations } from 'next-intl'

export default function Navbar({searchQuery, setSearchQuery}) { 
  const t = useTranslations();
  
  return (
    <nav className="bg-[#007f39] p-3 h-20">
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

        {/* Search Bar */}
        <div className="flex-1 mx-8">
          <div className="relative max-w-2xl mx-auto">
            <input
              type="search"
              placeholder={t('Search')}
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="w-full px-6 py-3 rounded-md bg-white/90 pl-4 pr-10 text-lg"
            />
            <Search className="absolute right-3 top-3 h-6 w-6 text-gray-500" />
          </div>
        </div>

        {/* Icons */}
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <User className="h-6 w-6 text-white cursor-pointer" title={t('Profile')} />
          <LogOut className="h-6 w-6 text-white cursor-pointer" title={t('Logout')} />
        </div>
      </div>
    </nav>
  )
}

