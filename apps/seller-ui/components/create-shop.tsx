'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { apiRequest } from '@/utils/fetch'
import { FaImage, FaTwitter, FaInstagram, FaGlobe, FaTimes, FaChevronDown } from 'react-icons/fa'

type ShopFormValues = {
  name: string
  category: string // We will store comma-separated categories to match your String schema
  bio: string
  address: string
  opening_hours: string // We will store stringified JSON of the schedule
  website: string
  twitter: string
  instagram: string
  coverBanner: any
}

// Pre-defined categories for the dropdown
const SUGGESTED_CATEGORIES = [
  "Electronics", "Fashion", "Groceries", "Home & Garden", 
  "Beauty & Health", "Sports", "Automotive", "Toys & Games", "Art & Crafts"
]

// Generate time slots (e.g., 08:00 AM, 08:30 AM)
const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const hours = Math.floor(i / 2)
  const mins = i % 2 === 0 ? '00' : '30'
  const ampm = hours < 12 ? 'AM' : 'PM'
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
  return `${displayHour.toString().padStart(2, '0')}:${mins} ${ampm}`
})

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function CreateShop({
  sellerId,
  setActiveStep
}: {
  sellerId: string
  setActiveStep: (step: number) => void
}) {
  const [step, setStep] = useState(0)
  const [globalError, setGlobalError] = useState('')
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  
  // Custom State for Category Tags
  const [categoryInput, setCategoryInput] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [activeDay, setActiveDay] = useState('Monday')

  // Custom State for Opening Hours
  const [schedule, setSchedule] = useState<Record<string, { isOpen: boolean, start: string, end: string }>>(
    DAYS_OF_WEEK.reduce((acc, day) => ({
      ...acc,
      [day]: { isOpen: day !== 'Sunday' && day !== 'Saturday', start: '09:00 AM', end: '05:00 PM' }
    }), {})
  )
  
  const stepRefs = useRef<(HTMLDivElement | null)[]>([])
  const [trackHeight, setTrackHeight] = useState<number | undefined>(undefined)

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false);
      }
    }
    
    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);
    
    // Unbind the event listener on cleanup
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const { register, handleSubmit, trigger, setValue, formState: { errors } } = useForm<ShopFormValues>({
    mode: 'onChange',
    defaultValues: {
      name: '', category: '', bio: '', address: '',
      opening_hours: '', website: '', twitter: '', instagram: '', coverBanner: null,
    }
  })

  // Auto-height tracking for smooth sliding transitions
  useEffect(() => {
    const activeEl = stepRefs.current[step]
    if (!activeEl) return
    setTrackHeight(activeEl.offsetHeight)
    const observer = new ResizeObserver(() => {
      const el = stepRefs.current[step]
      if (el) setTrackHeight(el.offsetHeight)
    })
    observer.observe(activeEl)
    return () => observer.disconnect()
  }, [step])

  // Sync custom states with React Hook Form before advancing
  const handleNextStep = async (fieldsToValidate: (keyof ShopFormValues)[]) => {
    setGlobalError('')
    
    // Sync Categories
    if (step === 0) {
      setValue('category', selectedCategories.join(', '))
    }
    // Sync Opening Hours
    if (step === 1) {
      setValue('opening_hours', JSON.stringify(schedule))
    }

    const isStepValid = await trigger(fieldsToValidate)
    if (isStepValid) setStep((prev) => prev + 1)
  }

  const handlePrevStep = () => {
    setGlobalError('')
    setStep((prev) => Math.max(0, prev - 1))
  }

  // Handle Base64 Image Upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setValue('coverBanner', file)
      const reader = new FileReader()
      reader.onloadend = () => setBannerPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const shopCreateMutation = useMutation({
    mutationFn: async (data: ShopFormValues) => {
      const payload = {
        name: data.name,
        bio: data.bio,
        category: data.category,
        address: data.address,
        opening_hours: data.opening_hours,
        website: data.website,
        socialLinks: [data.twitter, data.instagram].filter(Boolean),
        coverBanner: bannerPreview, 
      }

      return apiRequest<{ success: boolean; shop: any }>('/api/users/shop/seller/shop', {
        method: 'POST',
        body: payload,
      })
    },
    onSuccess: () => setActiveStep(5),
    onError: (err: any) => setGlobalError(err.message || 'Failed to create shop. Check image size limits.')
  })

  return (
    <div className='flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 lg:shadow-2xl lg:shadow-black/20'>
      
      {/* Step Indicator */}
      <div className='flex items-center px-8 pt-6'>
        {[ { index: 1, label: 'Identity' }, { index: 2, label: 'Operations' }, { index: 3, label: 'Branding' } ].map((s, i, arr) => {
          const activeIndicator = step + 1
          return (
            <div key={s.index} className='flex flex-1 items-center last:flex-initial'>
              <div className='flex flex-col items-center gap-1'>
                <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${activeIndicator >= s.index ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'}`}>
                  {activeIndicator > s.index ? '✓' : s.index}
                </div>
                <span className={`whitespace-nowrap text-[10px] font-medium ${activeIndicator >= s.index ? 'text-gray-700' : 'text-gray-400'}`}>{s.label}</span>
              </div>
              {i < arr.length - 1 && <div className={`mx-2 mb-4 h-[2px] flex-1 transition-colors ${activeIndicator > s.index ? 'bg-gray-900' : 'bg-gray-200'}`} />}
            </div>
          )
        })}
      </div>

      <div className='overflow-hidden transition-[height] duration-500 ease-out' style={{ height: trackHeight }}>
        <div className='flex items-start transition-transform duration-500 ease-out will-change-transform' style={{ transform: `translateX(-${step * 100}%)` }}>
          
          {/* STEP 1: Identity */}
          <div ref={(el) => { stepRefs.current[0] = el }} className='w-full flex-shrink-0 p-8'>
            <h1 className='mb-1 text-xl font-semibold text-gray-900'>Shop Identity</h1>
            <p className='mb-6 text-sm text-gray-500'>Let buyers know who you are and what you sell.</p>
            
            <div className='flex flex-col gap-4'>
              <div className='flex flex-col gap-1.5'>
                <label className='text-sm font-medium text-gray-700'>Shop Name</label>
                <input {...register('name', { required: 'Shop name is required' })} placeholder='The Artisan Store' className='rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100' />
                {errors.name && <p className='text-xs text-red-500'>{errors.name.message}</p>}
              </div>

              {/* CUSTOM CATEGORY MULTI-SELECT */}
              <div ref={dropdownRef} className='flex flex-col gap-1.5 relative'>
                <label className='text-sm font-medium text-gray-700'>Categories</label>
                <div 
                  className='flex flex-wrap items-center gap-2 rounded-md border border-gray-200 p-2 min-h-[42px] focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-100'
                  onClick={() => setShowCategoryDropdown(true)}
                >
                  {selectedCategories.map(cat => (
                    <span key={cat} className='flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-medium border border-blue-100'>
                      {cat}
                      <FaTimes className='cursor-pointer hover:text-blue-900' onClick={() => setSelectedCategories(prev => prev.filter(c => c !== cat))} />
                    </span>
                  ))}
                  <input 
                    type="text"
                    value={categoryInput}
                    onChange={(e) => setCategoryInput(e.target.value)}
                    onFocus={() => setShowCategoryDropdown(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault(); // Prevents the form from submitting prematurely
                        const val = categoryInput.trim();
                        if (val && !selectedCategories.includes(val)) {
                          setSelectedCategories([...selectedCategories, val]);
                          setCategoryInput('');
                          setShowCategoryDropdown(false);
                        }
                      }
                    }}
                    placeholder={selectedCategories.length === 0 ? "Type to search categories..." : ""}
                    className='flex-1 outline-none text-sm min-w-[120px] bg-transparent'
                  />
                </div>
                
                {/* Dropdown Menu */}
                {showCategoryDropdown && (
                  <div className='absolute z-10 top-[70px] left-0 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto'>
                    {SUGGESTED_CATEGORIES
                      .filter(c => c.toLowerCase().includes(categoryInput.toLowerCase()) && !selectedCategories.includes(c))
                      .map(cat => (
                        <div 
                          key={cat} 
                          className='px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer transition-colors'
                          onClick={() => {
                            setSelectedCategories([...selectedCategories, cat])
                            setCategoryInput('')
                            setShowCategoryDropdown(false)
                          }}
                        >
                          {cat}
                        </div>
                    ))}
                  </div>
                )}
              </div>

              <div className='flex flex-col gap-1.5'>
                <label className='text-sm font-medium text-gray-700'>Bio / Description</label>
                <textarea {...register('bio', )} placeholder='Tell customers about your shop...' rows={3} className='rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 resize-none' />
              </div>

              <button type='button' onClick={() => handleNextStep(['name', 'bio'])} className='mt-2 rounded-md bg-gray-900 py-2 text-sm font-medium text-white transition-opacity hover:opacity-85'>
                Continue
              </button>
            </div>
          </div>

          {/* STEP 2: Operations */}
          <div ref={(el) => { stepRefs.current[1] = el }} className='w-full flex-shrink-0 p-8'>
            <h1 className='mb-1 text-xl font-semibold text-gray-900'>Operations & Location</h1>
            <p className='mb-6 text-sm text-gray-500'>Where are you located and when are you open?</p>
            
            <div className='flex flex-col gap-5'>
              <div className='flex flex-col gap-1.5'>
                <label className='text-sm font-medium text-gray-700'>Physical Address</label>
                <input {...register('address', { required: 'Address is required' })} placeholder='123 Main St, City, Country' className='rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100' />
                {errors.address && <p className='text-xs text-red-500'>{errors.address.message}</p>}
              </div>

              {/* CUSTOM OPENING HOURS SCHEDULER (TABBED VIEW) */}
              <div className='flex flex-col gap-3'>
                <label className='text-sm font-medium text-gray-700'>Weekly Schedule</label>

                {/* Day Selection Tabs */}
                <div className='flex flex-wrap gap-1.5'>
                  {DAYS_OF_WEEK.map((day) => {
                    const isOpen = schedule[day].isOpen;
                    const isActive = activeDay === day;
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => setActiveDay(day)}
                        className={`relative flex-1 min-w-[40px] py-2 rounded-md text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-gray-900 text-white shadow-md'
                            : isOpen
                            ? 'bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100'
                            : 'bg-gray-50 text-gray-400 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {day.substring(0, 3)}
                        {/* Blue dot indicator so users can see which days are open without clicking */}
                        {isOpen && !isActive && (
                          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-blue-500 rounded-full" />
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Active Day Configuration Panel */}
                <div className='mt-1 p-4 border border-gray-200 rounded-lg bg-gray-50 flex flex-col gap-4 shadow-inner'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-bold text-gray-800'>{activeDay} Hours</span>
                    
                    {/* Modern Toggle Switch */}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={schedule[activeDay].isOpen}
                          onChange={(e) => setSchedule(prev => ({
                            ...prev,
                            [activeDay]: { ...prev[activeDay], isOpen: e.target.checked }
                          }))}
                        />
                        <div className={`block w-10 h-6 rounded-full transition-colors ${schedule[activeDay].isOpen ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                        <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${schedule[activeDay].isOpen ? 'translate-x-4' : ''}`}></div>
                      </div>
                      <span className="text-xs font-medium text-gray-600 w-10">
                        {schedule[activeDay].isOpen ? 'Open' : 'Closed'}
                      </span>
                    </label>
                  </div>

                  {schedule[activeDay].isOpen && (
                    <div className='flex items-center gap-2 animate-fadeIn'>
                      <select
                        value={schedule[activeDay].start}
                        onChange={(e) => setSchedule(prev => ({ ...prev, [activeDay]: { ...prev[activeDay], start: e.target.value } }))}
                        className='flex-1 text-sm border border-gray-200 rounded-md bg-white p-2.5 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 shadow-sm'
                      >
                        {TIME_SLOTS.map(time => <option key={time} value={time}>{time}</option>)}
                      </select>
                      <span className='text-gray-400 text-xs font-medium'>to</span>
                      <select
                        value={schedule[activeDay].end}
                        onChange={(e) => setSchedule(prev => ({ ...prev, [activeDay]: { ...prev[activeDay], end: e.target.value } }))}
                        className='flex-1 text-sm border border-gray-200 rounded-md bg-white p-2.5 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 shadow-sm'
                      >
                        {TIME_SLOTS.map(time => <option key={time} value={time}>{time}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div className='flex gap-3 mt-2'>
                <button type='button' onClick={handlePrevStep} className='flex-1 rounded-md border border-gray-200 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50'>
                  Back
                </button>
                <button type='button' onClick={() => handleNextStep(['address', 'website'])} className='flex-1 rounded-md bg-gray-900 py-2 text-sm font-medium text-white transition-opacity hover:opacity-85'>
                  Continue
                </button>
              </div>
            </div>
          </div>

          {/* STEP 3: Branding & Submission */}
          <div ref={(el) => { stepRefs.current[2] = el }} className='w-full flex-shrink-0 p-8'>
            <h1 className='mb-1 text-xl font-semibold text-gray-900'>Branding & Socials</h1>
            <p className='mb-6 text-sm text-gray-500'>Upload your shop banner and link your social profiles.</p>
            
            <form onSubmit={handleSubmit((data) => shopCreateMutation.mutate(data))} className='flex flex-col gap-4'>
              
              <div className='flex flex-col gap-1.5'>
                <label className='text-sm font-medium text-gray-700'>Cover Banner</label>
                <div className='relative overflow-hidden flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors'>
                  {bannerPreview ? (
                    <img src={bannerPreview} alt="Cover Preview" className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <div className='flex flex-col items-center text-gray-400'>
                      <FaImage className='mb-2 h-8 w-8' />
                      <span className='text-xs font-medium'>Click to upload banner</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0" />
                </div>
              </div>

              <div className='flex flex-col gap-1.5'>
                <label className='text-sm font-medium text-gray-700'>Social Links</label>
                <div className='flex flex-col gap-2'>
                  <div className='relative'>
                    <FaTwitter className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4' />
                    <input {...register('twitter')} placeholder='Twitter URL' className='w-full rounded-md border border-gray-200 pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100' />
                  </div>
                  <div className='relative'>
                    <FaInstagram className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4' />
                    <input {...register('instagram')} placeholder='Instagram URL' className='w-full rounded-md border border-gray-200 pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100' />
                  </div>
                </div>
              </div>

              {globalError && <p className='text-xs text-red-500 mt-1 bg-red-50 p-2 rounded border border-red-100'>{globalError}</p>}

              <div className='flex gap-3 mt-4'>
                <button type='button' onClick={handlePrevStep} disabled={shopCreateMutation.isPending} className='flex-1 rounded-md border border-gray-200 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50'>
                  Back
                </button>
                <button type='submit' disabled={shopCreateMutation.isPending} className='flex-1 rounded-md bg-gray-900 py-2 text-sm font-medium text-white transition-opacity hover:opacity-85 disabled:opacity-50'>
                  {shopCreateMutation.isPending ? 'Creating...' : 'Create Shop'}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  )
}