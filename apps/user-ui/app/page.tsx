import { useUser } from '@/context/user-context'
import Hero from '@/shared/widgets/Hero'
import React from 'react'

const Page = () => {
  const { user } = useUser
  return (
    <main className='bg-[#f5f5f5]'>
      <Hero />
    </main>
  )
}

export default Page
