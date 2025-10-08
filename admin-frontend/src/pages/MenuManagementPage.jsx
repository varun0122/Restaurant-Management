import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../api/axiosConfig';
import styles from './MenuManagementPage.module.css';
import { FiEdit, FiTrash2, FiPlusCircle, FiUpload, FiDownload, FiCheckSquare, FiXSquare } from 'react-icons/fi';
import DishFormModal from '../components/DishFormModal';
import CategoryFormModal from '../components/CategoryFormModal';

const MenuManagementPage = () => {
    const [dishes, setDishes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [allIngredients, setAllIngredients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const [isDishModalOpen, setIsDishModalOpen] = useState(false);
    const [editingDish, setEditingDish] = useState(null);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);

    // --- NEW: State to manage selected dishes for bulk actions ---
    const [selectedDishes, setSelectedDishes] = useState(new Set());

    const fetchData = async () => {
        try {
            setLoading(true);
            const [dishesResponse, categoriesResponse, ingredientsResponse] = await Promise.all([
            apiClient.get('/menu/manage-dishes/'),
            apiClient.get('/menu/manage-categories/'),
            apiClient.get('/inventory/')
        ]);
            setDishes(dishesResponse.data);
            setCategories(categoriesResponse.data);
            setAllIngredients(ingredientsResponse.data);
        } catch (err) {
            setError('Failed to fetch menu data. Please try again later.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const refreshDishData = async () => {
        const dishesResponse = await apiClient.get('/menu/dishes/');
        setDishes(dishesResponse.data);
    };

    // --- NEW: Handler to toggle a single dish's availability ---
    const handleToggleAvailability = async (dishToUpdate) => {
        const newAvailability = !dishToUpdate.is_available;
        try {
            // API call to update the specific dish
            await apiClient.patch(`/menu/dishes/${dishToUpdate.id}/`, {
                is_available: newAvailability
            });

            // Update state locally for immediate feedback
            setDishes(dishes.map(dish =>
                dish.id === dishToUpdate.id ? { ...dish, is_available: newAvailability } : dish
            ));
        } catch (err) {
            alert(`Failed to update availability: ${err.response?.data?.detail || err.message}`);
        }
    };

    // --- NEW: Handler for bulk availability updates ---
    const handleBulkUpdate = async (makeAvailable) => {
        const dishIds = Array.from(selectedDishes);
        if (dishIds.length === 0) {
            alert("Please select dishes to update.");
            return;
        }

        try {
            const response = await apiClient.post('/menu/dishes/bulk_update_availability/', {
                dish_ids: dishIds,
                is_available: makeAvailable
            });

            // Update state locally for immediate feedback
            setDishes(dishes.map(dish =>
                dishIds.includes(dish.id) ? { ...dish, is_available: makeAvailable } : dish
            ));

            // Clear selection and show success message
            setSelectedDishes(new Set());
            alert(response.data.message || 'Update successful!');

        } catch (err) {
            alert(`Bulk update failed: ${err.response?.data?.error || err.message}`);
        }
    };
    
    // --- NEW: Handlers for checkbox selection ---
    const handleSelectDish = (dishId) => {
        setSelectedDishes(prevSelected => {
            const newSelected = new Set(prevSelected);
            if (newSelected.has(dishId)) {
                newSelected.delete(dishId);
            } else {
                newSelected.add(dishId);
            }
            return newSelected;
        });
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allDishIds = new Set(dishes.map(d => d.id));
            setSelectedDishes(allDishIds);
        } else {
            setSelectedDishes(new Set());
        }
    };

    // --- Handlers for modals, delete, import etc. (no changes needed) ---
    const handleDownloadSample = () => {
        const sampleData = [{ "name": "Paneer Tikka", "description": "Grilled cottage cheese skewers.", "price": "250.00", "is_special": false, "food_type": "veg", "category_name": "Starters", "image_filename": "paneer_tikka.jpg" }, { "name": "Butter Chicken", "description": "Creamy chicken curry.", "price": "350.00", "is_special": true, "food_type": "non-veg", "category_name": "Main Course", "image_filename": "butter_chicken.png" }];
        const jsonString = JSON.stringify(sampleData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'sample_menu.json'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    };
    const handleImportClick = () => { fileInputRef.current.click(); };
    const handleFileImport = async (event) => {
        const file = event.target.files[0]; if (!file) return;
        const formData = new FormData(); formData.append('file', file);
        try {
            const response = await apiClient.post('/menu/dishes/bulk_import/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            let alertMessage = response.data.message;
            if (response.data.errors && response.data.errors.length > 0) {
                console.error("Import errors:", response.data.errors);
                const errorDetails = response.data.errors.map(err => { if (typeof err === 'object') { const dishName = Object.keys(err)[0]; const errorInfo = JSON.stringify(err[dishName]); return `- ${dishName}: ${errorInfo}`; } return `- ${err}`; }).join('\n');
                alertMessage += `\n\nSome dishes failed to import:\n${errorDetails}`;
            }
            alert(alertMessage); fetchData();
        } catch (err) { alert(`Import failed: ${err.response?.data?.error || err.message}`); } finally { event.target.value = null; }
    };
    const handleOpenDishModal = (dish = null) => { setEditingDish(dish); setIsDishModalOpen(true); };
    const handleCloseDishModal = () => { setEditingDish(null); setIsDishModalOpen(false); };
    const handleSaveDish = async (dishData) => { // This now receives the FormData object
    try {
        if (editingDish) {
            // --- UPDATE ---
            // Send a PUT request for updates
            await apiClient.put(`/menu/manage-dishes/${editingDish.id}/`, dishData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        } else {
            // --- CREATE ---
            // Send a POST request for new dishes
            await apiClient.post('/menu/manage-dishes/', dishData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        }
        fetchData(); // Refresh the main data grid
        handleCloseDishModal(); // Close the modal on success
    } catch (err) {
        // Your existing error handling
        alert(`Failed to save dish: ${err.response?.data?.detail || JSON.stringify(err.response?.data) || err.message}`);
    }
};

    const handleDeleteDish = async (dishId) => {
        if (window.confirm('Are you sure you want to delete this dish?')) {
            try { await apiClient.delete(`/menu/manage-dishes/${dishId}/`); setDishes(dishes.filter(dish => dish.id !== dishId)); } catch (err) { alert('Failed to delete dish.', err); }
        }
    };
    const handleOpenCategoryModal = (category = null) => { setEditingCategory(category); setIsCategoryModalOpen(true); };
    const handleCloseCategoryModal = () => { setEditingCategory(null); setIsCategoryModalOpen(false); };
    const handleSaveCategory = async (formData) => {
        try {
            if (editingCategory) { await apiClient.put(`/menu/manage-categories/${editingCategory.id}/`, formData); } else { await apiClient.post('/menu/manage-categories/', formData); }
            fetchData(); handleCloseCategoryModal();
        } catch (err) { alert(`Failed to save category: ${err.response?.data?.detail || err.message}`); }
    };
    const handleDeleteCategory = async (categoryId) => {
        if (window.confirm('Are you sure you want to delete this category? This may affect existing dishes.')) {
            try { await apiClient.delete(`/menu/manage-categories/${categoryId}/`); fetchData(); } catch (err) { alert('Failed to delete category.', err); }
        }
    };

    if (loading) return <div className={styles.container}><h2>Loading Menu...</h2></div>;
    if (error) return <div className={`${styles.container} ${styles.error}`}><h2>{error}</h2></div>;
    
    const isAllSelected = dishes.length > 0 && selectedDishes.size === dishes.length;

    return (
        <div className={styles.container}>
            {/* --- Category Section (Unchanged) --- */}
            <div className={styles.header}>
                <h2>Categories</h2>
                <button className={styles.addButton} onClick={() => handleOpenCategoryModal()}>
                    <FiPlusCircle /> Add New Category
                </button>
            </div>
            <div className={styles.categoryGrid}>
                {categories.map(cat => (
                    <div key={cat.id} className={styles.categoryCard}>
                        <span>{cat.name}</span>
                        <div className={styles.actions}>
                            <button className={styles.actionButton} onClick={() => handleOpenCategoryModal(cat)}><FiEdit /></button>
                            <button className={`${styles.actionButton} ${styles.deleteButton}`} onClick={() => handleDeleteCategory(cat.id)}><FiTrash2 /></button>
                        </div>
                    </div>
                ))}
            </div>

            {/* --- Dish Section --- */}
            <div className={`${styles.header} ${styles.dishHeader}`}>
                <h2>Dishes</h2>
                <div className={styles.headerActions}>
                    <input type="file" ref={fileInputRef} onChange={handleFileImport} style={{ display: 'none' }} accept=".zip" />
                    <button className={`${styles.addButton} ${styles.importButton}`} onClick={handleImportClick}><FiUpload /> Import Menu</button>
                    <button className={`${styles.addButton} ${styles.secondaryButton}`} onClick={handleDownloadSample}><FiDownload /> Download Sample</button>
                    <button className={styles.addButton} onClick={() => handleOpenDishModal()}><FiPlusCircle /> Add New Dish</button>
                </div>
            </div>

            {/* --- NEW: Bulk Actions Bar --- */}
            {selectedDishes.size > 0 && (
                <div className={styles.bulkActions}>
                    <span className={styles.bulkCount}>{selectedDishes.size} items selected</span>
                    <div className={styles.bulkButtons}>
                        <button className={styles.bulkAvailable} onClick={() => handleBulkUpdate(true)}>
                            <FiCheckSquare /> Mark as Available
                        </button>
                        <button className={styles.bulkUnavailable} onClick={() => handleBulkUpdate(false)}>
                            <FiXSquare /> Mark as Unavailable
                        </button>
                    </div>
                </div>
            )}

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            {/* --- MODIFIED: Added "Select All" checkbox --- */}
                            <th className={styles.checkboxCell}>
                                <input
                                    type="checkbox"
                                    onChange={handleSelectAll}
                                    checked={isAllSelected}
                                    aria-label="Select all dishes"
                                />
                            </th>
                            <th>Image</th>
                            <th>Name</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Available (Manual)</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dishes.map(dish => (
                            <tr key={dish.id} className={selectedDishes.has(dish.id) ? styles.selectedRow : ''}>
                                {/* --- MODIFIED: Added individual checkbox --- */}
                                <td className={styles.checkboxCell}>
                                    <input
                                        type="checkbox"
                                        onChange={() => handleSelectDish(dish.id)}
                                        checked={selectedDishes.has(dish.id)}
                                        aria-label={`Select ${dish.name}`}
                                    />
                                </td>
                                <td>
                                    <img
                                        src={dish.image_url ? `http://127.0.0.1:8000${dish.image_url}` : 'https://placehold.co/60x60/EFEFEF/AAAAAA&text=No+Image'} 
                                        alt={dish.name}
                                        className={styles.dishImage}
                                    />
                                </td>
                                <td>{dish.name}</td>
                                <td>{dish.category?.name || 'N/A'}</td>
                                <td>₹{parseFloat(dish.price).toFixed(2)}</td>
                                {/* --- MODIFIED: Changed to an interactive button --- */}
                                <td>
                                    <button
                                        className={dish.is_available ? styles.availableToggle : styles.unavailableToggle}
                                        onClick={() => handleToggleAvailability(dish)}
                                    >
                                        {dish.is_available ? 'Yes' : 'No'}
                                    </button>
                                </td>
                                <td className={styles.actions}>
                                    <button className={styles.actionButton} onClick={() => handleOpenDishModal(dish)}><FiEdit /></button>
                                    <button className={`${styles.actionButton} ${styles.deleteButton}`} onClick={() => handleDeleteDish(dish.id)}><FiTrash2 /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <DishFormModal isOpen={isDishModalOpen} onClose={handleCloseDishModal} onSave={handleSaveDish} dish={editingDish} categories={categories} allIngredients={allIngredients} onDataRefresh={refreshDishData} />
            <CategoryFormModal isOpen={isCategoryModalOpen} onClose={handleCloseCategoryModal} onSave={handleSaveCategory} category={editingCategory} />
        </div>
    );
};

export default MenuManagementPage;