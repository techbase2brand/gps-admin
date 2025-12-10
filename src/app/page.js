"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  FaUser,
  FaEnvelope,
  FaLock,
} from "react-icons/fa";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Lottie from "lottie-react";
import loadingAnimation from "./assets/loader.json";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true); // Always show login, never signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Static login credentials
  const STATIC_EMAIL = "gpsadmin@gmail.com";
  const STATIC_PASSWORD = "12345678";

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError("All fields are required");
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Invalid email format");
    } else if (password.length < 8) {
      setError("Password must be at least 8 characters");
    } else {
      // Static login validation - only allow specific credentials
      if (email === STATIC_EMAIL && password === STATIC_PASSWORD) {
        setError("");
        setLoading(true); // start loader
        // Store login status in localStorage for session management
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userEmail", email);

        setTimeout(() => {
          setLoading(false);
          router.push("/admin/dashboard");
        }, 2000); // 2 seconds delay
      } else {
        setError("Invalid email or password. Please use the correct admin credentials.");
      }
    }
  };

  return (
    <div className="relative flex min-h-screen w-full overflow-hidden font-poppins bg-white">
      {/* Particle Background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-white opacity-10"></div>
        <div className="absolute top-1/2 right-1/4 h-20 w-5 rotate-45 bg-white opacity-10"></div>
        <div className="absolute top-1/4 left-1/5 w-0 h-0 border-t-[25px] border-t-transparent border-r-[50px] border-b-[25px] border-b-transparent border-r-white opacity-10 rotate-12"></div>
        <div className="absolute top-1/3 left-1/3 w-0 h-0 border-t-[25px] border-t-transparent border-r-[50px] border-b-[25px] border-b-transparent border-r-white opacity-10 rotate-60"></div>
        <div className="absolute top-[5%] left-1/4 h-12 w-12 rotate-45 bg-white opacity-10"></div>
      </div>

      {/* Welcome Section */}
      <motion.div
        animate={{ x: isLogin ? "100%" : "0%" }}
        transition={{ duration: 1 }}
        className="flex w-1/2 flex-col items-center justify-center bg-[#003F65] text-white z-99999 p-8 relative overflow-hidden"
      >
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
        
        <div className="relative z-10 flex flex-col items-center justify-center h-full w-full px-8">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="mb-5"
          >
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            key={isLogin ? "Hello!" : "Welcome back!"}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-bold mb-4 text-center"
          >
            Welcome back!
          </motion.h1>
          
          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center text-sm px-6 text-white/85 leading-relaxed max-w-md mb-6"
          >
            Please login with your admin credentials to access the system and manage your fleet efficiently.
          </motion.p>

          {/* Features List */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-4 space-y-2.5 w-full max-w-sm"
          >
            <div className="flex items-center justify-center gap-3 text-sm text-white/90">
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              <span>Real-time vehicle tracking</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-sm text-white/90">
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              <span>Facility management</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-sm text-white/90">
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              <span>Comprehensive reporting</span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Form Section */}
      <motion.form
        animate={{ x: isLogin ? "-100%" : "0%" }}
        transition={{ duration: 1 }}
        className="flex w-1/2 flex-col items-center justify-center bg-white text-black p-8 z-10"
        onSubmit={handleSubmit}
      >
        {/* <motion.h1
          key={isLogin ? "Sign in" : "Create Account"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-3xl font-semibold mb-6"
        >
          Sign in
        </motion.h1> */}

        <div className="flex space-x-6 text-2xl mb-6">
          <Image
            src="/assest/dashboard_ion.png"
            alt="GPS Dashboard"
            width={160}
            height={35}
          />
        </div>

        <p className="text-sm text-center mb-6">
          Enter your admin credentials to access the dashboard.
        </p>

        <div className="space-y-4 w-full max-w-sm">
          {/* Error message */}
          {/* Comment out signup name field */}
          {/* {!isLogin && (
            <div className="relative">
              <input
                type="text"
                placeholder="Full name"
                className="w-full border rounded px-10 py-2"
              />
              <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            </div>
          )} */}
          <div className="relative">
            <input
              type="email"
              placeholder="Email"
              className="w-full border rounded px-10 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          </div>
          <div className="relative">
            <input
              type="password"
              placeholder="Password"
              className="w-full border rounded px-10 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          </div>
        </div>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

        <button
          type="submit"
          onClick={handleSubmit}
          className="mt-8 bg-[#003F65] text-white rounded-full px-8 py-3 uppercase text-bold text-sm"
        >
          {loading ? (
            <Lottie
              animationData={loadingAnimation}
              loop={true}
              className="w-12"
            />
          ) : (
            "Sign In"
          )}
        </button>
      </motion.form>
    </div>
  );
}
