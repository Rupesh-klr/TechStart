import { Search, Bell, Menu, User } from 'lucide-react';

export const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 h-16 z-40 border-b border-white/10 bg-black/20 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto h-full px-4 flex items-center justify-between">
        {/* Left: Logo */}
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <Menu className="w-5 h-5 text-white" />
          </button>
          <span className="text-xl font-bold tracking-tighter text-white select-none">
            Dino<span className="text-purple-500">Play</span>
          </span>
        </div>
        
        {/* Center: Search */}
        <div className="hidden md:flex flex-1 max-w-xl mx-8">
          <div className="w-full relative group">
            <input 
              type="text" 
              placeholder="Search for videos..." 
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-full py-2 px-10 text-sm text-white focus:outline-none focus:border-purple-500 transition-all placeholder:text-gray-500"
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500 group-focus-within:text-purple-500 transition-colors" />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors relative">
            <Bell className="w-5 h-5 text-gray-300" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-black"></span>
          </button>
          <button className="p-1 hover:bg-white/10 rounded-full transition-colors ml-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
          </button>
        </div>
      </div>
    </nav>
  );
};