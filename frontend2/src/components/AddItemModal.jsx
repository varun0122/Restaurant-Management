import React, { useState, useEffect } from 'react';
import styles from './AddItemModal.module.css';

const AddItemModal = ({ dish, cart, setCart, onClose }) => {
  const existingItem = cart.find(item => item.id === dish.id);
  const [quantity, setQuantity] = useState(existingItem ? existingItem.quantity : 1);

  useEffect(() => {
    // Ensure quantity is at least 1 when modal opens for a new item
    if (!existingItem) {
      setQuantity(1);
    }
  }, [dish, existingItem]);

  if (!dish) return null;

  const handleQuantityChange = (amount) => {
    setQuantity(prev => Math.max(1, prev + amount));
  };

  const handleAddToCart = () => {
    let updatedCart = [...cart];
    const index = updatedCart.findIndex(item => item.id === dish.id);

    if (index > -1) {
      // Update quantity if item already exists
      updatedCart[index] = { ...updatedCart[index], quantity: quantity };
    } else {
      // Add new item if it doesn't
      updatedCart.push({ ...dish, quantity: quantity });
    }
    
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    onClose(); // Close the modal after adding
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>&times;</button>
        <img src={`http://127.0.0.1:8000${dish.image_url}`} alt={dish.name} className={styles.dishImage} />
        <div className={styles.details}>
          <h4>{dish.name}</h4>
          <p className={styles.description}>{dish.description}</p>
          <p className={styles.price}>₹{dish.price}</p>
        </div>
        <div className={styles.actions}>
          <div className={styles.quantitySelector}>
            <button onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}>-</button>
            <span>{quantity}</span>
            <button onClick={() => handleQuantityChange(1)}>+</button>
          </div>
          <button className={styles.addButton} onClick={handleAddToCart}>
            Add Item - ₹{(dish.price * quantity).toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddItemModal;
