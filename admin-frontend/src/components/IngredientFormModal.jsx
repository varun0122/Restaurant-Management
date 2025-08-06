import React, { useState, useEffect } from 'react';
import styles from './IngredientFormModal.module.css';

const IngredientFormModal = ({ isOpen, onClose, onSave, ingredient }) => {
  const [formData, setFormData] = useState({});
  const UNIT_CHOICES = [
    { value: 'g', label: 'Grams (g)' },
    { value: 'kg', label: 'Kilograms (kg)' },
    { value: 'ml', label: 'Milliliters (ml)' },
    { value: 'l', label: 'Liters (l)' },
    { value: 'pcs', label: 'Pieces (pcs)' },
  ];

  useEffect(() => {
    if (ingredient) {
      setFormData(ingredient);
    } else {
      // Default state for a new ingredient
      setFormData({
        name: '',
        current_stock: '0.00',
        unit: 'g',
        low_stock_threshold: '0.00',
      });
    }
  }, [ingredient, isOpen]);

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
        <h2>{ingredient ? 'Edit Ingredient' : 'Add New Ingredient'}</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Ingredient Name</label>
            <input type="text" name="name" value={formData.name || ''} onChange={handleChange} required />
          </div>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Current Stock</label>
              <input type="number" name="current_stock" value={formData.current_stock || ''} onChange={handleChange} required step="0.01" />
            </div>
            <div className={styles.formGroup}>
              <label>Unit</label>
              <select name="unit" value={formData.unit || 'g'} onChange={handleChange}>
                {UNIT_CHOICES.map(choice => (
                    <option key={choice.value} value={choice.value}>{choice.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Low Stock Threshold</label>
            <input type="number" name="low_stock_threshold" value={formData.low_stock_threshold || ''} onChange={handleChange} required step="0.01" />
          </div>
          <div className={styles.formActions}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.saveButton}>Save Ingredient</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IngredientFormModal;
