import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './LoginModal.module.css';

const LoginModal = ({ isOpen, onClose, onLoginSuccess, tableNumber }) => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset the form when the modal is opened or closed
  useEffect(() => {
    if (!isOpen) {
      setPhone('');
      setOtp('');
      setStep(1);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const sendOTP = async () => {
    if (!phone) {
      setError("Please enter your phone number.");
      return;
    }
    setError('');
    setLoading(true);
    try {
      await axios.post('http://127.0.0.1:8000/api/customers/send-otp/', {
        phone_number: phone,
      });
      setStep(2);
      alert('OTP sent! (Check your backend terminal for the OTP during development)');
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp) {
      setError("Please enter the OTP.");
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/customers/verify-otp/', {
        phone_number: phone,
        otp: otp,
      });
      
      const { access, refresh, customer } = res.data;
      localStorage.setItem('customer_access_token', access);
      localStorage.setItem('customer_refresh_token', refresh);
      
      // --- FIX: Add the login timestamp ---
      localStorage.setItem('customer_login_timestamp', Date.now());
      
      onLoginSuccess(customer);
    } catch (err) {
      setError('Invalid OTP. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3>Customer Login</h3>
        <p>Login to place your order for Table {tableNumber}.</p>
        {error && <p className={styles.error}>{error}</p>}
        
        <div className={styles.inputGroup}>
          <label>Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={step === 2}
            placeholder="Enter your phone number"
          />
        </div>

        {step === 2 && (
          <div className={styles.inputGroup}>
            <label>OTP</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter the OTP"
            />
          </div>
        )}

        {step === 1 ? (
          <button className={styles.button} onClick={sendOTP} disabled={loading}>
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        ) : (
          <button className={styles.button} onClick={verifyOTP} disabled={loading}>
            {loading ? 'Verifying...' : 'Verify & Login'}
          </button>
        )}
      </div>
    </div>
  );
};

export default LoginModal;
