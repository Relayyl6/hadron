'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { clsx } from 'clsx'
import { useUser } from '../../context/user-context'
import AccountMenu from './header/AccountMenu'
import { XIcon, MenuIcon, SearchIcon } from './header/Icons'
import { DEPARTMENTS_DATA, NAV_LINKS } from '../utils/lib'

const Header = () => {
  const [searchValue, setSearchValue] = useState("")
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [activeDept, setActiveDept] = useState(DEPARTMENTS_DATA[0].id)
  const [deptMenuOpen, setDeptMenuOpen] = useState(false)
  const [hoveredDept, setHoveredDept] = useState<string | null>(null);
  const deptDropdownRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { user, isLoading, isError, refetch, clearUser } = useUser()


  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus()
  }, [searchOpen])

  // Close drawer on outside click
  useEffect(() => {
    if (!menuOpen) return
    const onOutside = (e: MouseEvent) => {
      const header = document.getElementById('site-header')
      if (header && !header.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [menuOpen])

  useEffect(() => {
    if (!dropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropdownOpen])

  useEffect(() => {
    if (!deptMenuOpen) return
    const closeMenu = (e: MouseEvent) => {
      if (deptDropdownRef.current && !deptDropdownRef.current.contains(e.target as Node)) {
        setDeptMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', closeMenu)
    return () => document.removeEventListener('mousedown', closeMenu)
  }, [deptMenuOpen])

  const toggleSearch = () => {
    setSearchOpen(prev => !prev)
    if (menuOpen) setMenuOpen(false)
  }

  const toggleMenu = () => {
    setMenuOpen(prev => !prev)
    if (searchOpen) setSearchOpen(false)
  }

  return (
    <header
      id='site-header'
      ref={deptDropdownRef}
      className={clsx(
        'sticky top-3 z-50 mx-auto w-11/12 md:w-10/12 mb-3',
        'border border-black bg-white transition-all duration-200',
        menuOpen ? 'rounded-t-2xl' : 'rounded-2xl',
        scrolled && !menuOpen && 'shadow-sm',
      )}
      style={{ position: 'relative' }}
    >
      {/* ── Top bar ── */}
      <div className='flex h-14 items-center justify-between px-4 md:px-6'>
        <Link href='/' className='flex items-center gap-2.5'>
          <Image src='/logo.png' alt='Hadron logo' width={32} height={32} />
          <span className='text-[15px] font-medium tracking-tight'>Hadron</span>
        </Link>

        {/* Trigger Button - Keeps its exact position in the top bar */}
          <button
            onClick={() => setDeptMenuOpen(!deptMenuOpen)}
            className={`flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-sm font-medium transition-colors ${
              deptMenuOpen 
                ? 'bg-gray-900 text-white' 
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <span>Departments</span>
            <svg 
              className={`h-4 w-4 transform transition-transform duration-200 ${deptMenuOpen ? 'rotate-180' : ''}`} 
              fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth='2.5'
            >
              <path strokeLinecap='round' strokeLinejoin='round' d='M19 9l-7 7-7-7' />
            </svg>
        </button>
        
        <nav className='hidden items-center gap-1 md:flex' aria-label='Main navigation'>
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className='rounded-md px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900'
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className='hidden items-center gap-3 md:flex'>
          <input
            type='text'
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder='Search for products...'
            className='w-48 rounded-md border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100'
          />
          <AccountMenu
            user={user}
            isLoading={isLoading}
            isError={isError}
            refetch={refetch}
            onSignOut={clearUser}
          />
        </div>

        <div className='flex items-center gap-1 md:hidden'>
          <button
            onClick={toggleSearch}
            aria-label='Toggle search'
            aria-expanded={searchOpen}
            className='flex h-9 w-9 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100'
          >
            {searchOpen ? <XIcon /> : <SearchIcon />}
          </button>
          <button
            onClick={toggleMenu}
            aria-label='Toggle menu'
            aria-expanded={menuOpen}
            className='flex h-9 w-9 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100'
          >
            {menuOpen ? <XIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* ── Mobile search bar (in-flow, expands header slightly) ── */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out md:hidden ${
          searchOpen ? 'max-h-16 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className='border-t border-gray-100 px-4 py-2'>
          <input
            ref={searchRef}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            type='text'
            placeholder='Search for products...'
            className='w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100'
          />
        </div>
      </div>

      {/* ── Mobile drawer (absolutely positioned — floats over page) ── */}
      <div
        className={`absolute left-0 right-0 top-full z-40 overflow-hidden rounded-b-2xl border-x border-b border-black bg-white transition-all duration-300 ease-in-out md:hidden ${
          menuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <nav className='flex flex-col p-2' aria-label='Mobile navigation'>
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className='rounded-md px-3 py-2.5 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900'
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className='flex gap-2 border-t border-gray-100 p-3'>
          <AccountMenu
            user={user}
            isLoading={isLoading}
            isError={isError}
            refetch={refetch}
            onSignOut={clearUser}
          />
        </div>
      </div>

      {/* Mega Menu Overlay - Positioned completely below the header pill */}
      {deptMenuOpen && (
        <div 
          // Reset hover tracking when the mouse leaves the entire mega-menu container
          onMouseLeave={() => setHoveredDept(null)}
          className='absolute left-0 right-0 mx-auto md:mx-0 md:right-auto top-[56px] z-50 flex flex-col md:flex-row w-[92vw] sm:w-[95vw] md:w-[680px] rounded-2xl border border-gray-200 bg-white p-1 shadow-lg animate-scaleUp'
        >
          
          {/* Left Column: Department Selection Rail */}
          <div className='w-full md:w-1/3 border-b md:border-b-0 md:border-r border-gray-100 p-1 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible scrollbar-none bg-gray-50/50 rounded-t-xl md:rounded-l-xl whitespace-nowrap md:whitespace-normal'>
            {DEPARTMENTS_DATA.map((dept) => (
              <button
                key={dept.id}
                type='button'
                // Glimpse state on hover
                onMouseEnter={() => setHoveredDept(dept.id)}
                // Lock state on click
                onClick={() => setActiveDept(dept.id)}
                className={`flex-shrink-0 md:w-full text-left rounded-lg px-3 py-2 md:py-2.5 text-xs tracking-wide transition-all ${
                  // Highlighting priority goes to the hovered item, then falls back to active
                  (hoveredDept ? hoveredDept === dept.id : activeDept === dept.id)
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-200/60 font-bold'
                    : 'text-gray-500 hover:bg-gray-100/70 hover:text-gray-800 font-medium'
                }`}
              >
                {dept.label}
              </button>
            ))}
          </div>

          {/* Right Column: Deeply Nested Categories Viewport */}
          {(() => {
            const currentDisplayedId = hoveredDept || activeDept;
            const selectedDept = DEPARTMENTS_DATA.find(d => d.id === currentDisplayedId);
            
            if (!selectedDept) return null;

            // Type guard to check if category has subcategories
            const hasSubcategories = (cat: any): cat is { name: string; href: string; subcategories: any[] } => {
              return 'subcategories' in cat && Array.isArray(cat.subcategories) && cat.subcategories.length > 0;
            };

            // Recursive function to render categories - removed explicit type annotation
            const renderCategories = (categories: any[], depth = 0) => {
              return categories.map((cat, idx) => (
                <div key={idx} className="space-y-1.5">
                  <Link
                    href={cat.href}
                    onClick={() => setDeptMenuOpen(false)}
                    className={`${
                      depth === 0 
                        ? 'text-xs font-bold uppercase tracking-wider text-gray-900 hover:text-blue-600'
                        : depth === 1
                        ? 'text-xs text-gray-500 hover:text-gray-900'
                        : 'text-[10px] text-gray-400 hover:text-gray-700'
                    } transition-colors block`}
                  >
                    {cat.name}
                  </Link>

                  {hasSubcategories(cat) && (
                    <div className={`flex flex-col gap-1 ${depth > 0 ? 'pl-2' : 'pl-1'}`}>
                      {renderCategories(cat.subcategories, depth + 1)}
                    </div>
                  )}
                </div>
              ));
            };

            return (
              <div className='w-full md:w-2/3 p-4 flex flex-col justify-between min-h-[260px] bg-white rounded-b-xl md:rounded-r-xl'>
                <div className='grid grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-1'>
                  {renderCategories(selectedDept.categories)}
                </div>

                {selectedDept.featured && (
                  <div className='mt-4 rounded-lg bg-gray-900 p-2.5 text-white flex items-center justify-between gap-3'>
                    <div className='min-w-0 flex-1'>
                      <p className='text-[9px] uppercase tracking-wider text-gray-400 font-medium truncate'>
                        {selectedDept.featured.discount}
                      </p>
                      <h4 className='text-xs font-semibold text-white mt-0.5 truncate'>
                        {selectedDept.featured.name}
                      </h4>
                    </div>
                    <Link
                      href={selectedDept.featured.href || '#'}
                      onClick={() => setDeptMenuOpen(false)}
                      className='flex-shrink-0 rounded bg-white px-2.5 py-1 text-[10px] font-bold text-gray-900 hover:bg-gray-100 transition-colors'
                    >
                      Shop Now
                    </Link>
                  </div>
                )}
              </div>
            );
          })()}

        </div>
      )}
    </header>
  )
}

export default Header