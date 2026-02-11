import { Github, Twitter, Youtube } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t border-white/10 bg-black/50 backdrop-blur-lg mt-20">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-xl mb-4">Dino<span className="text-purple-500">Play</span></h3>
            <p className="text-gray-400 text-sm">Next-gen video streaming experience powered by AI and modern web tech.</p>
          </div>
          
          <div>
            <h4 className="font-bold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="hover:text-purple-400 cursor-pointer">Trending</li>
              <li className="hover:text-purple-400 cursor-pointer">Most Watched</li>
              <li className="hover:text-purple-400 cursor-pointer">New Arrivals</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Community</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="hover:text-purple-400 cursor-pointer">Discord</li>
              <li className="hover:text-purple-400 cursor-pointer">Twitter</li>
              <li className="hover:text-purple-400 cursor-pointer">Blog</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="hover:text-purple-400 cursor-pointer">Privacy Policy</li>
              <li className="hover:text-purple-400 cursor-pointer">Terms of Service</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">© 2026 DinoPlay Inc. All rights reserved.</p>
          <div className="flex gap-4">
            <Github className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" />
            <Twitter className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" />
            <Youtube className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" />
          </div>
        </div>
      </div>
    </footer>
  );
};