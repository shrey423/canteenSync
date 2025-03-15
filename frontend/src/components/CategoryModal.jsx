import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function CategoryModal({ open, onClose, category, onSuccess }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (category) {
      setName(category.name);
    }
  }, [category]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (category) {
        res = await axios.put(`/api/categories/${category._id}`, { name }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        res = await axios.post('/api/categories', { name }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      onSuccess(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    }
  };

  if (!open) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2 className="modal-heading">
          {category ? 'Edit Category' : 'New Category'}
        </h2>
        
        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Category name"
            className="input-field"
            required
          />
          
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {category ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}