import React, { useState } from 'react';
import axios from 'axios';

function FeedbackForm({ orderId }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  
  const submitFeedback = async () => {
    if (rating === 0) return;
    
    try {
      setIsSubmitting(true);
      await axios.post(`${import.meta.env.VITE_BASE_URL}/api/feedback`, { 
        orderId, 
        rating, 
        comment 
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      setIsSubmitted(true);
      setTimeout(() => {
        setRating(0);
        setComment('');
        setIsSubmitted(false);
      }, 3000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStarClick = (selectedRating) => {
    setRating(selectedRating);
  };

  const handleStarHover = (hoveredRating) => {
    setHoverRating(hoveredRating);
  };

  if (isSubmitted) {
    return (
      <div className="bg-white rounded-xl p-10 transition-all duration-700 shadow-xl max-w-lg mx-auto border border-gray-100">
        <div className="flex flex-col items-center justify-center py-10">
          <div className="text-green-500 mb-6 transform transition-all duration-700 scale-100 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-3xl font-light text-gray-800 mb-3">Thank You</h3>
          <p className="text-gray-500 text-center text-lg">Your feedback helps us craft extraordinary culinary experiences.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-10 transition-all duration-500 shadow-xl max-w-lg mx-auto border border-gray-100">
      <h2 className="text-4xl font-light text-gray-800 mb-8 tracking-tight">Your Experience</h2>
      
      <div className="space-y-10">
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-500 mb-4">How was your dining experience?</label>
          <div className="flex justify-center space-x-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleStarClick(star)}
                onMouseEnter={() => handleStarHover(star)}
                onMouseLeave={() => handleStarHover(0)}
                className={`transition-all duration-500 transform ${
                  (hoverRating >= star || rating >= star) 
                    ? 'text-amber-400 scale-110' 
                    : 'text-gray-200 hover:scale-105'
                } focus:outline-none`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12">
                  <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                </svg>
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex flex-col">
          <label htmlFor="comment" className="text-sm font-medium text-gray-500 mb-3">Share your thoughts</label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What made your experience memorable?"
            className="w-full px-6 py-4 rounded-lg bg-gray-50 border-0 focus:ring-2 focus:ring-gray-200 transition-all duration-300 resize-none h-40 text-gray-800"
          />
        </div>
        
        <button
          onClick={submitFeedback}
          disabled={rating === 0 || isSubmitting}
          className={`w-full py-4 px-6 rounded-lg transition-all duration-300 text-white font-medium text-lg ${
            rating === 0 || isSubmitting
              ? 'bg-gray-200 cursor-not-allowed'
              : 'bg-black hover:bg-gray-900 active:bg-black'
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing
            </span>
          ) : "Submit Feedback"}
        </button>
      </div>
    </div>
  );
}

export default FeedbackForm;