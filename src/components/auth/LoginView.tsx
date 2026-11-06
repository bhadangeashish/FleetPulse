import React, { useState, useEffect } from 'react';
import {
  Truck,
  Car,
  BarChart3,
  CreditCard,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  KeyRound,
  X,
  Send,
  AlertCircle,
  UserPlus,
  Clock,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { useTMS } from '../../context/TMSContext';
import { FleetPulseLogo } from './FleetPulseLogo';
import { AuthFeatureCard } from './AuthFeatureCard';
import { AuthSecurityBadges } from './AuthSecurityBadges';
import { LanguageSelector } from './LanguageSelector';

export const LoginView: React.FC = () => {
  const {
    login,
    loginWithGoogle,
    requestPasswordReset,
    verifyResetOTP,
    completePasswordReset,
    addUserAccount,
  } = useTMS();

  // Form states
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Forgot Password / OTP Verification States
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [resetStep, setResetStep] = useState<'email' | 'otp' | 'new_password'>('email');
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(60);
  const [issuedOTP, setIssuedOTP] = useState<string | null>(null);

  // Countdown timer for OTP expiry
  useEffect(() => {
    let timer: any;
    if (isForgotPasswordOpen && resetStep === 'otp' && otpSecondsLeft > 0) {
      timer = setInterval(() => {
        setOtpSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isForgotPasswordOpen, resetStep, otpSecondsLeft]);

  // Modals: Register Account
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regRole, setRegRole] = useState<'admin' | 'operator'>('operator');
  const [regFeedback, setRegFeedback] = useState<string | null>(null);

  // Google OAuth configuration check (render only if OAuth credentials or flag is configured)
  const isGoogleOAuthConfigured = Boolean(
    (import.meta as any)?.env?.VITE_GOOGLE_CLIENT_ID ||
    (window as any)?.__FLEETPULSE_CONFIG__?.googleOAuthEnabled
  );

  // Sign In submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrUsername.trim()) {
      setErrorMessage('Please enter your email or username.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await login(emailOrUsername, password, rememberMe);
      if (!res.success) {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during authentication.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Google SSO Handler
  const handleGoogleSSO = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setErrorMessage(err.message || 'Google SSO failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 1: Request OTP
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(null);
    if (!forgotPasswordEmail.trim()) {
      setResetError('Please enter your email address.');
      return;
    }

    const res = await requestPasswordReset(forgotPasswordEmail);
    if (!res.success) {
      setResetError(res.message);
      return;
    }

    if (res.challenge) {
      setIssuedOTP(res.challenge.otp);
    }
    setOtpSecondsLeft(60);
    setResetStep('otp');
    setResetSuccess(`Verification OTP dispatched to ${forgotPasswordEmail}. Valid for 60 seconds.`);
  };

  // Step 2: Verify OTP & check expiry
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    if (otpSecondsLeft === 0) {
      setResetError('OTP has expired! Please click "Resend Code" to generate a fresh OTP.');
      return;
    }
    if (!otpInput.trim()) {
      setResetError('Please enter the 6-digit OTP code.');
      return;
    }

    const res = await verifyResetOTP(forgotPasswordEmail, otpInput);
    if (!res.success) {
      setResetError(res.message);
      return;
    }

    setResetSuccess('Email verified successfully! Please enter your new password.');
    setResetStep('new_password');
  };

  // Step 3: Complete Password Reset
  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    if (!newPassword || newPassword.length < 6) {
      setResetError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match. Please verify.');
      return;
    }

    const res = await completePasswordReset(forgotPasswordEmail, newPassword);
    if (!res.success) {
      setResetError(res.message);
      return;
    }

    setResetSuccess('Password reset successfully! Please sign in with your new password.');
    setEmailOrUsername(forgotPasswordEmail);
    setTimeout(() => {
      setIsForgotPasswordOpen(false);
      setResetStep('email');
      setResetSuccess(null);
      setOtpInput('');
      setNewPassword('');
      setConfirmPassword('');
      setIssuedOTP(null);
    }, 2200);
  };

  // Registration Submit Handler
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName || !regEmail || !regMobile) return;
    addUserAccount({
      fullName: regFullName,
      email: regEmail,
      mobile: regMobile,
      role: regRole,
      verificationStatus: 'pending',
    });
    setRegFeedback(`Registration submitted for ${regFullName}. KYC verification pending by Fleet Admin.`);
    setTimeout(() => {
      setRegFeedback(null);
      setIsRegisterModalOpen(false);
    }, 2500);
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4 sm:p-6 lg:p-10 font-body text-[#384959] bg-[#F3F7FB] overflow-x-hidden">
      {/* Background Soft Atmospheric Mist Gradients (Stormy Morning) */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#BDDDFC]/35 via-[#F3F7FB] to-[#88BDF2]/25 pointer-events-none -z-20" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#BDDDFC]/20 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#88BDF2]/15 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Bar with Language Selector */}
      <header className="absolute top-4 right-4 sm:top-6 sm:right-8 z-30">
        <LanguageSelector />
      </header>

      {/* Main Split-Screen Container */}
      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* =================================================================== */}
        {/* LEFT COLUMN: BRAND HERO, HEADLINE, 4 FEATURE CARDS, ILLUSTRATION */}
        {/* =================================================================== */}
        <div className="lg:col-span-6 space-y-6 lg:space-y-7">
          {/* 1. FleetPulse TMS Logo and Branding */}
          <FleetPulseLogo variant="horizontal" size="md" />

          {/* 2. Heading with Cyan Vertical Accent Bar */}
          <div className="flex items-start gap-3.5">
            <div className="w-1.5 h-20 sm:h-24 bg-[#88BDF2] rounded-full shrink-0 mt-1 shadow-xs" />
            <div>
              <h2 className="font-heading text-3xl sm:text-4xl xl:text-5xl font-extrabold text-[#384959] leading-[1.15] tracking-tight">
                Manage Your Fleet,
                <br />
                Freight & Deliveries
              </h2>
              {/* 3. Description about transport management */}
              <p className="text-xs sm:text-sm text-[#6A89A7] font-medium mt-3 leading-relaxed max-w-md">
                A complete transport management system for trip operations, vehicles, drivers, payments and return loads.
              </p>
            </div>
          </div>

          {/* 4. Four Feature Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <AuthFeatureCard
              icon={<Truck className="w-5 h-5 text-[#384959]" />}
              title="Trip"
              subtitle="Management"
            />
            <AuthFeatureCard
              icon={<Car className="w-5 h-5 text-[#384959]" />}
              title="Vehicle"
              subtitle="Management"
            />
            <AuthFeatureCard
              icon={<BarChart3 className="w-5 h-5 text-[#384959]" />}
              title="Reports &"
              subtitle="Analytics"
            />
            <AuthFeatureCard
              icon={<CreditCard className="w-5 h-5 text-[#384959]" />}
              title="Payments &"
              subtitle="Settlements"
            />
          </div>

          {/* 5. Mountain, forest, highway and logistics truck illustration */}
          <div className="relative mt-3 sm:mt-5 overflow-hidden rounded-2xl border border-[#DCE8F2] bg-white/60 shadow-sm backdrop-blur-xs">
            <img
              src="/assets/images/truck-highway.png"
              alt="FleetPulse Freight Transport on Highway"
              className="w-full h-auto max-h-56 sm:max-h-64 object-cover object-bottom rounded-xl"
            />
            {/* Soft subtle gradient blending */}
            <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-white/80 to-transparent pointer-events-none" />
          </div>
        </div>

        {/* =================================================================== */}
        {/* RIGHT COLUMN: WHITE ROUNDED LOGIN CARD */}
        {/* =================================================================== */}
        <div className="lg:col-span-6 flex justify-center lg:justify-end">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 border border-[#DCE8F2] shadow-[0_20px_60px_rgba(56,73,89,0.12)] relative">
            {/* Top Centered FleetPulse Branding in Card */}
            <div className="flex flex-col items-center text-center mb-5">
              <FleetPulseLogo variant="vertical" size="sm" className="mb-2" />

              {/* Welcome Back Heading */}
              <h3 className="font-heading text-2xl font-black text-[#384959] mt-2">
                Welcome Back
              </h3>
              <p className="text-xs text-[#6A89A7] mt-0.5">
                Sign in to access your FleetPulse account
              </p>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Sign-In Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email or Username Input */}
              <div>
                <label className="block text-xs font-bold text-[#384959] mb-1.5 font-heading">
                  Email or Username
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#6A89A7] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    placeholder="Enter your email or username"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#F8FAFC] border border-[#DCE8F2] rounded-xl text-xs sm:text-sm text-[#384959] font-medium placeholder-[#6A89A7]/60 focus:outline-hidden focus:border-[#88BDF2] focus:bg-white focus:ring-2 focus:ring-[#88BDF2]/20 transition-all"
                  />
                </div>
              </div>

              {/* Password Input with Show/Hide Toggle */}
              <div>
                <label className="block text-xs font-bold text-[#384959] mb-1.5 font-heading">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#6A89A7] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-2.5 bg-[#F8FAFC] border border-[#DCE8F2] rounded-xl text-xs sm:text-sm text-[#384959] font-medium placeholder-[#6A89A7]/60 focus:outline-hidden focus:border-[#88BDF2] focus:bg-white focus:ring-2 focus:ring-[#88BDF2]/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6A89A7] hover:text-[#384959] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password Row */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-[#384959]">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-[#DCE8F2] text-[#384959] focus:ring-[#88BDF2]"
                  />
                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(true)}
                  className="font-bold text-[#384959] hover:text-[#6A89A7] hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Sign In Primary CTA Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-[#384959] hover:bg-[#2C3B49] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span>Signing In...</span>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4 text-[#88BDF2]" />
                    <span>Sign In</span>
                  </>
                )}
              </button>

              {/* Continue with Google Button (only rendered if OAuth is configured) */}
              {isGoogleOAuthConfigured && (
                <>
                  <div className="relative my-3 text-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[#DCE8F2]" />
                    </div>
                    <span className="relative px-3 bg-white text-[11px] font-semibold text-[#6A89A7]">
                      or
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleSSO}
                    disabled={isSubmitting}
                    className="w-full py-2.5 bg-white hover:bg-[#F3F7FB] border border-[#DCE8F2] text-[#384959] font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-2.5 active:scale-[0.99] cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </button>
                </>
              )}
            </form>

            {/* Create an Account Link */}
            <div className="text-center text-xs mt-4 pt-2">
              <span className="text-[#6A89A7]">Don't have an account? </span>
              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(true)}
                className="font-extrabold text-[#384959] hover:underline cursor-pointer"
              >
                Create an Account
              </button>
            </div>

            {/* Bottom Security Indicators */}
            <AuthSecurityBadges className="mt-5" />
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* MODAL 1: FORGOT PASSWORD, EMAIL VERIFICATION & OTP LIFECYCLE */}
      {/* =================================================================== */}
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 z-50 bg-[#384959]/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-[#DCE8F2]">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE8F2]">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#384959]" />
                <h3 className="text-base font-extrabold text-[#384959] font-heading">
                  {resetStep === 'email' && 'Verify Registered Email'}
                  {resetStep === 'otp' && 'Enter Verification OTP'}
                  {resetStep === 'new_password' && 'Create New Password'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsForgotPasswordOpen(false);
                  setResetStep('email');
                  setResetError(null);
                  setResetSuccess(null);
                }}
                className="text-[#6A89A7] hover:text-[#384959] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error & Success Feedback Alerts */}
            {resetError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{resetError}</span>
              </div>
            )}
            {resetSuccess && (
              <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{resetSuccess}</span>
              </div>
            )}

            {/* STEP 1: ENTER REGISTERED EMAIL */}
            {resetStep === 'email' && (
              <form onSubmit={handleRequestOTP} className="space-y-4 mt-3">
                <p className="text-xs text-[#6A89A7] leading-relaxed">
                  Enter your registered account email. A secure 6-digit OTP code will be generated for password recovery.
                </p>

                <div>
                  <label className="block text-xs font-bold text-[#384959] mb-1 font-heading">
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#6A89A7] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      placeholder="e.g. admin@fleetpulse.com"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-[#F8FAFC] border border-[#DCE8F2] rounded-xl text-xs sm:text-sm text-[#384959] focus:outline-hidden focus:border-[#88BDF2]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#384959] hover:bg-[#2C3B49] text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Send className="w-3.5 h-3.5 text-[#88BDF2]" />
                  <span>Send Verification Code</span>
                </button>
              </form>
            )}

            {/* STEP 2: ENTER OTP & OTP EXPIRY HANDLING */}
            {resetStep === 'otp' && (
              <form onSubmit={handleVerifyOTP} className="space-y-4 mt-3">
                <div className="bg-[#F3F7FB] border border-[#DCE8F2] rounded-xl p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#6A89A7]" />
                    <span className="font-semibold text-[#384959]">
                      OTP Timer:{' '}
                      <strong className={otpSecondsLeft <= 10 ? 'text-rose-600 font-mono' : 'text-[#384959] font-mono'}>
                        {otpSecondsLeft > 0 ? `00:${otpSecondsLeft.toString().padStart(2, '0')}` : 'Expired'}
                      </strong>
                    </span>
                  </div>
                  {issuedOTP && (
                    <span className="bg-[#BDDDFC]/50 text-[#384959] px-2 py-0.5 rounded-md font-mono text-[11px] font-bold">
                      Code: {issuedOTP}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#384959] mb-1 font-heading">
                    Enter 6-Digit OTP Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#DCE8F2] rounded-xl text-sm font-mono tracking-widest text-center text-[#384959] focus:outline-hidden focus:border-[#88BDF2]"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleRequestOTP}
                    className="w-1/2 py-2.5 bg-white hover:bg-[#F3F7FB] border border-[#DCE8F2] text-[#384959] font-bold text-xs rounded-xl shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-[#6A89A7]" />
                    <span>Resend Code</span>
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2.5 bg-[#384959] hover:bg-[#2C3B49] text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#88BDF2]" />
                    <span>Verify Code</span>
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: CREATE NEW PASSWORD */}
            {resetStep === 'new_password' && (
              <form onSubmit={handleSetNewPassword} className="space-y-4 mt-3">
                <p className="text-xs text-[#6A89A7] leading-relaxed">
                  Your email is verified. Please choose a strong new password (minimum 6 characters).
                </p>

                <div>
                  <label className="block text-xs font-bold text-[#384959] mb-1 font-heading">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#6A89A7] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full pl-10 pr-10 py-2.5 bg-[#F8FAFC] border border-[#DCE8F2] rounded-xl text-xs sm:text-sm text-[#384959] focus:outline-hidden focus:border-[#88BDF2]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6A89A7] hover:text-[#384959] cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#384959] mb-1 font-heading">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#6A89A7] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-[#F8FAFC] border border-[#DCE8F2] rounded-xl text-xs sm:text-sm text-[#384959] focus:outline-hidden focus:border-[#88BDF2]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#384959] hover:bg-[#2C3B49] text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#88BDF2]" />
                  <span>Update Password</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 2: CREATE ACCOUNT REGISTRATION */}
      {/* =================================================================== */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#384959]/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#DCE8F2]">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE8F2]">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#384959]" />
                <h3 className="text-base font-extrabold text-[#384959] font-heading">
                  Create FleetPulse Account
                </h3>
              </div>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="text-[#6A89A7] hover:text-[#384959] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#6A89A7] mt-3 mb-4 leading-relaxed">
              Register an operator account. New accounts are authenticated and approved by the Fleet Operations Manager.
            </p>

            {regFeedback && (
              <div className="p-3 mb-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl">
                {regFeedback}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#384959] mb-1 font-heading">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="e.g. Ramesh Patil"
                  className="w-full px-3.5 py-2 bg-[#F8FAFC] border border-[#DCE8F2] rounded-xl text-xs text-[#384959] focus:outline-hidden focus:border-[#88BDF2]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#384959] mb-1 font-heading">
                  Work Email
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="ramesh@fleetpulse.com"
                  className="w-full px-3.5 py-2 bg-[#F8FAFC] border border-[#DCE8F2] rounded-xl text-xs text-[#384959] focus:outline-hidden focus:border-[#88BDF2]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#384959] mb-1 font-heading">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  required
                  value={regMobile}
                  onChange={(e) => setRegMobile(e.target.value)}
                  placeholder="+91 98220 12345"
                  className="w-full px-3.5 py-2 bg-[#F8FAFC] border border-[#DCE8F2] rounded-xl text-xs text-[#384959] focus:outline-hidden focus:border-[#88BDF2]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#384959] mb-1 font-heading">
                  Requested Role
                </label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as 'admin' | 'operator')}
                  className="w-full px-3.5 py-2 bg-[#F8FAFC] border border-[#DCE8F2] rounded-xl text-xs font-bold text-[#384959] focus:outline-hidden focus:border-[#88BDF2]"
                >
                  <option value="operator">Operations Staff / Dispatcher</option>
                  <option value="admin">Fleet Administrator</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#384959] hover:bg-[#2C3B49] text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5 text-[#88BDF2]" />
                  <span>Submit Registration</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
