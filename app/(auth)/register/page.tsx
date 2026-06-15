"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle,
  Headphones
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"family" | "companion">("family");
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    localStorage.removeItem("token");
    const savedRegisterInfo = localStorage.getItem("onboarding_register_info");
    if (savedRegisterInfo) {
      try {
        const info = JSON.parse(savedRegisterInfo);
        setFormData({
          name: info.name || "",
          email: info.email || "",
          phone: info.phone || "",
          password: info.password || "",
        });
        if (info.role) {
          setRole(info.role);
        }
        setAgree(true);
      } catch (e) {
        console.error("Error parsing saved register info", e);
      }
    }
  }, []);

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
    if (!formData.name.trim()) newErrors.name = "Full name is required";
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Valid email is required";
    }
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    if (!agree) newErrors.agree = "You must agree to the Terms and Privacy Policy";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // For both companion and family, we do not call register API now.
    // We store registration details in localStorage and proceed to onboarding steps.
    localStorage.setItem("onboarding_register_info", JSON.stringify({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      role: role,
    }));
    localStorage.setItem("user", JSON.stringify({
      name: formData.name,
      email: formData.email,
      role: role,
    }));
    router.push("/onboarding/qualifications");
  };

  return (
    <div className="relative min-h-screen flex flex-col md:flex-row font-body bg-[#fcf9f6]" dir="ltr">

      <section className="relative w-full md:w-[43%] min-h-screen flex flex-col justify-between p-8 md:p-10 overflow-hidden">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={
              role === "companion"
                ? "https://lh3.googleusercontent.com/aida-public/AB6AXuAzB4_rFFJeK8h9f_8NUuKXueKNtdATlwVyYwBASknOsd4IJDtf2xM9-EGoPe4wMZapaqaRzk5rTp64q-O2CFpAY2zXSmMQYopxStJX_l6EMuAgLdpALJwARBJ35YUI4mgR3BmnzUjqoZFOIMlGcH4h6rHwk8qurI2o0q4BNi3QN9RQI6tmKcVGYQq3iCKb_CYZGd5Sl3BlmkmkSTBUMj0GLRuHF4ZLMvsl7IFq2fQcGVi_np4i-wR4nSwih_tZOc-cForUVli4hsKQ"
                : "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&q=80&w=1200"
            }
            alt={role === "companion" ? "Supportive healthcare professional" : "Warm scene of senior companion care hands connection"}
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
        <div className="z-10 relative max-w-xl space-y-4 mt-auto flex flex-col">
          {role === "companion" && (
            <span className="inline-block px-3 py-1 bg-[#aeedd5] text-[#316d5b] rounded-full text-xs font-semibold mb-3 self-start">
              Join Our Mission
            </span>
          )}
          <h1 className="font-display text-3xl md:text-4xl lg:text-4.5xl font-bold text-primary leading-[1.2] tracking-tight">
            {role === "companion" ? (
              "Join our network of professional caregivers."
            ) : (
              <>
                Dignified care,<br />
                closer to home.
              </>
            )}
          </h1>
          <p className="text-gray-700 text-sm md:text-base font-medium leading-relaxed">
            {role === "companion"
              ? "Make a meaningful difference in the lives of elderly individuals and their families. At Sanad, we value your expertise and compassion."
              : "Join our community to connect with trusted caregivers or offer your professional support to families in need."}
          </p>
          
          {role === "companion" && (
            <div className="mt-6 pt-6 border-t border-gray-300/20 flex items-center gap-3">
              <div className="flex -space-x-3">
                <img
                  className="w-8 h-8 rounded-full border-2 border-white object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDaY8JLJMIsy7zwGbOf5YK6jrSNTj69YzQk2lCHal02aUO0-tGN1bJCDyVmkoNgDQ7OCemw2C1lZzf-WJnrwsdLsK3F76ffobnqlE0pJBbUaoIzUFocXOsQJXZbSX6XDa6AgIGH1_5CmBpSA4Dwg3lSaOoHWpt_J0RmBlr__fsh57-RoFexkq_ps4lxc47_7thdhbsY-DNP3mu1SttzL3qbGPkyo-kEqpdGOo2F-oNlaMEV-di39HdiUDjxBSzTw2AO5FmS7pyxcqiS"
                  alt="Caregiver 1"
                />
                <img
                  className="w-8 h-8 rounded-full border-2 border-white object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDuDCQEtQRRzWWDUIXMRorAdIfDTn3dXNOO4713IbWwbzNm5PoK60_lpJJsi23TMuAA-H2OEBV7WzO0c64uLrnOKqb7RkDgyI_01oFzOYJzp0tHvWJdj4jwZDLj2X_AkTEQCVm9vRRzC_LnysD8TeRf-BPuztGXzEjsjdE0tTgfBWkDSRMk9QrWpa3DfiLOftMqxzmnEy-AbYeIUMqQEjJUraNODRjTVN0_25m2w6PCcqWUXzkkpVKa9E8KESjU9WZf0Wed5XvSjAcq"
                  alt="Caregiver 2"
                />
                <img
                  className="w-8 h-8 rounded-full border-2 border-white object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuC9RuMCY3fGqU8ZXzE2ZKrcw49MkDBaJiIBzrwJapCfBZVkeCmrJwX0mIRliYE_XMjtG1n3zU3gdyjR3WgAb3EAgyqLrOOtDSh1rN3DeND60fgVaioQM-jjgbTR10_ftlGfxaW8IAG-vvhZcLiQC01uuQOSPaT6k6qnaxhka6yXZwYrrA8APAH34ebqZ6LD6FVqjIwSIkUURheuW4B7y9mQnSRgvMR7iJedez9eNkm0IIIGr2X19F4DFTnIyH25EsgPf8etNBIQG28_"
                  alt="Caregiver 3"
                />
              </div>
              <p className="text-xs font-semibold text-gray-700">
                Joined by 500+ professionals this month
              </p>
            </div>
          )}
        </div>
      </section>


      <section className="w-full md:w-[65%] flex items-center justify-center py-16 px-6 md:px-16 overflow-y-auto">
        <div className="w-full max-w-xl">

          {success ? (
            <div className="bg-white p-8 rounded-3xl border border-sand-high text-center space-y-6 custom-shadow animate-fade-in">
              <div className="w-20 h-20 bg-primary-container/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-12 h-12 text-primary" />
              </div>
              <h3 className="font-display text-2xl font-bold text-primary">
                Registration Successful!
              </h3>
              <p className="text-gray-500">
                {role === "companion"
                  ? "Welcome to the Sanad family. Redirecting you to the caregiver onboarding portal..."
                  : "Redirecting to your dashboard..."}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-sand-high p-8 md:p-10 custom-shadow space-y-8">


              <div className="flex flex-col items-center text-center">
                <h2 className="font-display text-2.5xl font-bold text-primary mb-1">Create an account</h2>
                <p className="text-gray-500 text-sm font-medium">
                  {role === "companion"
                    ? "Start your journey towards a rewarding career in care."
                    : "Welcome! Please enter your details."}
                </p>
              </div>

              {serverError && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-md text-red-700 text-sm">
                  {serverError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">


                <div className="space-y-2.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                    I am registering as a:
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setRole("family")}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all cursor-pointer text-center ${role === "family"
                          ? "border-button bg-button/5 text-button"
                          : "border-outline-variant bg-white text-gray-500 hover:border-gray-400"
                        }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${role === "family" ? "bg-button/10 text-button" : "bg-gray-100 text-gray-400"}`}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      </div>
                      <span className="text-sm font-bold block">Family User</span>
                      <span className="text-[11px] text-gray-400 font-semibold">Looking for care</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole("companion")}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all cursor-pointer text-center ${role === "companion"
                          ? "border-button bg-button/5 text-button"
                          : "border-outline-variant bg-white text-gray-500 hover:border-gray-400"
                        }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${role === "companion" ? "bg-button/10 text-button" : "bg-gray-100 text-gray-400"}`}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2v-7a2 2 0 012-2h14" />
                        </svg>
                      </div>
                      <span className="text-sm font-bold block">Caregiver</span>
                      <span className="text-[11px] text-gray-400 font-semibold">Providing care</span>
                    </button>
                  </div>
                </div>

                <div className="border-t border-sand-high pt-6 space-y-5">

                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-gray-700">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-gray-400 text-sm"
                        placeholder="e.g. Fatima Al-Zahra"
                      />
                    </div>
                    {errors.name && <p className="text-red-500 text-xs font-semibold">{errors.name}</p>}
                  </div>


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


                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-gray-700">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-gray-400 text-sm"
                        placeholder="+966 5X XXX XXXX"
                      />
                    </div>
                    {errors.phone && <p className="text-red-500 text-xs font-semibold">{errors.phone}</p>}
                  </div>


                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-gray-700">
                      Password
                    </label>
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
                    <p className="text-[11px] text-gray-400 font-medium">Must be at least 8 characters.</p>
                    {errors.password && <p className="text-red-500 text-xs font-semibold">{errors.password}</p>}
                  </div>
                </div>


                <div className="space-y-1.5">
                  <div className="flex items-start gap-3">
                    <input
                      id="agree"
                      type="checkbox"
                      checked={agree}
                      onChange={(e) => {
                        setAgree(e.target.checked);
                        if (errors.agree) setErrors(prev => ({ ...prev, agree: "" }));
                      }}
                      className="mt-1 w-4 h-4 rounded text-primary border-outline-variant focus:ring-primary focus:ring-offset-0 cursor-pointer"
                    />
                    <label htmlFor="agree" className="text-xs text-gray-600 leading-normal select-none">
                      I agree to the{" "}
                      <Link href="#" className="text-primary hover:underline font-bold">Terms of Service</Link>{" "}
                      and{" "}
                      <Link href="#" className="text-primary hover:underline font-bold">Privacy Policy</Link>.
                    </label>
                  </div>
                  {errors.agree && <p className="text-red-500 text-xs font-semibold">{errors.agree}</p>}
                </div>


                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-button text-white py-3.5 px-8 rounded-xl font-bold text-base hover:bg-button-hover transition-all active:scale-[0.99] shadow-md shadow-button/20 flex items-center justify-center gap-2 mt-8 disabled:opacity-50 cursor-pointer"
                >
                  <span>
                    {loading ? "Continuing..." : "Continue to Onboarding"}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>


                <p className="text-center text-sm text-gray-500 pt-2 font-medium">
                  <span className="mr-1">Already have an account?</span>
                  <Link href="/Login" className="text-button font-bold hover:underline decoration-2 underline-offset-4">
                    Log in
                  </Link>
                </p>

                {role === "companion" && (
                  <div className="mt-6 p-4 rounded-2xl bg-gray-50 border border-gray-200/50 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#aeedd5] flex items-center justify-center text-[#2c6956] shrink-0">
                      <Headphones className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-gray-800">Need help?</p>
                      <p className="text-[11px] text-gray-500 font-medium">Contact our recruitment team at support@sanad.care</p>
                    </div>
                  </div>
                )}
              </form>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
