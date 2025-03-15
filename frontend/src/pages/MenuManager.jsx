import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useDebounce } from 'use-debounce';

function CategoryModal({ open, onClose, category, onSuccess }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (category) {
      setName(category.name || '');
    } else {
      setName('');
    }
  }, [category]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setLoading(true);
      setError(null);
      
      let response;
      if (category) {
        // Edit existing category
        response = await axios.put(
          `${import.meta.env.VITE_BASE_URL}/api/categories/${category._id}`,
          { name },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // Create new category
        response = await axios.post(
          `${import.meta.env.VITE_BASE_URL}/api/categories`,
          { name },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      
      onSuccess(response.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save category');
      console.error('Category save error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96">
        <h3 className="text-lg font-semibold mb-4">
          {category ? 'Edit Category' : 'Add New Category'}
        </h3>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4 rounded">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter category name"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
          />
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : category ? 'Update Category' : 'Add Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MenuManager() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState({ 
    name: '', 
    price: '', 
    category: '', 
    description: '',
    image: null
  });
  const [allCategories, setAllCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebounce(searchTerm, 300);
  const [activeTab, setActiveTab] = useState('items');
  const [notification, setNotification] = useState(null);
  const token = localStorage.getItem('token');
  const [previewImage, setPreviewImage] = useState(null);

  const showNotification = (message, type = 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };
  useEffect(() => {
    fetchMenu();
    fetchAllCategories();
  }, []);

  useEffect(() => {
    if (activeTab === 'categories') {
      fetchFilteredCategories();
    }
  }, [debouncedSearch, activeTab]);

  useEffect(() => {
    if (activeTab === 'categories' && searchTerm === '') {
      setFilteredCategories(allCategories);
    }
  }, [activeTab, allCategories]);

  const fetchMenu = async () => {
    if (!token) {
      showNotification('Unauthorized: No token found');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await axios.get('${import.meta.env.VITE_BASE_URL}/api/menu', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMenuItems(res.data);
      console.log(res.data);
    } catch (err) {
      console.error('Error fetching menu:', err);
      showNotification('Failed to load menu. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllCategories = async () => {
    try {
      const res = await axios.get('${import.meta.env.VITE_BASE_URL}/api/categories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllCategories(res.data);
      if (activeTab === 'categories') {
        setFilteredCategories(res.data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      showNotification('Failed to load categories');
    }
  };

  const fetchFilteredCategories = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/categories?search=${debouncedSearch}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFilteredCategories(res.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
      showNotification('Failed to search categories');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewItem({ ...newItem, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const addMenuItem = async () => {
    if (!newItem.name || !newItem.price || !newItem.category) {
      showNotification('Please enter name, price, and select a category.');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('name', newItem.name);
      formData.append('price', parseFloat(newItem.price));
      formData.append('category', newItem.category);
      formData.append('description', newItem.description);
      if (newItem.image) {
        formData.append('image', newItem.image);
      }

      const res = await axios.post(
        '${import.meta.env.VITE_BASE_URL}/api/menu',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setMenuItems(prevItems => [...prevItems, res.data]);
      setNewItem({ name: '', price: '', category: '', description: '', image: null });
      setPreviewImage(null);
      showNotification('Item added successfully', 'success');
      fetchMenu();
    } catch (err) {
      console.error('Error adding item:', err);
      showNotification(err.response?.data?.error || 'Failed to add item. Please try again.');
    }
  };

  const deleteMenuItem = async (id) => {
    try {
      await axios.delete(`${import.meta.env.VITE_BASE_URL}/api/menu/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMenuItems(menuItems.filter(item => item._id !== id));
      showNotification('Item deleted successfully', 'success');
    } catch (err) {
      console.error('Error deleting item:', err);
      showNotification(err.response?.data?.error || 'Failed to delete item.');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('Are you sure? All items in this category will be moved to Uncategorized.')) {
      try {
        await axios.delete(`${import.meta.env.VITE_BASE_URL}/api/categories/${categoryId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAllCategories(prev => prev.filter(c => c._id !== categoryId));
        setFilteredCategories(prev => prev.filter(c => c._id !== categoryId));
        fetchMenu();
        showNotification('Category deleted successfully', 'success');
      } catch (err) {
        console.error('Error deleting category:', err);
        showNotification(err.response?.data?.error || 'Failed to delete category.');
      }
    }
  };

  const handleCategorySuccess = (newCategory) => {
    if (editCategory) {
      setAllCategories(prev => prev.map(c => c._id === newCategory._id ? newCategory : c));
      setFilteredCategories(prev => prev.map(c => c._id === newCategory._id ? newCategory : c));
    } else {
      setAllCategories(prev => [...prev, newCategory]);
      setFilteredCategories(prev => [...prev, newCategory]);
    }
    fetchMenu();
  };
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white px-4 py-8 md:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-light text-gray-900 mb-8 tracking-tight">
          Curate Your Menu
        </h2>

        {notification && (
          <div className={`mb-8 transition-all duration-300 ease-in-out transform ${notification.type === 'error' ? 'bg-red-50' : 'bg-green-50'} border-l-4 ${notification.type === 'error' ? 'border-red-500' : 'border-green-500'} rounded-md p-4 shadow-sm`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {notification.type === 'error' ? (
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm ${notification.type === 'error' ? 'text-red-700' : 'text-green-700'}`}>
                  {notification.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex rounded-full bg-gray-100 p-1">
            <button
              className={`px-6 py-2 text-sm font-medium rounded-full transition-all duration-200 ${activeTab === 'items' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              onClick={() => setActiveTab('items')}
            >
              Menu Items
            </button>
            <button
              className={`px-6 py-2 text-sm font-medium rounded-full transition-all duration-200 ${activeTab === 'categories' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              onClick={() => setActiveTab('categories')}
            >
              Categories
            </button>
          </div>
        </div>

        {activeTab === 'items' ? (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-12">
              <div className="px-8 py-6">
                <h3 className="text-xl font-light text-gray-900 mb-6">Add New Item</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                        <input
                          type="text"
                          placeholder="e.g., Truffle Risotto"
                          value={newItem.name}
                          onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                        <div className="relative rounded-xl">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <span className="text-gray-500">₹</span>
                          </div>
                          <input
                            type="number"
                            placeholder="0.00"
                            value={newItem.price}
                            onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                            className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-transparent transition-all duration-200"
                            min="0.01"
                            step="0.01"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select
                          value={newItem.category}
                          onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-transparent transition-all duration-200 appearance-none"
                          style={{ 
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23999' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 1rem center',
                            backgroundSize: '1em'
                          }}
                        >
                          <option value="">Select Category</option>
                          {allCategories.map((cat) => (
                            <option key={cat._id} value={cat._id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                          placeholder="Describe your dish in a few words..."
                          value={newItem.description}
                          onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-transparent transition-all duration-200"
                          rows="3"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Item Image</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-200 border-dashed rounded-xl h-64 bg-gray-50">
                      {previewImage ? (
                        <div className="space-y-1 text-center">
                          <div className="relative h-40 w-40 mx-auto">
                            <img 
                              src={previewImage} 
                              alt="Preview" 
                              className="h-40 w-40 object-cover rounded-lg"
                            />
                            <button 
                              onClick={() => {
                                setPreviewImage(null);
                                setNewItem({ ...newItem, image: null });
                              }}
                              className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-sm"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => document.getElementById('file-upload').click()}
                            className="text-sm text-gray-500 underline"
                          >
                            Change image
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1 text-center flex flex-col items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <div className="flex text-sm text-gray-600">
                            <label
                              htmlFor="file-upload"
                              className="relative cursor-pointer bg-white rounded-md font-medium text-gray-600 hover:text-gray-900 focus-within:outline-none"
                            >
                              <span>Upload an image</span>
                              <input
                                id="file-upload"
                                name="file-upload"
                                type="file"
                                className="sr-only"
                                accept="image/*"
                                onChange={handleImageChange}
                              />
                            </label>
                          </div>
                          <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 flex justify-end">
                  <button 
                    onClick={addMenuItem}
                    className="px-6 py-3 bg-black text-white text-sm rounded-full hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition-colors duration-200"
                  >
                    Add to Menu
                  </button>
                </div>
              </div>
            </div>

            {/* Menu Items List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="border-b border-gray-100 px-8 py-5 flex items-center justify-between">
                <h3 className="text-xl font-light text-gray-900">Menu Items</h3>
                <span className="text-sm text-gray-500">{menuItems.length} items</span>
              </div>
              
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : menuItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-100">
                  {menuItems.map(item => {
                    let categoryName = 'Uncategorized';
                    let categoryId = '';
                    if (item.category) {
                      if (typeof item.category === 'object') {
                        categoryId = item.category._id || '';
                        categoryName = item.category.name || 'Uncategorized';
                      } else if (typeof item.category === 'string') {
                        categoryId = item.category;
                        const foundCategory = allCategories.find(c => c._id === categoryId);
                        categoryName = foundCategory ? foundCategory.name : 'Uncategorized';
                      }
                    }
                    
                    return (
                      <div key={item._id} className="bg-white p-6 group relative">
                        <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button 
                            onClick={() => deleteMenuItem(item._id)}
                            className="p-1.5 bg-white rounded-full shadow-md hover:bg-red-50 text-gray-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-300 transition-colors duration-200"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        
                        <div className="mb-4 bg-gray-100 rounded-lg h-40 flex items-center justify-center overflow-hidden">
                          
                          {item.image ? (
                            <img 
                              src={getImageSource(item)} 
                              alt={item.name} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.log("Image failed to load", e);
                                e.target.style.display = 'none';
                                e.target.parentNode.classList.add('image-error');
                              }}
                            />
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          )}
                        </div>
                        
                        <div>
                          <span className="inline-block px-3 py-1 text-xs text-gray-500 bg-gray-100 rounded-full mb-2">
                            {categoryName}
                          </span>
                          <h4 className="font-medium text-gray-900">{item.name}</h4>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-gray-900 font-medium">${parseFloat(item.price).toFixed(2)}</p>
                          </div>
                          {item.description && (
                            <p className="text-sm text-gray-500 mt-2 line-clamp-2">{item.description}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="px-4 py-16 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No menu items yet</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by adding your first menu item above.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-12">
              <div className="px-8 py-6 flex items-center justify-between">
                <h3 className="text-xl font-light text-gray-900">Categories</h3>
                <button
                  onClick={() => {
                    setEditCategory(null);
                    setModalOpen(true);
                  }}
                  className="px-4 py-2 bg-black text-white text-sm rounded-full hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition-colors duration-200"
                >
                  New Category
                </button>
              </div>
              
              <div className="px-8 pb-6">
                <div className="relative mb-6">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search categories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-transparent transition-all duration-200"
                  />
                </div>
                
                <div className="overflow-hidden rounded-xl border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {filteredCategories.length > 0 ? (
                        filteredCategories.map(category => (
                          <tr key={category._id} className="hover:bg-gray-50 transition-colors duration-150">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{category.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {category.createdAt ? new Date(category.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              }) : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => {
                                  setEditCategory(category);
                                  setModalOpen(true);
                                }}
                                className="text-gray-500 hover:text-gray-900 mr-3 transition-colors duration-150"
                              >
                                Edit
                              </button>
                              {category.name !== 'Uncategorized' && (
                                <button
                                  onClick={() => handleDeleteCategory(category._id)}
                                  className="text-gray-500 hover:text-red-500 transition-colors duration-150"
                                >
                                  Delete
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="px-6 py-12 text-center text-sm text-gray-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <p className="mt-2">No categories found</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <CategoryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        category={editCategory}
        onSuccess={handleCategorySuccess}
      />
    </div>
  );
}
export default MenuManager;