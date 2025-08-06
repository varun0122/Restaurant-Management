import React, { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig';
import styles from './StaffManagementPage.module.css';
import { FiEdit, FiTrash2, FiPlusCircle } from 'react-icons/fi';
import StaffFormModal from '../components/StaffFormModal'; // We will create this next

const StaffManagementPage = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State for the modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/accounts/');
      setStaff(response.data);
    } catch (err) {
      setError('Failed to fetch staff data. You must be a superuser to view this page.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (user = null) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingUser(null);
    setIsModalOpen(false);
  };

  const handleSaveUser = async (formData) => {
    try {
      if (editingUser) {
        // Update existing user
        await apiClient.put(`/accounts/${editingUser.id}/`, formData);
      } else {
        // Create new user
        await apiClient.post('/accounts/', formData);
      }
      fetchData(); // Refresh data
      handleCloseModal();
    } catch (err) {
      const errorData = err.response?.data;
      let errorMessage = 'Failed to save user.';
      if (errorData) {
        // Format the error message from the backend
        errorMessage += '\n' + Object.keys(errorData).map(key => `${key}: ${errorData[key].join(', ')}`).join('\n');
      }
      alert(errorMessage);
      console.error(err);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user account? This action cannot be undone.')) {
      try {
        await apiClient.delete(`/accounts/${userId}/`);
        setStaff(staff.filter(user => user.id !== userId));
      } catch (err) {
        alert('Failed to delete user.');
        console.error(err);
      }
    }
  };

  if (loading) {
    return <div className={styles.container}><h2>Loading Staff...</h2></div>;
  }

  if (error) {
    return <div className={`${styles.container} ${styles.error}`}><h2>{error}</h2></div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Staff Management</h1>
        <button className={styles.addButton} onClick={() => handleOpenModal()}>
          <FiPlusCircle /> Add New Staff
        </button>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Username</th>
              <th>Full Name</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.map(user => (
              <tr key={user.id}>
                <td>{user.username}</td>
                <td>{`${user.first_name} ${user.last_name}`}</td>
                <td>
                  <span className={user.is_superuser ? styles.superuser : styles.staff}>
                    {user.is_superuser ? 'Superuser' : 'Staff'}
                  </span>
                </td>
                <td className={styles.actions}>
                  <button className={styles.actionButton} onClick={() => handleOpenModal(user)}><FiEdit /></button>
                  <button 
                    className={`${styles.actionButton} ${styles.deleteButton}`}
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <StaffFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveUser}
        user={editingUser}
      />
    </div>
  );
};

export default StaffManagementPage;
