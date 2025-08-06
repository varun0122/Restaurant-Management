import React, { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig';
import styles from './InventoryPage.module.css';
import { FiEdit, FiTrash2, FiPlusCircle } from 'react-icons/fi';
import IngredientFormModal from '../components/IngredientFormModal'; // We will create this next

const InventoryPage = () => {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State for the modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/inventory/');
      setIngredients(response.data);
    } catch (err) {
      setError('Failed to fetch inventory data. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (ingredient = null) => {
    setEditingIngredient(ingredient);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingIngredient(null);
    setIsModalOpen(false);
  };

  const handleSaveIngredient = async (formData) => {
    try {
      if (editingIngredient) {
        // Update existing ingredient
        await apiClient.put(`/inventory/${editingIngredient.id}/`, formData);
      } else {
        // Create new ingredient
        await apiClient.post('/inventory/', formData);
      }
      fetchData(); // Refresh data
      handleCloseModal();
    } catch (err) {
      alert(`Failed to save ingredient: ${err.response?.data?.detail || err.message}`);
      console.error(err);
    }
  };

  const handleDeleteIngredient = async (ingredientId) => {
    if (window.confirm('Are you sure you want to delete this ingredient?')) {
      try {
        await apiClient.delete(`/inventory/${ingredientId}/`);
        setIngredients(ingredients.filter(ing => ing.id !== ingredientId));
      } catch (err) {
        alert('Failed to delete ingredient.');
        console.error(err);
      }
    }
  };

  if (loading) {
    return <div className={styles.container}><h2>Loading Inventory...</h2></div>;
  }

  if (error) {
    return <div className={`${styles.container} ${styles.error}`}><h2>{error}</h2></div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Inventory Management</h1>
        <button className={styles.addButton} onClick={() => handleOpenModal()}>
          <FiPlusCircle /> Add New Ingredient
        </button>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Ingredient Name</th>
              <th>Current Stock</th>
              <th>Unit</th>
              <th>Low Stock Threshold</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {ingredients.map(ingredient => (
              <tr key={ingredient.id}>
                <td>{ingredient.name}</td>
                <td>{parseFloat(ingredient.current_stock).toFixed(2)}</td>
                <td>{ingredient.unit}</td>
                <td>{parseFloat(ingredient.low_stock_threshold).toFixed(2)}</td>
                <td>
                  <span className={parseFloat(ingredient.current_stock) <= parseFloat(ingredient.low_stock_threshold) ? styles.lowStock : styles.inStock}>
                    {parseFloat(ingredient.current_stock) <= parseFloat(ingredient.low_stock_threshold) ? 'Low Stock' : 'In Stock'}
                  </span>
                </td>
                <td className={styles.actions}>
                  <button className={styles.actionButton} onClick={() => handleOpenModal(ingredient)}><FiEdit /></button>
                  <button 
                    className={`${styles.actionButton} ${styles.deleteButton}`}
                    onClick={() => handleDeleteIngredient(ingredient.id)}
                  >
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <IngredientFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveIngredient}
        ingredient={editingIngredient}
      />
    </div>
  );
};

export default InventoryPage;
