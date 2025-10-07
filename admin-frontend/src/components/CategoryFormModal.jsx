import React, { useState, useEffect } from 'react';
import styles from './DishFormModal.module.css'; // Reusing the same modal styles

const CategoryFormModal = ({ isOpen, onClose, onSave, category }) => {
    // --- FIX: Added description and is_point_of_sale_only to the form state ---
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        is_point_of_sale_only: false,
    });

    useEffect(() => {
        if (category) {
            // Populate all fields when editing an existing category
            setFormData({
                name: category.name || '',
                description: category.description || '',
                is_point_of_sale_only: category.is_point_of_sale_only || false,
            });
        } else {
            // Reset to default values for a new category
            setFormData({
                name: '',
                description: '',
                is_point_of_sale_only: false,
            });
        }
    }, [category, isOpen]);

    if (!isOpen) {
        return null;
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        // Handle checkboxes differently from text inputs
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
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
                    {/* --- ADDED: Description textarea --- */}
                    <div className={styles.formGroup}>
                        <label>Description</label>
                        <textarea name="description" value={formData.description} onChange={handleChange}></textarea>
                    </div>
                    {/* --- ADDED: POS Only checkbox --- */}
                    <div className={`${styles.formGroup} ${styles.checkboxGroup}`}>
                        <input
                            type="checkbox"
                            name="is_point_of_sale_only"
                            id="is_point_of_sale_only"
                            checked={formData.is_point_of_sale_only}
                            onChange={handleChange}
                        />
                        <label htmlFor="is_point_of_sale_only">POS Only Category</label>
                        <small className={styles.checkboxHelper}>
                            If checked, this category and its dishes will only appear on the staff's POS screen.
                        </small>
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

