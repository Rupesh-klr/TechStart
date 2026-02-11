import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer'; // 👈 Import Footer
import { GlobalPlayer } from '../video/GlobalPlayer';
import { SmokeBackground } from '../effects/SmokeBackground';

export const AppLayout = () => {
  return (
    <div className="relative min-h-screen text-white overflow-x-hidden bg-[#0f0f0f]">
      <SmokeBackground />
      <Navbar />
      
      <main className="pt-20 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Outlet /> 
      </main>

      <Footer /> {/* 👈 Add Footer here */}
      <GlobalPlayer />
    </div>
  );
};