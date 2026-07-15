"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'


export interface User {
  id: string
  name: string
  email: string
  avatarUrl: string | null
}

interface UserContextValue {
  user: User | null
  setUser: (user: User | null) => void
  loading: boolean
}

const UserContext = createContext<UserContextValue | null>(null)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
      const savedUser = localStorage.getItem('app_user');

      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser))
        } catch (e) {
          console.error("Error parsing user from localStorage", e)
        } finally {
          setLoading(false)
        }
      }

      setLoading(false)
  }, [])

  const handleSetUser = (newUser: User | null) => {
    setUser(newUser)
    if (newUser) {
      localStorage.setItem('app_user', JSON.stringify(newUser))
    } else {
      localStorage.removeItem('app_user')
    }
  }

  return (
    <UserContext.Provider value={{ user, setUser: handleSetUser, loading }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within a UserProvider')
  return ctx
}
