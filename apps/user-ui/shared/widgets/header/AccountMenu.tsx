'use client'

import { createPortal } from 'react-dom'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { FaShoppingCart, FaHeart } from 'react-icons/fa'
import { User } from '@/context/user-context'

interface AccountMenuProps {
  user: User | null
  setUser: (u: User | null) => void
}

export default function AccountMenu({ user, setUser }: AccountMenuProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on outside click — now safe because panelRef + btnRef belong
  // to THIS instance only, no cross-talk with any other AccountMenu.
  useEffect(() => {
    if (!dropdownOpen) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        panelRef.current && !panelRef.current.contains(target) &&
        btnRef.current && !btnRef.current.contains(target)
      ) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropdownOpen])

  // Recompute position on open, and keep it correct on resize/scroll
  useEffect(() => {
    if (!dropdownOpen) return
    const updateCoords = () => {
      const rect = btnRef.current?.getBoundingClientRect()
      if (!rect) return
      const panelWidth = 224 // w-56
      setCoords({
        top: rect.bottom + 8,
        left: Math.min(
          Math.max(8, rect.right - panelWidth),
          window.innerWidth - panelWidth - 8
        ),
      })
    }
    updateCoords()
    window.addEventListener('resize', updateCoords)
    window.addEventListener('scroll', updateCoords, true)
    return () => {
      window.removeEventListener('resize', updateCoords)
      window.removeEventListener('scroll', updateCoords, true)
    }
  }, [dropdownOpen])

  const openMenu = () => setDropdownOpen(prev => !prev)

  if (!user) {
    return (
      <>
        <Link
          href={`/log-in?from=${typeof window !== 'undefined' ? window.location.pathname : '/'}`}
          className='rounded-md px-3.5 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900'
        >
          Log in
        </Link>
        <Link
          href={`/sign-up?from=${typeof window !== 'undefined' ? window.location.pathname : '/'}`}
          className='rounded-md bg-gray-900 px-4 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-85'
        >
          Get started
        </Link>
        <div className='gap-3 flex flex-row items-center justify-center'>
          <Link href={`/wishlist?from=${typeof window !== 'undefined' ? window.location.pathname : '/'}`} className='relative'>
            <FaHeart className='text-gray-500 hover:text-gray-900 w-5 h-5' />
            <div className='w-2 h-2 border-white bg-red-500 rounded-full flex items-center absolute -top-1 -right-1'>
              <span className='text-white font-medium text-[8px] text-center ml-0.5'>0</span>
            </div>
          </Link>
          <Link href={`/cart?from=${typeof window !== 'undefined' ? window.location.pathname : '/'}`} className='relative'>
            <FaShoppingCart className='text-gray-500 hover:text-gray-900 w-5 h-5' />
            <div className='w-2 h-2 border-white bg-red-500 rounded-full flex items-center absolute -top-1 -right-1'>
              <span className='text-white font-medium text-[8px] text-center ml-0.5'>0</span>
            </div>
          </Link>
        </div>
      </>
    )
  }

  const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2)

  return (
    <div className='relative flex flex-row items-center justify-center gap-3'>
      <button
        ref={btnRef}
        onClick={openMenu}
        className='flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-xs font-medium text-white transition-opacity hover:opacity-80'
        aria-label='Open user menu'
        aria-expanded={dropdownOpen}
      >
        {user.avatarUrl
          ? <Image src={user.avatarUrl} alt={user.name} width={32} height={32} className='rounded-full object-cover' />
          : <span>{initials}</span>}
      </button>

      <div className='flex flex-row gap-3'>
        <Link href={`/wishlist?from=${typeof window !== 'undefined' ? window.location.pathname : '/'}`} className='relative flex'>
          <FaHeart className='text-gray-500 hover:text-gray-900 w-5 h-5' />
          <div className='w-2 h-2 border-white bg-red-500 rounded-full flex items-center absolute -top-1 -right-1'>
            <span className='text-white font-medium text-[8px] text-center ml-0.5'>0</span>
          </div>
        </Link>
        <Link href={`/cart?from=${typeof window !== 'undefined' ? window.location.pathname : '/'}`} className='relative flex'>
          <FaShoppingCart className='text-gray-500 hover:text-gray-900 w-5 h-5' />
          <div className='w-2 h-2 border-white bg-red-500 rounded-full flex items-center absolute -top-1 -right-1'>
            <span className='text-white font-medium text-[8px] text-center ml-0.5'>0</span>
          </div>
        </Link>
      </div>

      {dropdownOpen && coords && typeof document !== 'undefined' && createPortal(
        <div
          ref={panelRef}
          style={{ position: 'fixed', top: coords.top, left: coords.left }}
          className='z-[60] w-56 rounded-xl border border-gray-200 bg-white p-1 shadow-md'
        >
          <div className='flex items-center gap-3 px-3 py-2.5'>
            <div className='flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-medium text-white'>
              {user.avatarUrl
                ? <Image src={user.avatarUrl} alt={user.name} width={36} height={36} className='rounded-full object-cover' />
                : <span>{initials}</span>}
            </div>
            <div className='flex min-w-0 flex-col'>
              <span className='truncate text-sm font-medium text-gray-900'>{user.name}</span>
              <span className='truncate text-xs text-gray-400'>{user.email}</span>
            </div>
          </div>
          <div className='my-1 border-t border-gray-100' />
          <button
            onClick={() => { setUser(null); setDropdownOpen(false) }}
            className='w-full rounded-lg px-3 py-2 text-left text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900'
          >
            Sign out
          </button>
        </div>,
        document.body
      )}
    </div>
  )
}