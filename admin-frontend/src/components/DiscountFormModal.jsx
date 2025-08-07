import React, { useState, useEffect } from 'react';
import styles from './DiscountFormModal.module.css';

const DiscountFormModal = ({ isOpen, onClose, onSave, discount }) => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (discount) {
      setFormData(discount);
    } else {
      // Default state for a new discount
      setFormData({
        code: '',
        discount_type: 'PERCENTAGE',
        value: '',
        is_active: true,
        requires_staff_approval: false,
      });
    }
  }, [discount, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>{discount ? 'Edit Discount' : 'Add New Discount'}</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Discount Code</label>
            <input type="text" name="code" value={formData.code || ''} onChange={handleChange} required />
          </div>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Discount Type</label>
              <select name="discount_type" value={formData.discount_type || 'PERCENTAGE'} onChange={handleChange}>
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED">Fixed Amount</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Value</label>
              <input type="number" name="value" value={formData.value || ''} onChange={handleChange} required step="0.01" />
            </div>
          </div>
          <div className={styles.checkboxGrid}>
            <div className={`${styles.formGroup} ${styles.checkboxGroup}`}>
              <input type="checkbox" id="is_active" name="is_active" checked={formData.is_active || false} onChange={handleChange} />
              <label htmlFor="is_active">Is Active?</label>
            </div>
            <div className={`${styles.formGroup} ${styles.checkboxGroup}`}>
              <input type="checkbox" id="requires_staff_approval" name="requires_staff_approval" checked={formData.requires_staff_approval || false} onChange={handleChange} />
              <label htmlFor="requires_staff_approval">Requires Staff Approval?</label>
            </div>
          </div>
          <div className={styles.formActions}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.saveButton}>Save Discount</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DiscountFormModal;
