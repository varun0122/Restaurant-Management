import React, { useState, useEffect } from 'react';
import styles from './DishFormModal.module.css'; // We can reuse the same modal styles

const CategoryFormModal = ({ isOpen, onClose, onSave, category }) => {
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    if (category) {
      setFormData({ name: category.name, description: category.description });
    } else {
      setFormData({ name: '', description: '' });
    }
  }, [category, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>{category ? 'Edit Category' : 'Add New Category'}</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Category Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div className={styles.formGroup}>
            <label>Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange}></textarea>
          </div>
          <div className={styles.formActions}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.saveButton}>Save Category</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryFormModal;
