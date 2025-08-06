import React, { useState, useEffect } from 'react';
import styles from './DishFormModal.module.css';

const DishFormModal = ({ isOpen, onClose, onSave, dish, categories }) => {
  const [formData, setFormData] = useState({});
  const [imagePreview, setImagePreview] = useState(null);

  // When the 'dish' prop changes, update the form data
  useEffect(() => {
    if (dish) {
      setFormData({ ...dish, category: dish.category?.id || '' });
      // --- FIX: Construct the full URL for the image preview ---
      if (dish.image_url) {
        setImagePreview(`http://127.0.0.1:8000${dish.image_url}`);
      } else {
        setImagePreview(null);
      }
    } else {
      // Default state for a new dish
      setFormData({
        name: '',
        description: '',
        price: '',
        is_special: false,
        food_type: 'Vegetarian',
        category: '',
        image: null,
      });
      setImagePreview(null);
    }
  }, [dish, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>{dish ? 'Edit Dish' : 'Add New Dish'}</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Name</label>
            <input type="text" name="name" value={formData.name || ''} onChange={handleChange} required />
          </div>
          <div className={styles.formGroup}>
            <label>Description</label>
            <textarea name="description" value={formData.description || ''} onChange={handleChange}></textarea>
          </div>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Price</label>
              <input type="number" name="price" value={formData.price || ''} onChange={handleChange} required step="0.01" />
            </div>
            <div className={styles.formGroup}>
              <label>Category</label>
              <select name="category" value={formData.category || ''} onChange={handleChange} required>
                <option value="" disabled>Select a category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Food Type</label>
              <select name="food_type" value={formData.food_type || 'Vegetarian'} onChange={handleChange}>
                <option value="Vegetarian">Vegetarian</option>
                <option value="Non-Vegetarian">Non-Vegetarian</option>
                <option value="Vegan">Vegan</option>
              </select>
            </div>
             <div className={`${styles.formGroup} ${styles.checkboxGroup}`}>
              <input type="checkbox" id="is_special" name="is_special" checked={formData.is_special || false} onChange={handleChange} />
              <label htmlFor="is_special">Special Dish?</label>
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Image</label>
            <input type="file" name="image" onChange={handleImageChange} accept="image/*" />
            {imagePreview && <img src={imagePreview} alt="Preview" className={styles.imagePreview} />}
          </div>
          <div className={styles.formActions}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.saveButton}>Save Dish</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DishFormModal;
