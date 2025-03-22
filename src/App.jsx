import { useState, useEffect } from "react";
import "./styles.css";

export default function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false); // Track if message is an error
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [userEmail, setUserEmail] = useState(localStorage.getItem("email"));
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [tempEmail, setTempEmail] = useState("");

  const backendURL = "http://localhost:8082";

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Button clicked! Mode:", isLogin ? "Login" : "Signup");
    const url = isLogin ? `${backendURL}/api/login` : `${backendURL}/api/signup`;
    console.log("Sending request to:", url, "with:", formData);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const text = await response.text();
      console.log("Raw response:", text);

      let data;
      try {
        data = JSON.parse(text);
      } catch (error) {
        console.error("JSON parse error:", error, "Raw response:", text);
        throw new Error("Server returned invalid response");
      }

      if (!response.ok) throw new Error(data.message || "Request failed");

      setMessage(data.message);
      setIsError(false); // Success message

      if (!isLogin && response.ok) {
        setTempEmail(formData.email);
        setShowVerification(true); // Show centered verification form
      } else if (isLogin && data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("email", formData.email);
        setToken(data.token);
        setUserEmail(formData.email);
      }
    } catch (error) {
      console.error("Fetch error:", error.message);
      setMessage("❌ Error: " + error.message);
      setIsError(true); // Error message
    }

    setFormData({ email: "", password: "" });
    setTimeout(() => {
      setMessage("");
      setIsError(false);
    }, 3000);
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    console.log("Verifying:", { email: tempEmail, code: verificationCode });

    try {
      const response = await fetch(`${backendURL}/api/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: tempEmail, code: verificationCode }),
      });

      const text = await response.text();
      console.log("Verify raw response:", text);

      let data;
      try {
        data = JSON.parse(text);
      } catch (error) {
        console.error("JSON parse error:", error, "Raw response:", text);
        throw new Error("Server returned invalid response");
      }

      if (!response.ok) throw new Error(data.message || "Verification failed");

      setMessage("✅ Signup successful! Please login.");
      setIsError(false);
      setShowVerification(false);
      setIsLogin(true);
    } catch (error) {
      setMessage("❌ Error: " + error.message);
      setIsError(true);
    }

    setVerificationCode("");
    setTimeout(() => setMessage(""), 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    setToken(null);
    setUserEmail(null);
    setMessage("✅ Logged out successfully");
    setIsError(false);
    setTimeout(() => setMessage(""), 3000);
  };

  useEffect(() => {
    if (!token) return;

    const fetchProtectedData = async () => {
      try {
        const response = await fetch(`${backendURL}/api/protected`, {
          headers: { Authorization: token },
        });

        const text = await response.text();
        console.log("Protected raw response:", text);

        let data;
        try {
          data = JSON.parse(text);
        } catch (error) {
          console.error("JSON parse error:", error, "Raw response:", text);
          throw new Error("Server returned invalid response");
        }

        if (!response.ok) throw new Error(data.message || "Request failed");

        setMessage("✅ Protected data: " + data.message);
        setIsError(false);
      } catch (error) {
        setMessage("❌ Error: " + error.message);
        setIsError(true);
      }
    };

    fetchProtectedData();
  }, [token]);

  return (
    <div className="container">
      {message && (
        <div className={`notification ${isError ? "error" : ""}`}>{message}</div>
      )}
      <div className="form-card">
        {!showVerification ? (
          <>
            <h2 className="form-heading">{isLogin ? "Login" : "Sign Up"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label className="input-label">Email</label>
                <input
                  type="email"
                  name="email"
                  className="input-field"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="input-group">
                <label className="input-label">Password</label>
                <input
                  type="password"
                  name="password"
                  className="input-field"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
              <button type="submit" className="submit-btn">
                {isLogin ? "Login" : "Sign Up"}
              </button>
            </form>
            {token && (
              <>
                <p>Welcome, {userEmail}!</p>
                <button className="logout-btn" onClick={handleLogout}>
                  Logout
                </button>
              </>
            )}
            <p className="toggle-text">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button className="toggle-btn" onClick={() => setIsLogin(!isLogin)}>
                {isLogin ? "Sign Up" : "Login"}
              </button>
            </p>
          </>
        ) : (
          <>
            <h2 className="form-heading">Verify Your Email</h2>
            <p>Enter the code sent to {tempEmail}</p>
            <form onSubmit={handleVerifyEmail}>
              <div className="input-group">
                <label className="input-label">Verification Code</label>
                <input
                  type="text"
                  className="input-field"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="submit-btn">Verify</button>
            </form>
            <p className="toggle-text">
              Wrong email?{" "}
              <button
                className="toggle-btn"
                onClick={() => {
                  setShowVerification(false);
                  setTempEmail("");
                }}
              >
                Go Back
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}