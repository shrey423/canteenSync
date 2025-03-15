import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from "framer-motion";

function Sidebar({ role, isVisible, setToken, setSidebarVisibility }) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const sidebarVariants = {
    open: { x: 0, opacity: 1 },
    closed: { x: "-100%", opacity: 0 }
  };

  const linkVariants = {
    hover: { 
      backgroundColor: "rgba(255, 255, 255, 0.1)", 
      scale: 1.03,
      transition: { duration: 0.2 }
    }
  };

  const handleLogout = (e) => {
    e.preventDefault(); // Prevent default link behavior
    
    // Remove token from localStorage
    localStorage.removeItem('token');
    
    // Update the token state in the parent component
    if (setToken) {
      setToken(null);
    }
    
    // Navigate to home page
    navigate('/');
  };
  
  // Custom navigation handler to prevent automatic sidebar closing
  const handleNavigation = (e, path) => {
    e.preventDefault(); // Prevent default link behavior
    
    // Only navigate if the path is different from current
    if (path !== currentPath) {
      navigate(path);
    }
    
    // On mobile devices, you might want to close the sidebar after navigation
    // If this is desired, uncomment the following line:
    // if (window.innerWidth < 768) setSidebarVisibility(false);
  };

  const menuItems = role === 'student' 
    ? [
        { path: "/", icon: "shopping-bag", label: "Orders" },
        { path: "/menu", icon: "menu", label: "Menu" },
        { path: "/profile", icon: "user", label: "Profile" },
        { path: "/feedback", icon: "message-circle", label: "Feedback" }
      ]
    : [
        { path: "/", icon: "shopping-bag", label: "Orders" },
        { path: "/menu-manager", icon: "menu", label: "Menu" },
        { path: "/profile", icon: "user", label: "Profile" },
        { path: "/analytics", icon: "bar-chart-2", label: "Analytics" }
      ];

  const renderIcon = (iconName) => {
    switch(iconName) {
      case 'shopping-bag':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
          </svg>
        );
      case 'menu':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
          </svg>
        );
      case 'user':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
          </svg>
        );
      case 'message-circle':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
          </svg>
        );
      case 'bar-chart-2':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div 
      className="fixed inset-y-0 left-0 bg-black/90 backdrop-blur-md w-72 shadow-2xl z-40 overflow-hidden"
      initial="closed"
      animate={isVisible ? "open" : "closed"}
      variants={sidebarVariants}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="flex flex-col h-full">
        <div className="px-8 py-10">
          <div className="flex items-center mb-10">
            {/* Logo or brand content could go here */}
          </div>
          
          <nav className="mb-auto">
            <ul className="space-y-2">
              {menuItems.map((item, index) => (
                <motion.li key={index} variants={linkVariants} whileHover="hover">
                  <a 
                    href={item.path}
                    onClick={(e) => handleNavigation(e, item.path)}
                    className={`flex items-center px-5 py-4 rounded-xl transition-all duration-300 ${
                      currentPath === item.path 
                        ? 'bg-blue-500 text-white' 
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    <span className="mr-4">{renderIcon(item.icon)}</span>
                    <span className="font-medium">{item.label}</span>
                    {currentPath === item.path && (
                      <motion.div 
                        className="ml-auto w-1.5 h-1.5 rounded-full bg-white" 
                        layoutId="activeIndicator"
                      />
                    )}
                  </a>
                </motion.li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-auto px-8 py-6 border-t border-white/10">
          <motion.button 
            onClick={handleLogout}
            className="w-full flex items-center px-5 py-4 text-white/70 hover:text-white rounded-xl transition-all duration-300"
            variants={linkVariants}
            whileHover="hover"
          >
            <svg className="w-5 h-5 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
            <span className="font-medium">Logout</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export default Sidebar;