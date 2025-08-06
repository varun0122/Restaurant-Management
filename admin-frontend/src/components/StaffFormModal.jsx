import React, { useState, useEffect } from 'react';
import styles from './StaffFormModal.module.css';

const StaffFormModal = ({ isOpen, onClose, onSave, user }) => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (user) {
      // For editing, we don't need the password unless it's being changed.
      setFormData({ ...user, password: '' });
    } else {
      // Default state for a new user.
      setFormData({
        username: '',
        password: '',
        first_name: '',
        last_name: '',
        is_staff: true, // Default to staff
        is_superuser: false,
      });
    }
  }, [user, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // For edits, if password is blank, don't send it.
    const dataToSave = { ...formData };
    if (user && !dataToSave.password) {
      delete dataToSave.password;
    }
    onSave(dataToSave);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>{user ? 'Edit Staff Member' : 'Add New Staff Member'}</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Username</label>
            <input type="text" name="username" value={formData.username || ''} onChange={handleChange} required />
          </div>
          <div className={styles.formGroup}>
            <label>Password</label>
            <input type="password" name="password" value={formData.password || ''} onChange={handleChange} placeholder={user ? 'Leave blank to keep current password' : ''} required={!user} />
          </div>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>First Name</label>
              <input type="text" name="first_name" value={formData.first_name || ''} onChange={handleChange} />
            </div>
            <div className={styles.formGroup}>
              <label>Last Name</label>
              <input type="text" name="last_name" value={formData.last_name || ''} onChange={handleChange} />
            </div>
          </div>
          <div className={styles.checkboxGrid}>
            <div className={`${styles.formGroup} ${styles.checkboxGroup}`}>
              <input type="checkbox" id="is_staff" name="is_staff" checked={formData.is_staff || false} onChange={handleChange} />
              <label htmlFor="is_staff">Staff Access (can log in to admin panel)</label>
            </div>
            <div className={`${styles.formGroup} ${styles.checkboxGroup}`}>
              <input type="checkbox" id="is_superuser" name="is_superuser" checked={formData.is_superuser || false} onChange={handleChange} />
              <label htmlFor="is_superuser">Superuser (full admin permissions)</label>
            </div>
          </div>
          <div className={styles.formActions}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.saveButton}>Save User</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StaffFormModal;
