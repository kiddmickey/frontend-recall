import React from 'react';
import { BookHeart, Home } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const Header = () => {
  const { setCurrentPatient } = useAppContext();

  const handleHomeClick = () => {
    // Reset to home state by clearing current patient
    setCurrentPatient(null);
    // Scroll to top for better UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="bg-white shadow-sm py-4 sticky top-0 z-50">
      <div className="container mx-auto px-4 flex items-center justify-between max-w-6xl">
        <div className="flex items-center gap-2">
          <BookHeart className="text-blue-600 h-8 w-8" />
          <h1 className="text-2xl font-bold text-gray-800">Family Memories</h1>
        </div>
        <nav>
          <ul className="flex gap-6">
            <li>
              <button
                onClick={handleHomeClick}
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors font-medium"
              >
                <Home className="w-4 h-4" />
                Home
              </button>
            </li>
            <li>
              <a href="#memories" className="text-gray-600 hover:text-blue-600 transition-colors">
                Memories
              </a>
            </li>
            <li>
              <a href="#about" className="text-gray-600 hover:text-blue-600 transition-colors">
                About
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;