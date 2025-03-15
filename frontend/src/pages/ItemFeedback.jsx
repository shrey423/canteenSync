import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

function ItemFeedback() {
  const { feedbackId } = useParams();
  const [feedbacks, setFeedbacks] = useState([]);
  const [itemName, setItemName] = useState('');
  const [itemImage, setItemImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFeedback = async () => {
      if (!feedbackId) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        const [feedbackRes, itemRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_BASE_URL}/api/menu/feedback/${feedbackId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }),
          axios.get(`${import.meta.env.VITE_BASE_URL}/api/menu`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          })
        ]);
        
        setFeedbacks(feedbackRes.data);
        
        const item = itemRes.data.find(i => i._id === feedbackId);
        setItemName(item ? item.name : 'Unknown Item');
        setItemImage(item?.image || '');
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching feedback:', err);
        setError('Unable to load feedback. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchFeedback();
  }, [feedbackId]);

  const getRatingStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <svg 
        key={i} 
        className={`h-5 w-5 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`} 
        fill="currentColor" 
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex justify-center items-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-500 font-light">Loading feedback...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex justify-center items-center">
        <div className="backdrop-blur-sm bg-white/90 rounded-3xl shadow-lg overflow-hidden border border-gray-100 p-8 max-w-md">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">Error</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <div className="mt-6">
              <button 
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-900 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="backdrop-blur-sm bg-white/90 rounded-3xl shadow-lg overflow-hidden border border-gray-100">
          <div className="px-8 pt-8 pb-6 border-b border-gray-100">
            <div className="flex items-center">
              {itemImage ? (
                <div className="h-16 w-16 rounded-xl bg-gray-100 overflow-hidden">
                  <img src={itemImage} alt={itemName} className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="h-16 w-16 rounded-xl bg-gray-100 flex items-center justify-center">
                  <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              <div className="ml-5">
                <h2 className="text-2xl font-medium text-gray-900">{itemName}</h2>
                <p className="text-gray-500 text-sm mt-1">
                  {feedbacks.length} {feedbacks.length === 1 ? 'review' : 'reviews'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-8">
            {feedbacks.length === 0 ? (
              <div className="text-center py-10">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No Feedback Yet</h3>
                <p className="mt-1 text-sm text-gray-500">This item hasn't received any feedback yet.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {feedbacks.map((feedback, index) => (
                  <div key={index} className="bg-gray-50 rounded-2xl p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <div className="flex">{getRatingStars(feedback.rating)}</div>
                        <span className="ml-2 text-gray-700 font-medium">{feedback.rating}/5</span>
                      </div>
                      <span className="text-sm text-gray-500 font-light">Order #{feedback.orderId?.slice(-6) || 'Unknown'}</span>
                    </div>
                    
                    {feedback.comment && (
                      <div className="mt-4">
                        <p className="text-gray-700 font-light">{feedback.comment}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ItemFeedback;