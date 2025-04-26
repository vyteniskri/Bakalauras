import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';

const ResetPassword = () => {
  const location = useLocation();

  const [newPassword, setNewPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');

  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+=[\]{}|;:'",.<>?/\\`~]).{6,}$/;

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get('token');
    const email = queryParams.get('email');

    if (token && email) {
      setToken(token);
      setEmail(email);
    } else {
      setError('Invalid reset link');
    }
  }, [location]);

  const handlePasswordReset = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();

    setError('');
    setMessage('');

    if (!passwordRegex.test(newPassword)) {
      setError("Password must be at least 6 characters long, contain one uppercase letter, one number, and one special character.");
      return;
    }

    if (newPassword !== repeatPassword) {
      setError("Passwords do not match. Please make sure both passwords match.");
      return;
    }

    if (!newPassword || !token || !email) {
      setError('All fields are required.');
      return;
    }

    try {
      const response = await api.post('/resetpassword', {
        email,
        token,
        newPassword,
      });

      setMessage(response.data.message);

      alert("Password reset successful. The page will now close.");
      window.close();
    } catch (error) {
      setError('Failed to reset password. Please try again later.');
    }
  };

  return (
    <div className="reset-password-container">
      <h2>Reset Your Password</h2>

      {error && <p className="error-message" style={{ color: 'red' }}>{error}</p>}
      {message && <p className="success-message" style={{ color: 'green' }}>{message}</p>}
      
      <form onSubmit={handlePasswordReset} className="reset-password-form">
        <div className="form-group">
          <label>New Password:</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="input-field"
          />
        </div>
        <div className="form-group">
          <label>Repeat New Password:</label>
          <input
            type="password"
            value={repeatPassword}
            onChange={(e) => setRepeatPassword(e.target.value)}
            required
            className="input-field"
          />
        </div>
        <button type="submit" className="submit-button">Reset Password</button>
      </form>
    </div>
  );
};

export default ResetPassword;
