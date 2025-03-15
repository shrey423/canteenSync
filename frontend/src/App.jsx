import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { CheckoutProvider } from './context/CheckoutContext';
import { Navigate } from 'react-router-dom';
// Page components
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import MenuManager from './pages/MenuManager';
import Profile from './pages/Profile';
import Feedback from './pages/Feedback';
import Analytics from './pages/Analytics';
import Checkout from './pages/Checkout';
import ItemFeedback from './pages/ItemFeedback';

// UI components
import Sidebar from './components/Sidebar';
import SidebarToggle from './components/SidebarToggle';
import Menu from './components/Menu';
import CheckoutLink from './components/CheckoutLink';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [role, setRole] = useState(null);
  const [sidebarVisible, setSidebarVisible] = useState(true);

  const toggleSidebar = () => setSidebarVisible(!sidebarVisible);

  useEffect(() => {
    const validateToken = () => {
      if (token) {
        try {
          const decoded = jwtDecode(token);
          setRole(decoded.role);
        } catch (err) {
          console.error('Invalid token:', err);
          localStorage.removeItem('token');
          setToken(null);
        }
      } else {
        setRole(null);
      }
    };
    
    validateToken();
  }, [token]);

  return (
      <CheckoutProvider>
        <Router>
          <div className="App">
            {role ? (
              <>
                <SidebarToggle 
                  isVisible={sidebarVisible} 
                  toggleSidebar={toggleSidebar} 
                />
                <Sidebar 
                  role={role} 
                  isVisible={sidebarVisible} 
                  setToken={setToken} 
                />
                
                {/* Main content area */}
                <div className={`transition-all duration-300 ease-in-out ${
                  sidebarVisible ? 'ml-64' : 'ml-0'
                }`}>
                  <Routes>
                    {/* Common routes */}
                    <Route path="/profile" element={<><Sidebar role={role} isVisible={sidebarVisible} setToken={setToken} />
      <Profile setToken={setToken} /></>} />
                    <Route path="/item-feedback/:feedbackId" element={<ItemFeedback />} />

                    {/* Student-specific routes */}
                    {role === 'student' && (
                      <>
                        <Route path="/" element={<Home />} />
                        <Route path="/menu" element={<Menu />} />
                        <Route path="/feedback" element={<Feedback />} />
                        <Route path="/checkout" element={<Checkout />} />
                      </>
                    )}

                    {/* Manager-specific routes */}
                    {role === 'manager' && (
                      <>
                        <Route path="/" element={<Home />} />
                        <Route path="/menu-manager" element={<MenuManager />} />
                        <Route path="/analytics" element={<Analytics />} />
                      </>
                    )}

                    {/* Fallback routes */}
                    <Route path="/login" element={<Login setToken={setToken} />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="*" element={<Home />} />
                  </Routes>
                </div>

                {/* Persistent checkout link (students only) */}
                {role === 'student' && <CheckoutLink role={role} />}
              </>
            ) : (
              <>
                {/* Auth routes for unauthenticated users */}
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login setToken={setToken} />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </>
            )}
          </div>
        </Router>
      </CheckoutProvider>
  );
}

export default App;