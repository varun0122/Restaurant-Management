import React, { useState, useEffect } from 'react';
import styles from './DishFormModal.module.css';
import apiClient from '../api/axiosConfig'; // Import apiClient for direct calls
import { FiTrash2, FiPlus } from 'react-icons/fi';

const DishFormModal = ({ isOpen, onClose, onSave, dish, categories, allIngredients, onDataRefresh }) => {
  const [formData, setFormData] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  
  const [newRecipeItem, setNewRecipeItem] = useState({ ingredient_id: '', quantity_required: '' });

  useEffect(() => {
    if (dish) {
      setFormData({ ...dish, category: dish.category?.id || '' });
      if (dish.image_url) {
        setImagePreview(`http://127.0.0.1:8000${dish.image_url}`);
      } else {
        setImagePreview(null);
      }
    } else {
      setFormData({
        name: '', description: '', price: '', is_special: false,
        food_type: 'Vegetarian', category: '', image: null, is_available: true,
      });
      setImagePreview(null);
    }
  }, [dish, isOpen]);

  if (!isOpen) return null;

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

  const handleRecipeChange = (e) => {
    const { name, value } = e.target;
    setNewRecipeItem(prev => ({ ...prev, [name]: value }));
  };

  const handleAddIngredient = async () => {
    if (!newRecipeItem.ingredient_id || !newRecipeItem.quantity_required) {
      alert('Please select an ingredient and enter a quantity.');
      return;
    }
    try {
      await apiClient.post(`/menu/dishes/${dish.id}/ingredients/`, newRecipeItem);
      setNewRecipeItem({ ingredient_id: '', quantity_required: '' }); // Reset form
      // Fetch the single dish again to get the updated ingredient list
      const response = await apiClient.get(`/menu/dishes/${dish.id}/`);
      setFormData(response.data); // Update the form data with the latest dish details
      onDataRefresh(); // Refresh the main page's dish list
    } catch (err) {
      alert('Failed to add ingredient to recipe.');
      console.error(err);
    }
  };

  const handleRemoveIngredient = async (ingredientId) => {
    if (window.confirm('Are you sure you want to remove this ingredient from the recipe?')) {
      try {
        await apiClient.delete(`/menu/dishes/${dish.id}/ingredients/${ingredientId}/`);
        // Fetch the single dish again to get the updated ingredient list
        const response = await apiClient.get(`/menu/dishes/${dish.id}/`);
        setFormData(response.data); // Update the form data
        onDataRefresh(); // Refresh the main page's dish list
      } catch (err) {
        alert('Failed to remove ingredient.');
        console.error(err);
      }
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
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
            <button type="submit" className={styles.saveButton}>Save Details</button>
          </div>
        </form>

        {dish && (
          <div className={styles.recipeSection}>
            <hr className={styles.divider} />
            <h4>Recipe Ingredients</h4>
            <ul className={styles.ingredientList}>
              {formData.ingredients && formData.ingredients.map(item => (
                <li key={item.id}>
                  <span>{item.ingredient.name} - {item.quantity_required} {item.ingredient.unit}</span>
                  <button onClick={() => handleRemoveIngredient(item.id)} className={styles.removeButton}><FiTrash2 /></button>
                </li>
              ))}
            </ul>
            <div className={styles.addIngredientForm}>
              <select name="ingredient_id" value={newRecipeItem.ingredient_id} onChange={handleRecipeChange}>
                <option value="" disabled>Select Ingredient</option>
                {allIngredients.map(ing => (
                  <option key={ing.id} value={ing.id}>{ing.name}</option>
                ))}
              </select>
              <input 
                type="number" 
                name="quantity_required" 
                placeholder="Quantity" 
                value={newRecipeItem.quantity_required}
                onChange={handleRecipeChange}
                step="0.01"
              />
              <button type="button" onClick={handleAddIngredient} className={styles.addButton}><FiPlus /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DishFormModal;
