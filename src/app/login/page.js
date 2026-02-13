"use client"
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Static login credentials
  const STATIC_EMAIL = "gpsadmin123@gmail.com";
  const STATIC_PASSWORD = "12345678";

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Check if fields are empty
    if (!email || !password) {
      setError("All fields are required");
      return;
    }
    
    // Check if email format is valid
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Invalid email format");
      return;
    }
    
    // Check if password is at least 8 characters
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    
    // Static login validation - only allow specific credentials
    if (email === STATIC_EMAIL && password === STATIC_PASSWORD) {
      setError("");
      // Store login status in localStorage for session management
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userEmail", email);
      router.push("/admin/dashboard");
    } else {
      setError("Invalid email or password. Please use the correct admin credentials.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F8F8F8]">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded shadow w-80 space-y-4"
      >
        <h1 className="text-xl font-bold text-center">Admin Login</h1>
        
        {/* Static credentials info for testing */}
        <div className="bg-[#F8F8F8] p-3 rounded border border-black">
          <p className="text-sm text-black font-semibold mb-1">Test Credentials:</p>
          <p className="text-xs text-black">Email: gpsadmin123@gmail.com</p>
          <p className="text-xs text-black">Password: 12345678</p>
        </div>
        
        {error && <p className="text-red-500 text-sm">{error}</p>}
        
        <input
          type="email"
          placeholder="Email"
          className="border p-2 w-full rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="border p-2 w-full rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="bg-black text-white p-2 w-full rounded hover:bg-black">
          Login
        </button>
        
        {/* Comment out signup for now as requested */}
        {/* <div className="text-center">
          <p className="text-sm text-gray-600">
            Don't have an account? 
            <a href="/signup" className="text-blue-500 hover:underline ml-1">
              Sign up
            </a>
          </p>
        </div> */}
      </form>
    </div>
  );
}
