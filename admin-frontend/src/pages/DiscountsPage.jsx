import React, { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig';
import styles from './DiscountsPage.module.css';
import { FiEdit, FiTrash2, FiPlusCircle } from 'react-icons/fi';
import DiscountFormModal from '../components/DiscountFormModal';

const DiscountsPage = () => {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      // --- FIX: Use the correct URL for the admin discount endpoint ---
      const response = await apiClient.get('/discounts/manage/');
      setDiscounts(response.data);
    } catch (err) {
      setError('Failed to fetch discounts. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (discount = null) => {
    setEditingDiscount(discount);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingDiscount(null);
    setIsModalOpen(false);
  };

  const handleSaveDiscount = async (formData) => {
    try {
      if (editingDiscount) {
        await apiClient.put(`/discounts/manage/${editingDiscount.id}/`, formData);
      } else {
        await apiClient.post('/discounts/manage/', formData);
      }
      fetchData(); // Refresh data
      handleCloseModal();
    } catch (err) {
      alert(`Failed to save discount: ${err.response?.data?.detail || err.message}`);
      console.error(err);
    }
  };

  const handleDeleteDiscount = async (discountId) => {
    if (window.confirm('Are you sure you want to delete this discount code?')) {
      try {
        await apiClient.delete(`/discounts/manage/${discountId}/`);
        setDiscounts(discounts.filter(d => d.id !== discountId));
      } catch (err) {
        alert('Failed to delete discount.');
        console.error(err);
      }
    }
  };

  if (loading) {
    return <div className={styles.container}><h2>Loading Discounts...</h2></div>;
  }

  if (error) {
    return <div className={`${styles.container} ${styles.error}`}><h2>{error}</h2></div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Discount Management</h1>
        <button className={styles.addButton} onClick={() => handleOpenModal()}>
          <FiPlusCircle /> Add New Discount
        </button>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Code</th>
              <th>Type</th>
              <th>Value</th>
              <th>Status</th>
              <th>Requires Approval</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {discounts.map(discount => (
              <tr key={discount.id}>
                <td>{discount.code}</td>
                <td>{discount.discount_type}</td>
                <td>{discount.discount_type === 'PERCENTAGE' ? `${discount.value}%` : `₹${discount.value}`}</td>
                <td>
                  <span className={discount.is_active ? styles.active : styles.inactive}>
                    {discount.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>{discount.requires_staff_approval ? 'Yes' : 'No'}</td>
                <td className={styles.actions}>
                  <button className={styles.actionButton} onClick={() => handleOpenModal(discount)}><FiEdit /></button>
                  <button 
                    className={`${styles.actionButton} ${styles.deleteButton}`}
                    onClick={() => handleDeleteDiscount(discount.id)}
                  >
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DiscountFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveDiscount}
        discount={editingDiscount}
      />
    </div>
  );
};

export default DiscountsPage;
