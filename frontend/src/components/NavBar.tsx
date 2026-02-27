import { Search, User, Menu, Plane } from 'lucide-react';
import { useState } from 'react';

export const Navbar = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer group">
            <Plane className="w-8 h-8 text-indigo-500 group-hover:text-indigo-400 transition transform group-hover:rotate-12" />
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              AI Travel
            </span>
          </div>

          {/* Search Bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search destinations..."
                className="w-full pl-10 pr-4 py-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <a
              href="#flights"
              className="text-slate-300 hover:text-white transition font-medium"
            >
              Flights
            </a>

            <a
              href="#hotels"
              className="text-slate-300 hover:text-white transition font-medium"
            >
              Hotels
            </a>

            <a
              href="#activities"
              className="text-slate-300 hover:text-white transition font-medium"
            >
              Activities
            </a>

            <a
              href="#trips"
              className="text-slate-300 hover:text-white transition font-medium"
            >
              My Trips
            </a>
          </div>

          {/* User Icon */}
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-slate-800 rounded-lg transition">
              <User className="w-6 h-6 text-slate-300 hover:text-white" />
            </button>

            {/* Mobile Menu Button */}
            <button className="md:hidden p-2 hover:bg-slate-800 rounded-lg transition">
              <Menu className="w-6 h-6 text-slate-300 hover:text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Search */}
      <div className="md:hidden px-4 pb-3">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search destinations..."
            className="w-full pl-10 pr-4 py-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>
      </div>
    </nav>
  );
};
