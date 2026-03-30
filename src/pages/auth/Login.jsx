import { useState } from "react";
import { useNavigate } from "react-router-dom";
import busLogo from "../../assets/bus.png";
import { login } from "../../api/api";
import "./login.css";

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: "", password: "", role: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.role) { setError("Please select your role"); return; }

    setLoading(true);
    try {
      const data = await login(formData.username, formData.password, formData.role);
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onLogin(data.user);

      const routes = {
        ADMIN:        '/admin/dashboard',
        TRANSPORT:    '/transport/dashboard',
        DRIVER:       '/driver/dashboard',
        USER:         '/user/dashboard',
        FUEL_OFFICER: '/fuel/dashboard',
        GATE_OFFICER: '/gate/dashboard',
        MAINTENANCE:  '/maintenance/dashboard',
      };
      navigate(routes[data.user.role] || '/');
    } catch (err) {
      setError(err.message || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="logo-wrapper">
            <img src={busLogo} alt="Haramaya University Logo" className="login-logo" />
          </div>

          <h2>Sign In</h2>
          <p className="subtitle">Login to Secure Access</p>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <label>Username</label>
            <input
              type="text"
              name="username"
              placeholder="Enter your username"
              value={formData.username}
              onChange={handleChange}
              required
              minLength={3}
            />

            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
            />

            <label>Role</label>
            <select name="role" value={formData.role} onChange={handleChange} required>
              <option value="">Select your role</option>
              <option value="ADMIN">Admin</option>
              <option value="TRANSPORT">Transport Officer</option>
              <option value="DRIVER">Driver</option>
              <option value="USER">User</option>
              <option value="FUEL_OFFICER">Fuel Station Officer</option>
              <option value="GATE_OFFICER">Gate Security Officer</option>
              <option value="MAINTENANCE">Maintenance Officer</option>
            </select>

            <div className="login-actions">
              <a href="#">Forgot Password?</a>
            </div>

            <button type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="support" style={{ display: 'none' }}></div>
        </div>
      </div>
    </div>
  );
}
