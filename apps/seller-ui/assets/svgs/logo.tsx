import React from 'react';
import Image from 'next/image';
import Box from '../../components/Box';

const Logo = ({ title, subtitle }: { title: string; subtitle: string }) => {
  return (
    <Box
      css={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        gap: '12px', // Increased from 2px to 12px (Tailwind's gap-3) for modern breathing room
      }}
    >
      {/* 1. Image Wrapper: Handles the background, border, and rounding reliably */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 border border-white/10 shadow-sm overflow-hidden">
        <Image
          src="/hadron-logo.png"
          alt="Hadron Logo"
          width={120}
          height={120}
          priority
          className="object-contain"
        />
      </div>

      {/* 2. Text Container: Uses leading-none and min-w-0 to prevent layout breakage */}
      <div className="flex flex-col justify-center min-w-0 h-full items-start">
        <span className="text-base font-semibold tracking-tight text-white leading-none mb-1.5 truncate">
          {title ?? 'Hadron'}
        </span>
        <span className="text-xs font-medium text-zinc-400 leading-none whitespace-nowrap overflow-hidden text-ellipsis max-w-[170px]">
          {subtitle ?? 'Seller Workspace'}
        </span>
      </div>
    </Box>
  );
};

export default Logo;
