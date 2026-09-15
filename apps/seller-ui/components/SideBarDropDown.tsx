'use client';
import { useState } from 'react';
import { HiOutlineCreditCard } from 'react-icons/hi2'; // Or whatever icon library you use
import { FiChevronDown } from 'react-icons/fi';
import Link from 'next/link';

export default function SidebarDropdown() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full">
      {/* Main Accordion Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-3 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-3">
          <HiOutlineCreditCard className="text-xl" />
          <span className="font-medium">Payments</span>
        </div>
        <FiChevronDown
          className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Sub-menu */}
      {isOpen && (
        <div className="flex flex-col pl-11 pr-2 py-1 space-y-1 mt-1">
          <Link
            href="/products/new"
            className="px-3 py-2 text-sm text-gray-400 rounded-md hover:text-white hover:bg-gray-800/60 transition-colors"
          >
            Create a new product
          </Link>
          <Link
            href="/products"
            className="px-3 py-2 text-sm text-gray-400 rounded-md hover:text-white hover:bg-gray-800/60 transition-colors"
          >
            View all products
          </Link>
        </div>
      )}
    </div>
  );
}
