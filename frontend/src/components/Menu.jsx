import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useCheckout } from '../context/CheckoutContext';
import { motion, AnimatePresence } from 'framer-motion';

function Menu({ managerId, onOrder }) {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState({});
  const [selectedItems, setSelectedItems] = useState([]);
  const [managerUpiId, setManagerUpiId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedItem, setExpandedItem] = useState(null);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const { activateCheckout, isCheckoutActive, addItems } = useCheckout();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [menuRes, categoriesRes, userRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_BASE_URL}/api/menu`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }),
          axios.get(`${import.meta.env.VITE_BASE_URL}/api/categories`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }),
          axios.get(`${import.meta.env.VITE_BASE_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          })
        ]);
        
        // Process menu items to handle binary image data
        const processedItems = menuRes.data.map(item => {
          if (item.image && item.image.data) {
            // Convert image data to base64 if it's coming as a Buffer or ArrayBuffer
            if (item.image.data.type === 'Buffer' || item.image.data.data) {
              item.image.dataUrl = arrayBufferToBase64(item.image.data.data || item.image.data);
            }
          }
          return item;
        });
        
        setMenuItems(processedItems);
        
        if (categoriesRes.data && Array.isArray(categoriesRes.data) && categoriesRes.data.length > 0) {
          const categoryLookup = {};
          categoriesRes.data.forEach(category => {
            categoryLookup[category._id.toString()] = category.name;
          });
          setCategories(categoryLookup);
        } else {
          console.warn('No categories found or invalid categories data');
        }
        
        setManagerUpiId(userRes.data.managerId?.upiId || '');
      } catch (err) {
        console.error('Error fetching data:', err);
        showMessage('Error fetching menu', false);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const showMessage = (msg, isSuccess = true, duration = 3000) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), duration);
  };

  const toggleItem = (itemId) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const toggleExpandItem = (itemId) => {
    setExpandedItem(expandedItem === itemId ? null : itemId);
  };

  const filterItems = (items) => {
    let filtered = items;
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchLower) ||
        (item.description && item.description.toLowerCase().includes(searchLower))
      );
    }
    if (activeCategory !== 'all') {
      filtered = filtered.filter(item => {
        const catName = getCategoryName(item.category);
        return catName === activeCategory;
      });
    }
    return filtered;
  };

  const getCategoryName = (categoryId) => {
    if (!categoryId) return 'Uncategorized';
    const catIdStr = categoryId.toString();
    return categories[catIdStr] || 'Uncategorized';
  };

  const getAllCategories = () => {
    const uniqueCategories = new Set(['all']);
    menuItems.forEach(item => {
      uniqueCategories.add(getCategoryName(item.category));
    });
    return Array.from(uniqueCategories);
  };

  const getCategoryColor = (category) => {
    const colorMap = {
      'Appetizers': '#f5f5f7',
      'Main Course': '#f5f5f7',
      'Desserts': '#f5f5f7',
      'Beverages': '#f5f5f7',
      'Specials': '#f5f5f7',
      'Salads': '#f5f5f7',
      'Soups': '#f5f5f7',
      'Sides': '#f5f5f7',
      'Breakfast': '#f5f5f7',
      'Lunch': '#f5f5f7',
      'Dinner': '#f5f5f7',
      'Uncategorized': '#f5f5f7'
    };
    return colorMap[category] || '#f5f5f7';
  };

  const proceedToCheckout = () => {
    if (selectedItems.length === 0) {
      showMessage('Select at least one item', false);
      return;
    }
    const newItems = selectedItems.map(id => ({ menuItemId: id, quantity: 1 }));
    if (isCheckoutActive) {
      addItems(newItems, menuItems, managerUpiId);
      showMessage('Items added to existing order', true);
    } else {
      const orderData = { managerId, items: newItems };
      activateCheckout(orderData, menuItems, managerUpiId);
      navigate('/checkout');
    }
    setSelectedItems([]);
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
    hover: { 
      y: -5, 
      scale: 1.02, 
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.06), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
    }
  };

  // Corrected arrayBufferToBase64 function to handle different data formats
  function arrayBufferToBase64(buffer) {
    // If buffer is already a Uint8Array
    if (buffer instanceof Uint8Array) {
      return uint8ArrayToBase64(buffer);
    }
    
    // If buffer is an array (like from MongoDB buffer)
    if (Array.isArray(buffer)) {
      const uint8Array = new Uint8Array(buffer);
      return uint8ArrayToBase64(uint8Array);
    }
    
    // If buffer is an ArrayBuffer or similar
    if (buffer && typeof buffer === 'object') {
      try {
        const uint8Array = new Uint8Array(buffer);
        return uint8ArrayToBase64(uint8Array);
      } catch (e) {
        console.error('Error converting buffer to base64:', e);
        return '';
      }
    }
    
    return '';
  }
  
  // Helper function to convert Uint8Array to base64
  function uint8ArrayToBase64(uint8Array) {
    let binary = '';
    for (let i = 0; i < uint8Array.byteLength; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    return window.btoa(binary);
  }
  
  // Get image source for a menu item
  const getImageSource = (item) => {
    if (!item.image) return null;
    
    // If we already processed the dataUrl in useEffect
    if (item.image.dataUrl) {
      return `data:${item.image.contentType || 'image/jpeg'};base64,${item.image.dataUrl}`;
    }
    
    // If we have raw data
    if (item.image.data) {
      // Handle Buffer or ArrayBuffer format
      if (item.image.data.type === 'Buffer' || item.image.data.data) {
        const base64 = arrayBufferToBase64(item.image.data.data || item.image.data);
        return `data:${item.image.contentType || 'image/jpeg'};base64,${base64}`;
      }
      
      // Handle other formats
      try {
        const base64 = arrayBufferToBase64(item.image.data);
        return `data:${item.image.contentType || 'image/jpeg'};base64,${base64}`;
      } catch (e) {
        console.error('Error creating image source:', e);
        return null;
      }
    }
    
    return null;
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Hero section - Apple-style minimalist hero */}
      <div className="relative h-screen max-h-96 mb-24 overflow-hidden bg-black">
        <div className="absolute inset-0 opacity-90">
          <div className="absolute inset-0 bg-gradient-to-r from-black to-black opacity-60"></div>
        </div>
        <div className="relative h-full max-w-7xl mx-auto px-6 flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="flex flex-col items-center text-center"
          >
            <h1 className="text-6xl font-sans font-medium tracking-tight mb-4 text-white">
              Curated <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-200 to-white">Culinary</span> Experiences
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mt-4 font-light leading-relaxed">
              Artfully prepared dishes that transcend ordinary dining, crafted with the finest ingredients for discerning palates.
            </p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="mt-8"
            >
              <svg className="w-12 h-12 mx-auto text-white animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Category Nav - Apple-style sticky navigation */}
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-white/90 border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center h-16 px-6">
            <div className="relative w-64 mr-auto">
              <input
                type="text"
                placeholder="Search menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-full py-2 px-4 pl-10 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-all duration-300"
              />
              <svg 
                className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
              {getAllCategories().map((category) => (
                <motion.button
                  key={category}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveCategory(category)}
                  className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
                    activeCategory === category
                      ? 'bg-gray-900 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {category === 'all' ? 'All Items' : category}
                </motion.button>
              ))}
            </div>
            {selectedItems.length > 0 && (
              <div className="ml-4">
                <div className="px-3 py-1 bg-gray-900 text-white rounded-full text-sm font-medium">
                  {selectedItems.length} selected
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Apple-style product display */}
      <main className="max-w-7xl mx-auto px-6 py-16">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="relative">
              <div className="h-24 w-24 rounded-full border-t-2 border-b-2 border-gray-900 animate-spin"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-12 w-12 rounded-full border-t-2 border-b-2 border-gray-500 animate-spin"></div>
            </div>
          </div>
        ) : (
          <>
            {/* Section intro - Apple-style section intro */}
            <div className="mb-20 text-center">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-medium mb-4"
              >
                Exceptional Quality. Unparalleled Taste.
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl text-gray-500 max-w-3xl mx-auto"
              >
                Each dish reflects our commitment to culinary excellence, sourced from the finest ingredients and expertly prepared by our chefs.
              </motion.p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {filterItems(menuItems).map((item) => (
                <motion.div
                  key={item._id}
                  layoutId={`item-${item._id}`}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  className="relative bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 group transition-all duration-300"
                >
                  {/* Item Image - Apple-style product photography */}
                  <div className="h-64 relative overflow-hidden bg-white">
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.6 }}
                      className="h-full flex items-center justify-center p-6"
                    >
                      {item.image ? (
                        <img
                          src={getImageSource(item)}
                          alt={item.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            console.log("Image failed to load", e);
                            e.target.style.display = 'none';
                            e.target.parentNode.classList.add('image-error');
                          }}
                        />
                      ) : (
                        <div
                          className="h-full w-full flex items-center justify-center"
                          style={{
                            background: `linear-gradient(135deg, ${getCategoryColor(getCategoryName(item.category))}, #ffffff)`
                          }}
                        >
                          <span className="text-6xl opacity-30">🍽️</span>
                        </div>
                      )}
                    </motion.div>
                    {item.isSpecial && (
                      <div className="absolute top-4 right-4 bg-black text-white font-medium px-3 py-1 rounded-full text-xs uppercase tracking-wider shadow-md">
                        Chef's Special
                      </div>
                    )}
                  </div>

                  {/* Content - Apple-style product description */}
                  <div className="p-8 relative">
                    <div 
                      className="absolute -top-3 left-8 px-3 py-1 rounded-full text-xs font-medium shadow-sm bg-gray-900 text-white"
                    >
                      {getCategoryName(item.category)}
                    </div>
                    <div className="mt-2">
                      <h3 className="text-xl font-medium mb-3 pr-16 text-gray-900">{item.name}</h3>
                      {item.description && (
                        <p className="text-gray-500 text-sm mb-6 line-clamp-2 leading-relaxed">{item.description}</p>
                      )}
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-2xl font-bold text-gray-900">₹{item.price.toFixed(2)}</p>
                          {item.isSpecial && item.discount && (
                            <p className="text-xs text-gray-500 mt-1">Save ₹{item.discount.toFixed(2)}</p>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Link 
                            to={`/item-feedback/${item._id}`}
                            className="p-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                            </svg>
                          </Link>
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => toggleItem(item._id)}
                            className={`p-2 rounded-full transition-colors ${
                              selectedItems.includes(item._id)
                                ? 'bg-gray-900 text-white shadow-md'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {selectedItems.includes(item._id) ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                              </svg>
                            )}
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Empty state - Apple-style empty state */}
            {filterItems(menuItems).length === 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-50 rounded-3xl p-16 text-center max-w-2xl mx-auto border border-gray-100"
              >
                <div className="w-24 h-24 mx-auto rounded-full bg-white flex items-center justify-center mb-6 shadow-md">
                  <svg 
                    className="h-12 w-12 text-gray-900" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                      d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                    />
                  </svg>
                </div>
                <h3 className="text-3xl font-medium text-gray-900 mb-4">
                  {menuItems.length === 0 
                    ? "The menu is being refined" 
                    : "No items match your criteria"}
                </h3>
                <p className="text-gray-500 mb-8 text-lg">
                  {menuItems.length === 0 
                    ? "Our culinary artists are meticulously developing each item to ensure perfection in every bite." 
                    : "Please adjust your search parameters to discover our exclusive offerings."}
                </p>
                {(searchQuery || activeCategory !== 'all') && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSearchQuery('');
                      setActiveCategory('all');
                    }}
                    className="px-8 py-3 bg-gray-900 text-white font-medium rounded-full hover:bg-gray-800 transition-colors shadow-md"
                  >
                    Reset Filters
                  </motion.button>
                )}
              </motion.div>
            )}
          </>
        )}
      </main>

      {/* Footer CTA - Apple-style footer */}
      {!selectedItems.length && (
        <div className="mt-20 py-16 bg-gray-50 border-t border-gray-100">
          <div className="max-w-3xl mx-auto text-center px-6">
            <h2 className="text-3xl font-medium mb-4">Experience Culinary Excellence</h2>
            <p className="text-gray-500 mb-8">Our menu is thoughtfully curated to provide an extraordinary dining experience that delights the senses.</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 bg-gray-900 text-white font-medium rounded-full hover:bg-gray-800 transition-all duration-300 shadow-md"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              Explore Menu
            </motion.button>
          </div>
        </div>
      )}

      {/* Checkout bar - Apple-style checkout */}
      <AnimatePresence>
        {selectedItems.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 py-4 bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-lg z-50"
          >
            <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
              <AnimatePresence>
                {message && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                  >
                    <span
                      className={`py-2 px-4 rounded-md inline-block ${
                        message.includes('Error')
                          ? 'bg-red-50 text-red-700 border border-red-100'
                          : 'bg-green-50 text-green-700 border border-green-100'
                      }`}
                    >
                      {message}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="ml-auto flex items-center space-x-6">
                <p className="text-gray-600">
                  <span className="font-medium text-gray-900">{selectedItems.length}</span> items selected
                </p>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={proceedToCheckout}
                  className="px-8 py-3 rounded-full bg-gray-900 text-white font-medium shadow-md hover:bg-gray-800 transition-all duration-300"
                >
                  Complete Order
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Menu;