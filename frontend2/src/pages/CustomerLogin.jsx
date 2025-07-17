import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CustomerLogin = ({ onLogin }) => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [table, setTable] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const sendOTP = async () => {
    if (!phone) {
      alert("Please enter your phone number.");
      return;
    }
    try {
      setLoading(true);
      await axios.post('http://127.0.0.1:8000/api/customers/send-otp/', {
        phone_number: phone,
      });
      setStep(2);
      alert('OTP sent (check backend terminal or log)');
    } catch (err) {
  console.error(err); // use the variable to remove the warning
  alert('Failed to send OTP.');
}finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp || !table) {
      alert("Please enter OTP and Table Number.");
      return;
    }
    try {
      setLoading(true);
      const res = await axios.post('http://127.0.0.1:8000/api/customers/verify-otp/', {
        phone_number: phone,
        otp,
        table_number: table,
      });
      localStorage.setItem('customer', JSON.stringify(res.data));
      onLogin(res.data);
      navigate('/menu');
    } catch (err) {
      console.error(err);
      alert('Invalid OTP or something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: '400px' }}>
      <h3 className="mb-4">Customer Login</h3>

      <div className="form-group mb-3">
        <label>Phone Number</label>
        <input
          type="text"
          className="form-control"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={step === 2}
        />
      </div>

      {step === 2 && (
        <>
          <div className="form-group mb-3">
            <label>OTP</label>
            <input
              type="text"
              className="form-control"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </div>

          <div className="form-group mb-3">
            <label>Table Number</label>
            <input
              type="number"
              className="form-control"
              value={table}
              onChange={(e) => setTable(e.target.value)}
            />
          </div>

          <div className="d-flex justify-content-between">
            <button className="btn btn-secondary" onClick={sendOTP} disabled={loading}>
              Resend OTP
            </button>
            <button className="btn btn-primary" onClick={verifyOTP} disabled={loading}>
              Verify OTP
            </button>
          </div>
        </>
      )}

      {step === 1 && (
        <button className="btn btn-primary mt-3 w-100" onClick={sendOTP} disabled={loading}>
          {loading ? 'Sending...' : 'Send OTP'}
        </button>
      )}
    </div>
  );
};

export default CustomerLogin;
