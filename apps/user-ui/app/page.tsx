
import SectionTitle from '@/shared/components/section/section-title'
import Hero from '@/shared/widgets/Hero'
import React from 'react'

const Page = () => {
  return (
    <main className='bg-[#f5f5f5]'>
      <Hero />
      
      <div className='md:w-[80%] w-[90%] my-10 m-auto'>
        <div className='mb-8'>
          <SectionTitle title="Suggested Products" />
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5'>
          {Array.from({length: 8}).map((_, index) => (
            <div key={index} className='h-[250px] bg-gray-300 animate-pulse rounded-xl' />
          ))}
        </div>

      </div>
    </main>
  )
}

export default Page
