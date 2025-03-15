import React from 'react';
import { motion } from "framer-motion";

function SidebarToggle({ isVisible, toggleSidebar }) {
  return (
    <motion.button
      onClick={toggleSidebar}
      className="fixed top-6 left-6 z-50 w-10 h-10 rounded-full bg-black/80 backdrop-blur-md text-white shadow-lg flex items-center justify-center hover:bg-black/90 focus:outline-none transition-all duration-300"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      aria-label={isVisible ? 'Hide Sidebar' : 'Show Sidebar'}
    >
      <motion.div
        animate={{ rotate: isVisible ? 180 : 0 }}
        transition={{ duration: 0.3 }}
      >
        {isVisible ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        )}
      </motion.div>
    </motion.button>
  );
}

export default SidebarToggle;