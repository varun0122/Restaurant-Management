import React, { useState } from 'react';
import axios from 'axios';

const StaffLogin = ({ onLogin }) => {
  const [username, setUsername] = useState('');

  const login = async () => {
    try {
      const res = await axios.post('/api/staff/login/', { username });
      localStorage.setItem('staff', JSON.stringify(res.data));
      onLogin(res.data);
    } catch (err) {
      alert('Login failed');
    }
  };

  return (
    <div className="container mt-5">
      <h3>Staff Login</h3>
      <div className="input-group mt-3">
        <input
          className="form-control"
          placeholder="Enter username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <button className="btn btn-primary" onClick={login}>Login</button>
      </div>
    </div>
  );
};

export default StaffLogin;
