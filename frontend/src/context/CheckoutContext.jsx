import React, { createContext, useState, useContext, useEffect } from 'react';
import socket from '../socket'; // Import shared socket

const CheckoutContext = createContext();

export const CheckoutProvider = ({ children }) => {
  const defaultState = {
    isCheckoutActive: false,
    order: null,
    items: [], // Ensures `items` is always an array
    menuItems: [],
    managerUpiId: '',
    orderId: null,
  };
  
  const [checkoutState, setCheckoutState] = useState(() => {
    // Try to load from localStorage, but with proper error handling
    try {
      const saved = localStorage.getItem('checkoutState');
      if (saved) {
        const parsed = JSON.parse(saved);
        
        // Add validation for critical checkout dependencies
        const isValidState = parsed.menuItems?.length > 0 && 
                            parsed.managerUpiId?.trim() !== '' && 
                            parsed.items?.length > 0;
  
        return isValidState ? {
          items: parsed.items || [],
          isCheckoutActive: true,
          menuItems: parsed.menuItems || [],
          managerUpiId: parsed.managerUpiId || '',
          orderId: parsed.orderId || null,
          order: parsed.order || null
        } : defaultState;
      }
    } catch (err) {
      console.error('Error accessing checkout state:', err);
      // Clear potentially corrupted data
      try {
        localStorage.removeItem('checkoutState');
      } catch (clearErr) {
        console.error('Failed to clear localStorage:', clearErr);
      }
    }
    return defaultState;
  });

  useEffect(() => {
    const validatePersistedState = () => {
      if (checkoutState.isCheckoutActive) {
        const isValid = checkoutState.menuItems?.length > 0 && 
                       checkoutState.managerUpiId && 
                       checkoutState.items?.length > 0;
        
        if (!isValid) {
          console.warn('Clearing invalid persisted checkout state');
          clearCheckout();
        }
      }
    };
    validatePersistedState();
  }, []);
  
  // Save state to localStorage with proper error handling
  useEffect(() => {
    // Skip saving if nothing has changed to prevent unnecessary writes
    try {
      // Create a minimal state object to save - only store essential data
      const stateToSave = {
        items: checkoutState.items || [],
        isCheckoutActive: checkoutState.isCheckoutActive,
        // Only save minimal menu item data (id, name, price) to reduce storage size
        menuItems: checkoutState.menuItems?.map(item => ({
          _id: item._id,
          name: item.name,
          price: item.price
        })) || [],
        managerUpiId: checkoutState.managerUpiId || '',
        orderId: checkoutState.orderId,
        // Save only essential order data
        order: checkoutState.order ? {
          _id: checkoutState.order._id,
          status: checkoutState.order.status,
          orderDate: checkoutState.order.orderDate
        } : null
      };
      
      const serialized = JSON.stringify(stateToSave);
      
      // Check size before trying to save (localStorage typically has ~5MB limit)
      if (serialized.length > 4000000) { // ~4MB safety threshold
        console.warn('Checkout state too large to persist. Clearing checkout.');
        clearCheckout();
        return;
      }
      
      localStorage.setItem('checkoutState', serialized);
    } catch (error) {
      console.error('Failed to save checkout state:', error);
      // If we hit quota exception, clear the storage to prevent future errors
      if (error.name === 'QuotaExceededError' || error.code === 22) {
        try {
          localStorage.removeItem('checkoutState');
          // Optionally reset the state to default
          setCheckoutState(defaultState);
        } catch (clearError) {
          console.error('Failed to clear localStorage:', clearError);
        }
      }
    }
  }, [checkoutState]);
  
  // Automatically clear checkout if items become empty
  useEffect(() => {
    if (checkoutState.items?.length === 0 && checkoutState.isCheckoutActive) {
      clearCheckout();
    }
  }, [checkoutState.items, checkoutState.isCheckoutActive]);
  
  // Listen for socket events to clear checkout when order is canceled or disapproved
  useEffect(() => {
    const handleOrderCancelled = ({ orderId }) => {
      if (orderId === checkoutState.orderId) {
        clearCheckout();
      }
    };
    
    const handleOrderDisapproved = ({ orderId }) => {
      if (orderId === checkoutState.orderId) {
        clearCheckout();
      }
    };
    
    const handleOrderUpdate = (updatedOrder) => {
      if (updatedOrder._id === checkoutState.orderId) {
        if (['Cancelled', 'Disapproved'].includes(updatedOrder.status)) {
          clearCheckout();
        }
      }
    };
    
    socket.on('orderCancelled', handleOrderCancelled);
    socket.on('orderDisapproved', handleOrderDisapproved);
    socket.on('orderUpdate', handleOrderUpdate);
    
    return () => {
      socket.off('orderCancelled', handleOrderCancelled);
      socket.off('orderDisapproved', handleOrderDisapproved);
      socket.off('orderUpdate', handleOrderUpdate);
    };
  }, [checkoutState.orderId]);
  
  // Activate checkout with order details - with validation
  const activateCheckout = (order, menuItems, managerUpiId) => {
    // Validate input to prevent storing excessive data
    const validatedOrder = order ? {
      _id: order._id,
      items: order.items || [], 
      status: order.status,
      orderDate: order.orderDate
    } : null;
    
    // Filter menuItems to only include essential data
    const essentialMenuItems = menuItems?.map(item => ({
      _id: item._id,
      name: item.name,
      price: item.price
    })) || [];
    
    setCheckoutState({
      isCheckoutActive: true,
      order: validatedOrder,
      items: order?.items || [],
      menuItems: essentialMenuItems,
      managerUpiId: managerUpiId || '',
      orderId: order?._id || null,
    });
  };
  
  // Update item quantity in the cart
  const updateQuantity = (itemId, delta) => {
    setCheckoutState(prev => {
      const newItems = prev.items?.map(item => {
        if (item.menuItemId === itemId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean) || [];
      
      return {
        ...prev,
        items: newItems,
        order: prev.order ? { ...prev.order, items: newItems } : null,
        isCheckoutActive: newItems.length > 0,
      };
    });
  };
  
  // Add multiple items to the cart
  const addItems = (newItems, currentMenuItems, currentManagerUpiId) => {
    // Validate and minimize data to be stored
    const sanitizedMenuItems = currentMenuItems?.map(item => ({
      _id: item._id, 
      name: item.name,
      price: item.price
    }));
    
    setCheckoutState(prev => {
      const mergedItems = [...(prev.items || [])];
      newItems.forEach(newItem => {
        const existing = mergedItems.find(i => i.menuItemId === newItem.menuItemId);
        if (existing) {
          existing.quantity += newItem.quantity;
        } else {
          // Only store essential item data
          mergedItems.push({
            menuItemId: newItem.menuItemId,
            name: newItem.name,
            price: newItem.price,
            quantity: newItem.quantity
          });
        }
      });
      
      return {
        ...prev,
        items: mergedItems,
        menuItems: sanitizedMenuItems || prev.menuItems,
        managerUpiId: currentManagerUpiId || prev.managerUpiId,
        order: prev.order
          ? { ...prev.order, items: mergedItems }
          : { items: mergedItems, orderDate: new Date().toISOString(), status: 'Pending' },
        isCheckoutActive: true,
      };
    });
  };
  
  // Set order ID
  const setOrderId = (orderId) => {
    setCheckoutState(prev => ({ 
      ...prev, 
      orderId,
      order: prev.order ? { ...prev.order, _id: orderId } : { _id: orderId, items: prev.items, status: 'Pending' }
    }));
  };
  
  // Clear checkout state
  const clearCheckout = () => {
    setCheckoutState(defaultState);
    try {
      localStorage.removeItem('checkoutState');
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  };
  
  return (
    <CheckoutContext.Provider
      value={{
        ...checkoutState,
        activateCheckout,
        updateQuantity,
        addItems,
        setOrderId,
        clearCheckout,
      }}
    >
      {children}
    </CheckoutContext.Provider>
  );
};

export const useCheckout = () => useContext(CheckoutContext);
export default CheckoutContext;