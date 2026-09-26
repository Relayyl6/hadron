'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { MoveRight, ChevronLeft, ChevronRight } from 'lucide-react';

// Extensive array feeding the dynamic Hero carousel
const HERO_SLIDES = [
  {
    id: 1,
    title: "The Ultimate Watch\nCollection 2026",
    subtitle: "Exclusive Offer",
    discount: "10% OFF",
    price: "Starting from $40",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop",
    bgGradient: "from-[#115061] to-[#0a2e38]",
    glowColor: "bg-cyan-400",
    buttonText: "Shop Collection",
    link: "/shop/collection-2026"
  },
  {
    id: 2,
    title: "Precision Crafted\nChronographs",
    subtitle: "New Arrivals",
    discount: "FREE SHIPPING",
    price: "Premium Series",
    image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?q=80&w=800&auto=format&fit=crop",
    bgGradient: "from-[#2c1e16] to-[#120c09]",
    glowColor: "bg-orange-500",
    buttonText: "Explore Series",
    link: "/shop/premium"
  },
  {
    id: 3,
    title: "Minimalist Urban\nEdition Watches",
    subtitle: "Limited Stock",
    discount: "15% OFF",
    price: "Starting from $85",
    image: "https://images.unsplash.com/photo-1508656919611-996ae5b70f81?q=80&w=800&auto=format&fit=crop",
    bgGradient: "from-[#1e293b] to-[#0f172a]",
    glowColor: "bg-indigo-500",
    buttonText: "Grab Yours",
    link: "/shop/urban"
  }
];

const Hero = () => {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Auto-play loop
  useEffect(() => {
    const timer = setInterval(() => {
      handleNext();
    }, 6000); // Changes every 6 seconds
    return () => clearInterval(timer);
  }, [currentIndex]);

  const handleNext = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % HERO_SLIDES.length);
      setIsTransitioning(false);
    }, 300); // Syncs with fade-out duration
  };

  const handlePrev = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
      setIsTransitioning(false);
    }, 300);
  };

  const activeSlide = HERO_SLIDES[currentIndex];

  return (
    <div className={`relative h-[85vh] w-full overflow-hidden bg-gradient-to-br ${activeSlide.bgGradient} transition-colors duration-1000`}>
      
      {/* Decorative Background Blur Elements */}
      <div className={`absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] opacity-20 transition-colors duration-1000 ${activeSlide.glowColor} translate-x-1/3 -translate-y-1/4 pointer-events-none`} />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-black/40 rounded-full blur-[100px] -translate-x-1/2 translate-y-1/4 pointer-events-none" />

      <div className="relative z-10 w-[90%] md:w-[85%] mx-auto h-full flex flex-col md:flex-row items-center justify-between">
        
        {/* Text Content */}
        <div 
          className={`w-full md:w-1/2 pt-10 md:pt-0 transition-all duration-500 ${isTransitioning ? 'opacity-0 -translate-x-8' : 'opacity-100 translate-x-0'}`}
        >
          <div className="inline-block px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-6">
            <p className="font-medium text-gray-200 text-sm tracking-wide">
              {activeSlide.price}
            </p>
          </div>
          
          <h1 className="text-white text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6 whitespace-pre-line drop-shadow-xl">
            {activeSlide.title}
          </h1>
          
          <p className="text-2xl md:text-3xl text-gray-300 font-medium mb-10 flex items-center gap-3">
            {activeSlide.subtitle} 
            <span className={`px-3 py-1 rounded-lg text-black font-bold text-xl transition-colors duration-1000 ${activeSlide.glowColor}`}>
              {activeSlide.discount}
            </span>
          </p>
          
          <button
            onClick={() => router.push(activeSlide.link)}
            className="group flex items-center gap-3 bg-white text-black px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all duration-300"
          >
            {activeSlide.buttonText} 
            <MoveRight className="group-hover:translate-x-2 transition-transform duration-300" />
          </button>
        </div>

        {/* Image Content */}
        <div 
          className={`w-full md:w-1/2 h-[50vh] md:h-[80%] flex justify-center items-center relative transition-all duration-700 ${isTransitioning ? 'opacity-0 scale-95 translate-x-8' : 'opacity-100 scale-100 translate-x-0'}`}
        >
          {/* Circular pedestal behind image */}
          <div className="absolute w-[300px] h-[300px] md:w-[450px] md:h-[450px] rounded-full bg-white/5 backdrop-blur-3xl border border-white/10 shadow-2xl" />
          
          <Image 
            src={activeSlide.image}
            alt={activeSlide.title}
            width={600}
            height={600}
            priority
            className="z-10 object-contain drop-shadow-[0_30px_30px_rgba(0,0,0,0.5)] hover:scale-105 transition-transform duration-700"
          />
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-8 z-20">
        <button 
          onClick={handlePrev}
          className="p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white transition-all hover:scale-110"
        >
          <ChevronLeft size={24} />
        </button>
        
        {/* Indicators */}
        <div className="flex gap-3">
          {HERO_SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setIsTransitioning(true);
                setTimeout(() => {
                  setCurrentIndex(idx);
                  setIsTransitioning(false);
                }, 300);
              }}
              className={`h-2.5 rounded-full transition-all duration-500 ${currentIndex === idx ? `w-8 ${activeSlide.glowColor}` : 'w-2.5 bg-white/30 hover:bg-white/50'}`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        <button 
          onClick={handleNext}
          className="p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white transition-all hover:scale-110"
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
}

export default Hero;