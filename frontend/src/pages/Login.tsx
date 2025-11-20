import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Mock authentication - in a real app, you'd call your backend API
      console.log('Login attempt:', { email, password });
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, accept any non-empty credentials
      if (email && password) {
        // Store auth state (in real app, you'd store tokens)
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify({
          id: 1,
          email: email,
          name: 'Store Manager',
          role: 'admin',
          branch: 'Main Store'
        }));
        
        navigate('/');
      } else {
        alert('Please enter both email and password');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user is already logged in
  React.useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    if (isAuthenticated) {
      navigate('/');
    }
  }, [navigate]);

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="logo">🏪</div>
            <h1>Solai Store System</h1>
            <p>Sign in to manage your stock</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="Enter your email"
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="Enter your password"
                required
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="login-button"
            >
              {isLoading ? (
                <>
                  <div className="button-spinner"></div>
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="login-footer">
            <div className="demo-credentials">
              <h3>Demo Credentials:</h3>
              <p>Any email and password will work for demo purposes</p>
              <div className="credential-examples">
                <div>Email: <code>manager@solai.com</code></div>
                <div>Password: <code>anypassword</code></div>
              </div>
            </div>
            
            <div className="support-info">
              <p>
                Need help? Contact support at{' '}
                <a href="mailto:support@solai.com" className="support-link">
                  support@solai.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;