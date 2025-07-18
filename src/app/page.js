// "use client"
// import { useRouter } from "next/navigation";
// import { useState } from "react";
// // import { useRouter } from "next/router";

// export default function Home() {
//   const router = useRouter();
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (!email || !password) {
//       setError("All fields are required");
//     } else if (!/^\S+@\S+\.\S+$/.test(email)) {
//       setError("Invalid email format");
//     } else if (password.length < 8) {
//       setError("Password must be at least 8 characters");
//     } else {
//       setError("");
//       router.push("/admin/dashboard");
//     }
//   };

//   return (
//     <div className="flex items-center justify-center min-h-screen bg-gray-100">
//       <form
//         onSubmit={handleSubmit}
//         className="bg-white p-8 rounded shadow w-80 space-y-4"
//       >
//         <h1 className="text-xl font-bold">Admin Login</h1>
//         {error && <p className="text-red-500">{error}</p>}
//         <input
//           type="email"
//           placeholder="Email"
//           className="border p-2 w-full"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//         />
//         <input
//           type="password"
//           placeholder="Password"
//           className="border p-2 w-full"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//         />
//         <button type="submit" className="bg-blue-500 text-white p-2 w-full rounded">
//           Loginnn
//         </button>
//       </form>
//     </div>
//   );
// }

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  FaFacebookF,
  FaGoogle,
  FaTwitter,
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
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError("All fields are required");
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Invalid email format");
    } else if (password.length < 8) {
      setError("Password must be at least 8 characters");
    } else {
      setError("");
      setLoading(true); // start loader

      setTimeout(() => {
        setLoading(false);
        router.push("/admin/dashboard");
      }, 4000); // 4 seconds delay
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
        className="flex w-1/2 flex-col items-center justify-center bg-[#613EEA] text-white z-10 p-8"
      >
        <motion.h1
          key={isLogin ? "Hello!" : "Welcome back!"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-3xl font-semibold"
        >
          {isLogin ? "Hello !" : "Welcome back !"}
        </motion.h1>
        <p className="my-6 text-center text-sm px-4">
          Lorem ipsum dolor sit amet consectetur adipisicing elit. A, excepturi
          dignissimos assumenda voluptatum incidunt sint accusantium mollitia
          enim quia perferendis.
        </p>
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="rounded-full border border-white px-6 py-2 text-sm uppercase hover:bg-white hover:text-black transition"
        >
          {isLogin ? "Sign Up" : "Sign In"}
        </button>
      </motion.div>

      {/* Form Section */}
      <motion.form
        animate={{ x: isLogin ? "-100%" : "0%" }}
        transition={{ duration: 1 }}
        className="flex w-1/2 flex-col items-center justify-center bg-white text-black p-8 z-10"
      >
        <motion.h1
          key={isLogin ? "Sign in" : "Create Account"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-3xl font-semibold mb-6"
        >
          {isLogin ? "Sign in" : "Create Account"}
        </motion.h1>

        <div className="flex space-x-6 text-2xl mb-6">
          <Image
            src="/dashboard_ion.png"
            alt="GPS Dashboard"
            width={160}
            height={35}
          />
          {/* <div className="p-3 border rounded-full">
            <FaFacebookF />
          </div>
          <div className="p-3 border rounded-full">
            <FaGoogle />
          </div>
          <div className="p-3 border rounded-full">
            <FaTwitter />
          </div> */}
        </div>

        <p className="text-sm text-center mb-6">
          Lorem ipsum dolor sit amet, consectetur adipisicing elit.
          <br />
          Dignissimos, laboriosam?
        </p>

        <div className="space-y-4 w-full max-w-sm">
          {!isLogin && (
            <div className="relative">
              <input
                type="text"
                placeholder="Full name"
                className="w-full border rounded px-10 py-2"
              />
              <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            </div>
          )}
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

        <button
          type="submit"
          onClick={handleSubmit}
          className="mt-8 bg-[#613EEA] text-white rounded-full px-8 py-3 uppercase text-bold text-sm"
        >
          {loading ? (
            <Lottie
              animationData={loadingAnimation}
              loop={true}
              className="w-16"
            />
          ) : isLogin ? (
            "Sign In"
          ) : (
            "Sign Up"
          )}
          {/* {isLogin ? "Sign In" : "Sign Up"} */}
        </button>
      </motion.form>
    </div>
  );
}
