import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // We use the original axios for the login request itself
import styles from './LoginPage.module.css';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/token/', {
        username,
        password,
      });

      // Save the token to localStorage
      localStorage.setItem('admin_access_token', response.data.access);
      localStorage.setItem('admin_refresh_token', response.data.refresh);
      
      // Redirect to the dashboard
      navigate('/');

    } catch (err) {
      setError('Failed to login. Please check your username and password.');
      console.error(err);
    }
  };

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h2>Admin Login</h2>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.inputGroup}>
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className={styles.inputGroup}>
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className={styles.submitButton}>Login</button>
      </form>
    </div>
  );
};

export default LoginPage;