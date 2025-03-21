"use client";

import { useState } from "react";
import Link from "next/link";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-blue-900 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-white text-xl font-bold">IPL Live</span>
            </Link>
          </div>
          
          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/" className="text-white hover:bg-blue-800 px-3 py-2 rounded-md text-sm font-medium">
              Home
            </Link>
            <Link href="/schedule" className="text-white hover:bg-blue-800 px-3 py-2 rounded-md text-sm font-medium">
              Schedule
            </Link>
            <Link href="/teams" className="text-white hover:bg-blue-800 px-3 py-2 rounded-md text-sm font-medium">
              Teams
            </Link>
            <Link href="/live" className="bg-red-600 text-white hover:bg-red-700 px-3 py-2 rounded-md text-sm font-medium">
              Watch Live
            </Link>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-blue-800 focus:outline-none"
            >
              <svg
                className={`${isMenuOpen ? "hidden" : "block"} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg
                className={`${isMenuOpen ? "block" : "hidden"} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className={`${isMenuOpen ? "block" : "hidden"} md:hidden`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <Link href="/" className="text-white hover:bg-blue-800 block px-3 py-2 rounded-md text-base font-medium">
            Home
          </Link>
          <Link href="/schedule" className="text-white hover:bg-blue-800 block px-3 py-2 rounded-md text-base font-medium">
            Schedule
          </Link>
          <Link href="/teams" className="text-white hover:bg-blue-800 block px-3 py-2 rounded-md text-base font-medium">
            Teams
          </Link>
          <Link href="/live" className="bg-red-600 text-white hover:bg-red-700 block px-3 py-2 rounded-md text-base font-medium">
            Watch Live
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
