import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-gray-200 bg-white py-5">
      <div className="container flex flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left">
        <span className="font-display text-sm font-semibold text-gray-700">Holiday Planner</span>
        <p className="text-xs text-gray-400">
          © {new Date().getFullYear()} Developed by Vasco Sousa. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;