import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { Toaster } from 'react-hot-toast';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="py-6 flex-grow">
        <div className="container">
          {children}
        </div>
      </main>
      <Footer />
      <Toaster position="top-right" />
    </div>
  );
};

export default Layout;