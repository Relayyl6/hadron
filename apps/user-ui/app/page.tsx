import { useUser } from '@/context/user-context'
import React from 'react'

const Page = () => {
  const { user } = useUser
  return (
    <div>
      Page
    </div>
  )
}

export default Page
