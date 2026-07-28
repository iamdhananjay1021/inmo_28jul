// import { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { motion } from 'framer-motion';
// import { Lock, User, Eye, EyeOff } from 'lucide-react';
// import { authAPI } from '../services/api';
// import { useAuth } from '../contexts/AuthContext';

// export const Login = () => {
//   const [userName, setUserName] = useState('');
//   const [password, setPassword] = useState('');
//   const [showPassword, setShowPassword] = useState(false);
//   const [rememberMe, setRememberMe] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const navigate = useNavigate();
//   const { login } = useAuth();

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');
//     setLoading(true);

//     try {
//       const response = await authAPI.login(userName, password);

//       if (response.status) {
//         login({ userName, assignId: response.assignId });
//         navigate('/dashboard');
//       } else {
//         setError(response.message || 'Login failed');
//       }
//     } catch (err) {
//       setError('Connection error. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 overflow-hidden flex items-center justify-center p-4">
//       {/* Animated Background Elements */}
//       <motion.div
//         className="absolute top-1/4 left-1/4 w-48 h-48 sm:w-72 sm:h-72 bg-purple-600/30 rounded-full blur-3xl"
//         animate={{
//           scale: [1, 1.2, 1],
//           opacity: [0.3, 0.5, 0.3],
//           x: [0, 30, 0],
//           y: [0, -20, 0],
//         }}
//         transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
//       />
//       <motion.div
//         className="absolute bottom-1/4 right-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-pink-600/30 rounded-full blur-3xl"
//         animate={{
//           scale: [1.2, 1, 1.2],
//           opacity: [0.5, 0.3, 0.5],
//           x: [0, -20, 0],
//           y: [0, 30, 0],
//         }}
//         transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
//       />
//       <motion.div
//         className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"
//         animate={{
//           scale: [1, 1.3, 1],
//           opacity: [0.2, 0.4, 0.2],
//         }}
//         transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
//       />

//       <motion.div
//         initial={{ opacity: 0, scale: 0.9 }}
//         animate={{ opacity: 1, scale: 1 }}
//         transition={{ duration: 0.5 }}
//         className="relative z-10 w-full max-w-md"
//       >
//         <div className="glass-strong rounded-2xl p-6 sm:p-8 border border-white/10 glow-animated">
//           <div className="text-center mb-6">
//             <motion.img
//               src="/assets/logo.png"
//               alt="SFA Live"
//               className="w-16 h-16 mx-auto mb-3 rounded-xl"
//               animate={{ rotate: [0, 5, -5, 0] }}
//               transition={{ duration: 2, repeat: Infinity }}
//             />
//             <h1 className="text-2xl sm:text-3xl font-bold text-gradient mb-1">SFA Live Admin</h1>
//             <p className="text-sm text-gray-400">Sign in to your account</p>
//           </div>

//           {error && (
//             <motion.div
//               initial={{ opacity: 0, y: -10 }}
//               animate={{ opacity: 1, y: 0 }}
//               className="mb-4 p-3 bg-red-600/20 border border-red-500/50 rounded-lg text-red-400 text-sm"
//             >
//               {error}
//             </motion.div>
//           )}

//           <form onSubmit={handleSubmit} className="space-y-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
//               <div className="relative">
//                 <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
//                 <input
//                   type="text"
//                   value={userName}
//                   onChange={(e) => setUserName(e.target.value)}
//                   className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-gray-300 focus:outline-none focus:border-purple-500 transition-all text-sm"
//                   placeholder="Enter your username"
//                   required
//                 />
//               </div>
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
//               <div className="relative">
//                 <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
//                 <input
//                   type={showPassword ? 'text' : 'password'}
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   className="w-full pl-10 pr-12 py-2.5 bg-white/5 border border-white/10 rounded-lg text-gray-300 focus:outline-none focus:border-purple-500 transition-all text-sm"
//                   placeholder="Enter your password"
//                   required
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowPassword(!showPassword)}
//                   className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
//                 >
//                   {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
//                 </button>
//               </div>
//             </div>

//             <div className="flex items-center">
//               <input
//                 type="checkbox"
//                 id="remember"
//                 checked={rememberMe}
//                 onChange={(e) => setRememberMe(e.target.checked)}
//                 className="w-4 h-4 rounded border-white/10 bg-white/5 text-purple-600 focus:ring-purple-500"
//               />
//               <label htmlFor="remember" className="ml-2 text-sm text-gray-400">
//                 Remember me
//               </label>
//             </div>

//             <motion.button
//               type="submit"
//               disabled={loading}
//               whileHover={{ scale: 1.02 }}
//               whileTap={{ scale: 0.98 }}
//               className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold text-white hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed glow-purple text-sm btn-ripple shimmer"
//             >
//               {loading ? (
//                 <span className="flex items-center justify-center gap-2">
//                   <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
//                   Signing in...
//                 </span>
//               ) : 'Sign In'}
//             </motion.button>
//           </form>

//           <div className="mt-4 text-center">
//             <div className="flex items-center gap-2 justify-center text-xs text-gray-500">
//               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
//               <span>Secure Connection</span>
//             </div>
//           </div>
//         </div>
//       </motion.div>
//     </div>
//   );
// };

// -----------------------PROD----------------------------

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Phone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/apiConfig';

export const Login = () => {
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1 = mobile, 2 = otp
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/Registration/AdminSendOTP`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mobile,
        }),
      });

      const data = await res.json();

      if (data.Status === true) {
        setStep(2);
      } else {
        setError(data.Message || "Failed to send OTP");
      }
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/Registration/AdminLogin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          MobileNo: mobile,
          OTP: otp,
        }),
      });

      const data = await res.json();

      if (data.Status === true) {
        localStorage.setItem("authToken", data.Token);
        localStorage.setItem("userId", data.UserId);
        localStorage.setItem("isAdmin", data.IsAdmin);

        login({
          mobile,
          userId: data.UserId,
          isAdmin: data.IsAdmin,
          token: data.Token,
        });

        if (mobile === '8576075126') {
          navigate("/requests");
        } else {
          navigate("/dashboard");
        }
      } else {
        setError(data.Message || "Invalid OTP");
      }
    } catch (err) {
      setError("OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4">

      {/* Background animations same as before */}
      <motion.div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-600/30 rounded-full blur-3xl"
        animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 6, repeat: Infinity }}
      />

      <motion.div className="relative z-10 w-full max-w-md">
        <div className="glass-strong rounded-2xl p-8 border border-white/10">

          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gradient">SFA Live Admin</h1>
            <p className="text-sm text-gray-400">Login with OTP</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-600/20 border border-red-500/50 rounded text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* STEP 1: MOBILE */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-4">

              <div>
                <label className="text-sm text-gray-300">Mobile Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    value={mobile}
                    maxLength={10}
                    pattern="[0-9]{10}"
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-gray-300"
                    placeholder="Enter mobile number"
                    required
                  />
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileTap={{ scale: 0.95 }}
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white"
              >
                {loading ? "Sending OTP..." : "Send OTP"}
              </motion.button>
            </form>
          )}

          {/* STEP 2: OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">

              <p className="text-xs text-gray-400">
                OTP sent to {mobile}
              </p>

              <div>
                <label className="text-sm text-gray-300">Enter OTP</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={otp}
                    maxLength={6}
                    pattern="[0-9]{6}"
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-gray-300"
                    placeholder="Enter OTP"
                    required
                  />
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </motion.button>

              <button
                type="button"
                onClick={handleSendOtp}
                className="text-sm text-blue-400 w-full"
              >
                Resend OTP
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-sm text-gray-400 w-full"
              >
                Change Mobile Number
              </button>

            </form>
          )}

        </div>
      </motion.div>
    </div>
  );
};
