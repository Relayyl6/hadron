'import client';
import Link from 'next/link';
import React, { useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';

interface props {
  title: string;
  icon: React.ReactNode;
  isActive?: boolean;
  href?: string; // Made optional since a dropdown parent might just toggle instead of navigating
  children?: React.ReactNode; // Added to accept sub-links
}

const SideBarItems = ({
  icon,
  title,
  isActive,
  href = '#',
  children,
}: props) => {
  const [isOpen, setIsOpen] = useState(false);

  // If it has children, clicking it should toggle the dropdown instead of strictly navigating
  const handleClick = (e: React.MouseEvent) => {
    if (children) {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="w-full">
      <Link href={href} onClick={handleClick} className="block w-full">
        <div
          className={`flex justify-between items-center w-full min-h-12 h-full px-[13px] rounded-lg cursor-pointer transition-all duration-200 
              hover:bg-[#2b2f31] 
              ${isActive ? 'bg-[#0f3158] fill-blue-200 hover:bg-[#0f3158d6] scale-95' : ''}`}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center shrink-0">
              {icon}
            </div>
            <h5
              className={`text-lg transition-colors ${isActive ? 'text-white' : 'text-slate-200'}`}
            >
              {title}
            </h5>
          </div>

          {/* Show dropdown arrow only if it has sub-items */}
          {children && (
            <FiChevronDown
              className={`text-slate-400 text-xl transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            />
          )}
        </div>
      </Link>

      {/* Render sub-links dropdown container */}
      {children && isOpen && (
        <div className="flex flex-col pl-6 ml-5 border-l border-slate-700/60 mt-0.5 space-y-0.5">
          {children}
        </div>
      )}
    </div>
  );
};

export default SideBarItems;
