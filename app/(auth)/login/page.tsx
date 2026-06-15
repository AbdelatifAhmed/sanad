"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle
} from "lucide-react";
import { api } from "@/lib/services/api";
import { useAuthStore } from "@/store/authStore";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
    setServerError("");
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Valid email is required";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setServerError("");

    try {
      const response = await api.post("/auth/login", {
        email: formData.email,
        password: formData.password,
      });
      const data = response.data;

      setSuccess(true);
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        // Update the global auth store state so guards allow the user inside
        useAuthStore.getState().setAuth(data.user, data.token);
      }

      setTimeout(() => {
        const role = data.user.role;
        router.push(role === "companion" ? "/companion/dashboard" : "/family/dashboard");
      }, 1500);
    } catch (err: any) {
      const message = err.response?.data?.message || err.response?.data?.error || err.message || "Invalid credentials. Please try again.";
      setServerError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col md:flex-row font-body bg-[#fcf9f6]" dir="ltr">
      {/* Left Side: Branding / Hero */}
      <section className="relative w-full md:w-[43%] min-h-screen flex flex-col justify-between p-8 md:p-10 overflow-hidden">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&q=80&w=1200"
            alt="Warm scene of senior companion care hands connection"
            height={800}
            width={1200}
            className="w-full h-full object-cover"
          />
          {/* Gradient overlay to make bottom text readable while showing the photo */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#fcf9f6] via-[#fcf9f6]/45 to-[#fcf9f6]/10" />
          <div className="absolute inset-0 bg-[#012d1d]/5 mix-blend-multiply" />
        </div>

        {/* Logo at the top of the left side */}
        <div className="z-10 relative">
          <img
            src="/logo.png"
            alt="Sanad Logo"
            className="h-24 md:h-28 object-contain select-none pointer-events-none mix-blend-multiply"
          />
        </div>

        {/* Text at the bottom of the left side */}
        <div className="z-10 relative max-w-xl space-y-4 mt-auto">
          <h1 className="font-display text-3xl md:text-4xl lg:text-4.5xl font-bold text-primary leading-[1.2] tracking-tight">
            Dignified care,<br/>
            closer to home.
          </h1>
          <p className="text-gray-700 text-sm md:text-base font-medium leading-relaxed">
            Connecting families with compassionate, reliable caregivers for the elderly. Experience peace of mind with Sanad.
          </p>
        </div>
      </section>

      {/* Right Side: Login Form */}
      <section className="w-full md:w-[65%] flex items-center justify-center py-16 px-6 md:px-16 overflow-y-auto">
        <div className="w-full max-w-xl">
          {success ? (
            <div className="bg-white p-8 rounded-3xl border border-sand-high text-center space-y-6 custom-shadow animate-fade-in">
              <div className="w-20 h-20 bg-primary-container/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-12 h-12 text-primary" />
              </div>
              <h3 className="font-display text-2xl font-bold text-primary">
                Welcome Back!
              </h3>
              <p className="text-gray-500">
                Signing you in, please wait...
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-sand-high p-8 md:p-10 custom-shadow space-y-8">
              <div className="flex flex-col items-center text-center">
                <h2 className="font-display text-2.5xl font-bold text-primary mb-1">Welcome back</h2>
                <p className="text-gray-500 text-sm font-medium">Please enter your details to sign in.</p>
              </div>

              {serverError && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-md text-red-700 text-sm">
                  {serverError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="border-t border-sand-high pt-6 space-y-5">
                  {/* Email Input */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-gray-700">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-gray-400 text-sm"
                        placeholder="name@example.com"
                      />
                    </div>
                    {errors.email && <p className="text-red-500 text-xs font-semibold">{errors.email}</p>}
                  </div>

                  {/* Password Input */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-bold text-gray-700">
                        Password
                      </label>
                      <Link href="#" className="text-xs font-bold text-primary hover:underline">
                        Forgot Password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-12 py-3.5 bg-white border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-gray-400 text-sm"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(prev => !prev)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-red-500 text-xs font-semibold">{errors.password}</p>}
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-primary border-outline-variant focus:ring-primary focus:ring-offset-0 cursor-pointer"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600 cursor-pointer select-none">
                    Remember me
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-button text-white py-3.5 px-8 rounded-xl font-bold text-base hover:bg-button-hover transition-all active:scale-[0.99] shadow-md shadow-button/20 flex items-center justify-center gap-2 mt-8 disabled:opacity-50 cursor-pointer"
                >
                  <span>{loading ? "Signing In..." : "Sign In"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-outline-variant"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-400 font-bold">Or continue with</span>
                  </div>
                </div>

                {/* Social Logins */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    className="flex justify-center items-center h-12 border border-outline-variant rounded-xl bg-white hover:bg-sand-low transition-colors duration-200 text-gray-700 font-bold text-sm cursor-pointer"
                  >
                    <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"></path>
                    </svg>
                    Google
                  </button>
                  <button
                    type="button"
                    className="flex justify-center items-center h-12 border border-outline-variant rounded-xl bg-white hover:bg-sand-low transition-colors duration-200 text-gray-700 font-bold text-sm cursor-pointer"
                  >
                    <svg className="w-5 h-5 mr-2 text-black" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.05,20.28c-0.98,1.44-2.02,2.88-3.6,2.91c-1.55,0.03-2.06-0.92-3.82-0.92c-1.76,0-2.31,0.89-3.8,0.95c-1.53,0.06-2.7-1.53-3.69-2.97c-2.03-2.93-3.58-8.27-1.5-11.89c1.03-1.79,2.87-2.92,4.86-2.95c1.49-0.03,2.9,1.01,3.82,1.01c0.91,0,2.61-1.25,4.42-1.06c0.75,0.03,2.88,0.3,4.24,2.3c-0.11,0.07-2.54,1.48-2.52,4.4C15.48,15.43,18.17,16.46,17.05,20.28z M11.96,5.17c0.82-1,1.38-2.39,1.23-3.77c-1.18,0.05-2.61,0.79-3.45,1.78c-0.75,0.88-1.4,2.31-1.23,3.67C9.84,6.95,11.14,6.17,11.96,5.17z"></path>
                    </svg>
                    Apple
                  </button>
                </div>

                <p className="text-center text-sm text-gray-500 pt-2 font-medium">
                  <span className="mr-1">Don't have an account?</span>
                  <Link href="/register" className="text-button font-bold hover:underline decoration-2 underline-offset-4">
                    Sign up
                  </Link>
                </p>
              </form>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
