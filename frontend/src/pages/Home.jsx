import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { motion } from "framer-motion";
import StudentDashboard from "../components/StudentDashboard";
import ManagerDashboard from "../components/ManagerDashboard";
import topViewFood from "../assets/top-view-food-frame-with-copy-space.jpg";
import icon1 from "../assets/4070273.jpg";
import icon2 from "../assets/icon2.jpg";
import icon3 from "../assets/icon3.jpg";

function Home({ sidebarVisible }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const redirectToLogin = useCallback(() => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setLoading(false);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsLoggedIn(false);
      setLoading(false);
      return;
    }
    
    try {
      const decoded = jwtDecode(token);
      if (!decoded?.role) throw new Error("Invalid token");
      setUser(decoded);
      setIsLoggedIn(true);
    } catch (err) {
      console.error("Token decoding failed:", err);
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  }, [redirectToLogin]);

  const getContent = useCallback(() => {
    const path = location.pathname;
    if (["/menu", "/menu-manager", "/feedback"].includes(path)) return null;
    if (path === "/") return user?.role === "student" ? "orders" : "menu";
    return path.slice(1);
  }, [location.pathname, user?.role]);

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-black">
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="w-12 h-12 rounded-full bg-white"
      />
    </div>
  );
  
  // Show landing page when not logged in
  if (!isLoggedIn) {
    return <LandingPage />;
  }

  // Show dashboard when logged in
  return (
    <div className={`dashboard ${sidebarVisible ? "" : "sidebar-hidden"}`}>
      <h2 className="text-2xl font-bold mb-4">Canteen Management System</h2>
      {user.role === "student" ? (
        <StudentDashboard
          userId={user.id}
          managerId={user.managerId}
          content={getContent()}
        />
      ) : (
        <ManagerDashboard userId={user.id} content={getContent()} />
      )}
    </div>
  );
}

// Premium Landing page component with Apple-like aesthetics
function LandingPage() {
  const [scrollY, setScrollY] = useState(0);
  const featureRef = useRef(null);
  
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  const parallaxOffset = scrollY * 0.4;
  
  const navVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };
  
  const heroVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.8,
        delay: 0.3,
        ease: "easeOut"
      }
    }
  };
  
  const textVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (custom) => ({ 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.8,
        delay: 0.2 + custom * 0.2,
        ease: "easeOut"
      }
    })
  };
  
  const featureCardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: (custom) => ({ 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6,
        delay: 0.2 + custom * 0.2,
        ease: "easeOut"
      }
    })
  };
  
  const buttonVariants = {
    initial: { scale: 1 },
    hover: { 
      scale: 1.05,
      transition: {
        duration: 0.2,
        ease: "easeInOut"
      }
    },
    tap: { scale: 0.95 }
  };

  const handleScroll = (ref) => {
    ref.current.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Navigation */}
      <motion.nav 
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-black/30 py-5 px-8 flex justify-between items-center border-b border-white/10"
        initial="hidden"
        animate="visible"
        variants={navVariants}
      >
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mr-3">
            <span className="text-black font-bold">CMS</span>
          </div>
          <span className="font-light text-xl tracking-wide">Canteen OS</span>
        </div>
        <div className="flex gap-8 items-center">
          <a 
            href="#" 
            onClick={() => handleScroll(featureRef)}
            className="text-white/80 hover:text-white transition-colors duration-300"
          >
            Features
          </a>
          <motion.a 
            href="/login" 
            className="bg-white text-black px-6 py-2.5 rounded-full font-medium hover:bg-gray-200 transition-colors duration-300"
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            Log in
          </motion.a>
          <motion.a 
            href="/register" 
            className="bg-blue-500 text-white px-6 py-2.5 rounded-full font-medium hover:bg-blue-600 transition-colors duration-300"
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            Sign up
          </motion.a>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <motion.div 
        className="relative h-screen flex items-center justify-center overflow-hidden pt-20"
        initial="hidden"
        animate="visible"
        variants={heroVariants}
      >
        <div 
          className="absolute top-0 left-0 w-full h-full bg-cover bg-center opacity-40"
          style={{ 
            backgroundImage: `url(${topViewFood})`,
            transform: `translateY(${parallaxOffset}px) scale(${1 + scrollY * 0.0005})`,
          }}
        />
        
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black" />
        
        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
          <motion.h1 
            className="text-6xl md:text-7xl font-bold mb-6 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200"
            custom={0}
            variants={textVariants}
          >
            Redefining Canteen Management
          </motion.h1>
          
          <motion.p 
            className="text-xl md:text-2xl mb-10 max-w-4xl mx-auto font-light text-white/90 leading-relaxed"
            custom={1}
            variants={textVariants}
          >
            A sophisticated platform engineered for modern educational institutions.
            Seamless ordering, intuitive interface, powerful analytics.
          </motion.p>
          
          <motion.div 
            className="flex flex-col md:flex-row gap-6 justify-center"
            custom={2}
            variants={textVariants}
          >
            <motion.a 
              href="#features" 
              onClick={() => handleScroll(featureRef)}
              className="bg-white text-black px-8 py-4 rounded-full text-lg font-medium"
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              Discover Features
            </motion.a>
            <motion.a 
              href="/register" 
              className="bg-transparent text-white border border-white px-8 py-4 rounded-full text-lg font-medium backdrop-blur-sm"
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              Get Started
            </motion.a>
          </motion.div>
        </div>
        
        <div className="absolute bottom-10 left-0 right-0 flex justify-center">
          <motion.div
            animate={{
              y: [0, 10, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path d="M12 5V19M12 19L5 12M12 19L19 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.div>
        </div>
      </motion.div>

      {/* Key Features Section */}
      <div className="py-24 px-6 max-w-6xl mx-auto" id="features" ref={featureRef}>
        <motion.h2 
          className="text-5xl font-bold mb-6 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          Exceptional Features
        </motion.h2>
        
        <motion.p 
          className="mb-16 text-xl text-center text-white/80 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Engineered for perfection, our platform delivers an unparalleled experience in canteen management.
        </motion.p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <motion.div 
            className="rounded-2xl overflow-hidden bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-sm border border-white/10"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            variants={featureCardVariants}
          >
            <motion.div 
              className="p-6 h-48 relative overflow-hidden"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.4 }}
            >
              <img 
                src={icon1} 
                alt="Food ordering" 
                className="w-full h-full object-cover rounded-xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                <h3 className="font-bold text-xl">Effortless Ordering</h3>
              </div>
            </motion.div>
            <div className="p-6">
              <p className="text-white/80">Experience the convenience of placing orders from any device with our intuitive interface and real-time updates.</p>
            </div>
          </motion.div>
          
          {/* Feature 2 */}
          <motion.div 
            className="rounded-2xl overflow-hidden bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-sm border border-white/10"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={1}
            variants={featureCardVariants}
          >
            <motion.div 
              className="p-6 h-48 relative overflow-hidden"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.4 }}
            >
              <img 
                src={icon2} 
                alt="Student accounts" 
                className="w-full h-full object-cover rounded-xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                <h3 className="font-bold text-xl">Seamless Accounts</h3>
              </div>
            </motion.div>
            <div className="p-6">
              <p className="text-white/80">Manage student profiles and balances effortlessly with our secure, highly responsive account management system.</p>
            </div>
          </motion.div>
          
          {/* Feature 3 */}
          <motion.div 
            className="rounded-2xl overflow-hidden bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-sm border border-white/10"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={2}
            variants={featureCardVariants}
          >
            <motion.div 
              className="p-6 h-48 relative overflow-hidden"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.4 }}
            >
              <img 
                src={icon3} 
                alt="Mobile payments" 
                className="w-full h-full object-cover rounded-xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                <h3 className="font-bold text-xl">Frictionless Payments</h3>
              </div>
            </motion.div>
            <div className="p-6">
              <p className="text-white/80">Integrate with all major payment methods for a secure, swift transaction experience that delights both students and staff.</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 3D Feature Showcase */}
      <div className="py-24 bg-gradient-to-b from-black to-blue-900/30">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold mb-6">Cutting-Edge Technology</h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              Our platform leverages the latest advancements in web technology to deliver a premium experience.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h3 className="text-3xl font-bold mb-4">Immersive Dashboard</h3>
              <p className="text-lg text-white/80 mb-6">
                Navigate through your data with our intuitive, responsive dashboard that adapts to your needs and provides insights at a glance.
              </p>
              <ul className="space-y-4">
                {['Real-time analytics', 'Customizable views', 'Actionable insights'].map((item, index) => (
                  <motion.li 
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 * index }}
                    className="flex items-center"
                  >
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center mr-3">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M5 12L10 17L19 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    {item}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="rounded-2xl overflow-hidden bg-white/5 backdrop-blur-md border border-white/10 p-1"
            >
              <motion.div
                animate={{
                  rotateY: [0, 5, 0, -5, 0],
                  rotateX: [0, -5, 0, 5, 0]
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="rounded-xl overflow-hidden"
              >
                <div className="bg-gradient-to-tr from-blue-900 to-purple-800 p-6 rounded-xl">
                  <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium">Today's Orders</h4>
                      <div className="flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        <span className="text-sm">Live</span>
                      </div>
                    </div>
                    <div className="text-3xl font-bold">128</div>
                    <div className="text-green-400 text-sm">+12.5% from yesterday</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4">
                      <h4 className="font-medium mb-2">Revenue</h4>
                      <div className="text-2xl font-bold">$1,284</div>
                    </div>
                    <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4">
                      <h4 className="font-medium mb-2">Items Sold</h4>
                      <div className="text-2xl font-bold">342</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="py-24 px-6 text-center bg-gradient-to-b from-blue-900/30 to-black">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-5xl font-bold mb-8">Experience Excellence</h2>
          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-12">
            Join the institutions that are transforming their canteen management with our sophisticated platform.
          </p>
          
          <div className="flex flex-col md:flex-row justify-center gap-6">
            <motion.a 
              href="/login" 
              className="bg-white text-black px-8 py-4 rounded-full text-lg font-medium"
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              Log in
            </motion.a>
            <motion.a 
              href="/register" 
              className="bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-blue-700 transition-colors duration-300"
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              Create Account
            </motion.a>
          </div>
        </motion.div>
      </div>
      
      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mr-2">
                <span className="text-black font-bold text-sm">CMS</span>
              </div>
              <span className="font-light text-lg">Canteen OS</span>
            </div>
            <p className="text-white/60 text-sm">
              Redefining canteen management for the modern educational institution.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-4">Platform</h4>
            <ul className="space-y-2 text-white/60">
              <li><a href="#" className="hover:text-white transition-colors duration-200">Features</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-200">Pricing</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-200">Support</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-4">Company</h4>
            <ul className="space-y-2 text-white/60">
              <li><a href="#" className="hover:text-white transition-colors duration-200">About</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-200">Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-200">Careers</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-4">Legal</h4>
            <ul className="space-y-2 text-white/60">
              <li><a href="#" className="hover:text-white transition-colors duration-200">Privacy</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-200">Terms</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-200">Cookie Policy  i am sorry</a></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-6xl mx-auto mt-12 pt-6 border-t border-white/10 text-white/60 text-sm text-center">
          © {new Date().getFullYear()} Canteen OS. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default Home;