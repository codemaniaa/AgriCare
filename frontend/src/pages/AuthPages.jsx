import React, { useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';
import { extractError, validateCNIC } from '../utils';
import { useAdminAuth } from '../hooks/useAdminAuth';
import {
  FiUser, FiLock, FiMail, FiEye, FiEyeOff, FiAlertCircle, FiCheckCircle,
  FiArrowRight, FiArrowLeft, FiShield, FiKey, FiCreditCard, FiMapPin,
  FiUserPlus, FiChevronDown,
} from 'react-icons/fi';
import { GiWheat, GiPlantSeed } from 'react-icons/gi';

/* ── Fonts (Inter + Inter) ───────────────────────────────
   Add this to your index.html <head>:
   <link rel="preconnect" href="https://fonts.googleapis.com">
   <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Inter:wght@500;600;700;800&display=swap" rel="stylesheet">
─────────────────────────────────────────────────────── */

/* ── Reusable class tokens ─────────────────────────────── */
const cls = {
  page:
    "min-h-screen w-full flex items-center justify-center px-4 py-10 sm:py-14 relative overflow-hidden " +
    "font-['Sora',system-ui,sans-serif] " +
    "bg-[radial-gradient(1200px_600px_at_10%_-10%,#d8efdc_0%,transparent_60%),radial-gradient(900px_500px_at_110%_10%,#e8f6dd_0%,transparent_55%),linear-gradient(180deg,#f7fbf7_0%,#eef6ef_100%)]",
  shell: "w-full max-w-md sm:max-w-lg relative z-10",
  card:
    "w-full bg-white/80 backdrop-blur-xl backdrop-saturate-150 border border-emerald-900/10 " +
    "rounded-2xl sm:rounded-3xl px-6 py-8 sm:px-9 sm:py-10 " +
    "shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_30px_60px_-20px_rgba(20,61,41,0.18),0_8px_24px_-12px_rgba(20,61,41,0.10)]",
  iconWrap:
    "w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-white text-2xl " +
    "bg-gradient-to-br from-[#1f5d3f] to-[#2d6a4f] " +
    "shadow-[0_10px_24px_-10px_rgba(31,93,63,0.55),inset_0_1px_0_rgba(255,255,255,0.25)]",
  title:
    "font-['Inter',sans-serif] text-2xl sm:text-[28px] font-bold text-[#0f1f15] text-center tracking-tight",
  sub: "text-[13.5px] sm:text-sm text-[#6a8a72] text-center mt-1.5 mb-6 leading-relaxed",
  label: "text-xs font-semibold text-[#3b5a45] mb-1.5 block tracking-wide uppercase",
  input:
    "w-full pl-11 pr-4 py-3 bg-white border-[1.5px] border-emerald-900/10 rounded-xl text-sm text-[#0f1f15] " +
    "placeholder:text-[#9bb3a3] outline-none transition-all " +
    "focus:border-[#2d6a4f] focus:ring-4 focus:ring-[#2d6a4f]/15 hover:border-emerald-900/20",
  inputPlain:
    "w-full px-4 py-3 bg-white border-[1.5px] border-emerald-900/10 rounded-xl text-sm text-[#0f1f15] " +
    "placeholder:text-[#9bb3a3] outline-none transition-all " +
    "focus:border-[#2d6a4f] focus:ring-4 focus:ring-[#2d6a4f]/15 hover:border-emerald-900/20",
  select:
    "w-full appearance-none pl-11 pr-10 py-3 bg-white border-[1.5px] border-emerald-900/10 rounded-xl text-sm text-[#0f1f15] " +
    "outline-none transition-all cursor-pointer " +
    "focus:border-[#2d6a4f] focus:ring-4 focus:ring-[#2d6a4f]/15 hover:border-emerald-900/20",
  btn:
    "w-full mt-2 py-3.5 rounded-xl text-white text-sm font-semibold tracking-wide " +
    "bg-gradient-to-br from-[#1f5d3f] to-[#2d6a4f] " +
    "shadow-[0_12px_24px_-12px_rgba(31,93,63,0.55)] " +
    "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_30px_-14px_rgba(31,93,63,0.65)] " +
    "active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 " +
    "flex items-center justify-center gap-2",
  error:
    "flex items-start gap-2 bg-red-50 text-red-700 border border-red-200 rounded-xl px-3.5 py-3 text-[13px] mb-4",
  success:
    "flex items-start gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl px-3.5 py-3 text-[13px] mb-4",
  switch: "text-center text-sm text-[#6a8a72] mt-6",
  link: "text-[#1f5d3f] font-semibold hover:text-[#2d6a4f] hover:underline underline-offset-4 transition-colors",
  row: "grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4",
  divider: "flex items-center gap-3 my-5 text-[11px] uppercase tracking-widest text-[#9bb3a3]",
  dividerLine: "flex-1 h-px bg-emerald-900/10",
  footNote: "text-center text-[11.5px] text-[#6a8a72] mt-5 tracking-wide",
  inputIcon:
    "absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6a8a72] pointer-events-none",
  brand:
    "flex items-center justify-center gap-2 mb-4 text-[#1f5d3f] font-['Inter',sans-serif] font-bold text-base tracking-wide",
};

/* ── Decorative background ─────────────────────────────── */
function Backdrop() {
  return (
    <>
      <div className="pointer-events-none absolute -top-32 -left-24 w-[420px] h-[420px] rounded-full bg-emerald-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 w-[460px] h-[460px] rounded-full bg-lime-300/25 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:linear-gradient(#0f1f15_1px,transparent_1px),linear-gradient(90deg,#0f1f15_1px,transparent_1px)] [background-size:42px_42px]" />
    </>
  );
}

function Brand() {
  return (
    <div className={cls.brand}>
      <GiPlantSeed className="text-lg" />
      <span>AgriCare</span>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className={cls.label}>{label}</label>
      <div className="relative">{children}</div>
    </div>
  );
}

function ErrorBox({ children }) {
  return (
    <div className={cls.error}>
      <FiAlertCircle className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
function SuccessBox({ children }) {
  return (
    <div className={cls.success}>
      <FiCheckCircle className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SIGN IN
═══════════════════════════════════════════════════════ */
export function SignInPage() {
  const navigate = useNavigate();
  const { loginAdmin } = useAdminAuth();
  const { login } = useAuth();

  const [form, setForm] = useState({ username: '', cnic: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        username: form.username.trim(),
        cnic: form.cnic.trim(),
        password: form.password
      };
      const res = await authAPI.login(payload);
      const { user, tokens } = res.data;

      if (user.is_staff || user.is_superuser || user.role === 'admin') {
        loginAdmin(user, tokens.access, tokens.refresh);
        navigate('/admin');
      } else {
        localStorage.setItem('access_token', tokens.access);
        localStorage.setItem('refresh_token', tokens.refresh);
        localStorage.setItem('user', JSON.stringify(user));
        navigate('/dashboard');
      }
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cls.page}>
      <Backdrop />
      <div className={cls.shell}>
        <div className={cls.card}>
          <Brand />
          <div className={cls.iconWrap}><GiWheat /></div>
          <h1 className={cls.title}>Welcome Back</h1>
          <p className={cls.sub}>Sign in to your AgriCare account</p>

          {error && <ErrorBox>{error}</ErrorBox>}

          <form onSubmit={submit} className="space-y-4">
            <Field label="Username">
              <FiUser className={cls.inputIcon} />
              <input
                type="text" value={form.username} onChange={set('username')}
                placeholder="Enter your username" required className={cls.input}
              />
            </Field>

            <Field label="CNIC">
              <FiCreditCard className={cls.inputIcon} />
              <input
                type="text" value={form.cnic} onChange={set('cnic')}
                placeholder="13-digit CNIC" required className={cls.input}
              />
            </Field>

            <Field label="Password">
              <FiLock className={cls.inputIcon} />
              <input
                type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')}
                placeholder="••••••••" required
                className={cls.input + ' pr-12'}
              />
              <button
                type="button" onClick={() => setShowPw(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1f5d3f] hover:text-[#2d6a4f] p-1.5 rounded-lg hover:bg-emerald-50 transition"
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </Field>

            <div className="flex justify-end -mt-1">
              <Link to="/forgot-password" className={cls.link + ' text-xs'}>Forgot password?</Link>
            </div>

            <button type="submit" disabled={loading} className={cls.btn}>
              {loading ? 'Signing in…' : (<>Sign In <FiArrowRight /></>)}
            </button>
          </form>

          <p className={cls.switch}>
            Don't have an account?{' '}
            <Link to="/signup" className={cls.link}>Sign Up</Link>
          </p>
        </div>

        <p className={cls.footNote + ' flex items-center justify-center gap-1.5'}>
          <FiShield className="text-[#1f5d3f]" /> Secured with end-to-end encryption
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SIGN UP
═══════════════════════════════════════════════════════ */
export function SignUpPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ role:'', full_name:'', username:'', email:'', city:'', cnic:'', password:'', confirm_password:'' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    if (!form.role)                              { setError('Please select account type.'); return; }
    if (!validateCNIC(form.cnic))                { setError('CNIC must be 13 digits.'); return; }
    if (!form.email.endsWith('@gmail.com'))      { setError('Only Gmail addresses are accepted.'); return; }
    if (form.password !== form.confirm_password) { setError('Passwords do not match.'); return; }
    if (form.password.length < 8)                { setError('Password must be at least 8 characters.'); return; }
    setLoading(true); setError('');
    try {
      await authAPI.register(form);
      navigate('/verify-otp', { state: { email: form.email } });
    } catch (err) { setError(extractError(err)); }
    finally { setLoading(false); }
  };

  return (
    <div className={cls.page}>
      <Backdrop />
      <div className={cls.shell + ' max-w-xl'}>
        <div className={cls.card}>
          <Brand />
          <div className={cls.iconWrap}><GiPlantSeed /></div>
          <h1 className={cls.title}>Create Account</h1>
          <p className={cls.sub}>Join the AgriCare marketplace today</p>

          {error && <ErrorBox>{error}</ErrorBox>}

          <form onSubmit={submit} className="space-y-4">
            <Field label="Account Type">
              <FiUserPlus className={cls.inputIcon} />
              <select value={form.role} onChange={set('role')} required className={cls.select}>
                <option value="" disabled>Select type</option>
                <option value="farmer">Farmer</option>
                <option value="buyer">Buyer</option>
                <option value="seller">Seller</option>
              </select>
              <FiChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6a8a72] pointer-events-none" />
            </Field>

            <div className={cls.row}>
              <Field label="Full Name">
                <FiUser className={cls.inputIcon} />
                <input type="text" value={form.full_name} onChange={set('full_name')} placeholder="John Doe" required className={cls.input} />
              </Field>
              <Field label="Username">
                <FiUser className={cls.inputIcon} />
                <input type="text" value={form.username} onChange={set('username')} placeholder="johndoe" required className={cls.input} />
              </Field>
            </div>

            <Field label="Email">
              <FiMail className={cls.inputIcon} />
              <input type="email" value={form.email} onChange={set('email')} placeholder="john@gmail.com" required className={cls.input} />
            </Field>

            <div className={cls.row}>
              <Field label="City">
                <FiMapPin className={cls.inputIcon} />
                <input type="text" value={form.city} onChange={set('city')} placeholder="Lahore" required className={cls.input} />
              </Field>
              <Field label="CNIC">
                <FiCreditCard className={cls.inputIcon} />
                <input type="text" value={form.cnic} onChange={set('cnic')} placeholder="13 digits" required className={cls.input} />
              </Field>
            </div>

            <div className={cls.row}>
              <Field label="Password">
                <FiLock className={cls.inputIcon} />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password} onChange={set('password')}
                  placeholder="Min. 8 characters" required
                  className={cls.input + ' pr-12'}
                />
                <button
                  type="button" onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1f5d3f] hover:text-[#2d6a4f] p-1.5 rounded-lg hover:bg-emerald-50 transition"
                >
                  {showPw ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </Field>
              <Field label="Confirm Password">
                <FiLock className={cls.inputIcon} />
                <input type="password" value={form.confirm_password} onChange={set('confirm_password')} placeholder="Repeat password" required className={cls.input} />
              </Field>
            </div>

            <button type="submit" disabled={loading} className={cls.btn}>
              {loading ? 'Sending OTP…' : (<>Send OTP & Register <FiArrowRight /></>)}
            </button>
          </form>

          <p className={cls.switch}>
            Already have an account?{' '}
            <Link to="/signin" className={cls.link}>Sign In</Link>
          </p>
        </div>
        <p className={cls.footNote}>By signing up you agree to our Terms & Privacy Policy</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   OTP VERIFICATION
═══════════════════════════════════════════════════════ */
export function OTPPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email    = location.state?.email || '';

  const [digits,  setDigits]  = useState(['','','','','','']);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const refs = Array.from({ length:6 }, () => useRef(null)); // eslint-disable-line

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...digits]; next[i] = val; setDigits(next);
    if (val && i < 5) refs[i+1].current?.focus();
  };
  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs[i-1].current?.focus();
  };

  const submit = async () => {
    const code = digits.join('');
    if (code.length < 6) { setError('Enter the complete 6-digit OTP.'); return; }
    setLoading(true); setError('');
    try {
      await authAPI.verifyOTP({ email, otp: code });
      setSuccess('Account verified! Redirecting to sign in…');
      setTimeout(() => navigate('/signin'), 1800);
    } catch (err) { setError(extractError(err)); }
    finally { setLoading(false); }
  };

  const resend = async () => {
    setError(''); setSuccess('');
    try {
      await authAPI.resendOTP({ email });
      setSuccess('OTP resent to your email.');
    } catch (err) { setError(extractError(err)); }
  };

  return (
    <div className={cls.page}>
      <Backdrop />
      <div className={cls.shell}>
        <div className={cls.card}>
          <Brand />
          <div className={cls.iconWrap}><FiMail /></div>
          <h1 className={cls.title}>Verify Your Email</h1>
          <p className={cls.sub}>
            We sent a 6-digit OTP to<br />
            <span className="text-[#1f5d3f] font-semibold">{email || 'your email'}</span>
          </p>

          {error && <ErrorBox>{error}</ErrorBox>}
          {success && <SuccessBox>{success}</SuccessBox>}

          <div className="flex justify-between gap-2 sm:gap-3 my-2">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={refs[i]}
                value={d}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                inputMode="numeric"
                maxLength={1}
                className="w-11 h-14 sm:w-12 sm:h-16 text-center text-xl sm:text-2xl font-bold bg-white text-[#0f1f15] border-[1.5px] border-emerald-900/10 rounded-xl outline-none transition-all focus:border-[#2d6a4f] focus:ring-4 focus:ring-[#2d6a4f]/15"
              />
            ))}
          </div>

          <button onClick={submit} disabled={loading} className={cls.btn}>
            {loading ? 'Verifying…' : (<>Verify OTP <FiArrowRight /></>)}
          </button>

          <p className={cls.switch}>
            Didn't receive?{' '}
            <button onClick={resend} className={cls.link + ' bg-transparent border-0 cursor-pointer'}>Resend OTP</button>
            <span className="mx-2 text-emerald-900/20">|</span>
            <button onClick={() => navigate(-1)} className={cls.link + ' bg-transparent border-0 cursor-pointer'}>Back</button>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   FORGOT PASSWORD
═══════════════════════════════════════════════════════ */
export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [sent,    setSent]    = useState(false);

  const submit = async e => {
    e.preventDefault();
    if (!email) { setError('Email is required.'); return; }
    setLoading(true); setError('');
    try {
      await authAPI.forgotPassword({ email });
      setSent(true);
      setTimeout(() => navigate('/reset-password', { state: { email } }), 2000);
    } catch (err) { setError(extractError(err)); }
    finally { setLoading(false); }
  };

  return (
    <div className={cls.page}>
      <Backdrop />
      <div className={cls.shell}>
        <div className={cls.card}>
          <Brand />
          <div className={cls.iconWrap}><FiKey /></div>
          <h1 className={cls.title}>Forgot Password</h1>
          <p className={cls.sub}>Enter your Gmail to receive a reset OTP</p>

          {error && <ErrorBox>{error}</ErrorBox>}
          {sent && <SuccessBox>OTP sent! Redirecting…</SuccessBox>}

          <form onSubmit={submit} className="space-y-4">
            <Field label="Email Address">
              <FiMail className={cls.inputIcon} />
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="john@gmail.com" required className={cls.input}
              />
            </Field>

            <button type="submit" disabled={loading} className={cls.btn}>
              {loading ? 'Sending…' : (<>Send Reset OTP <FiArrowRight /></>)}
            </button>
          </form>

          <p className={cls.switch}>
            <Link to="/signin" className={cls.link + ' inline-flex items-center gap-1.5'}>
              <FiArrowLeft size={14} /> Back to Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   RESET PASSWORD
═══════════════════════════════════════════════════════ */
export function ResetPasswordPage() {
  const navigate     = useNavigate();
  const location     = useLocation();
  const prefillEmail = location.state?.email || '';

  const [form,    setForm]    = useState({ email: prefillEmail, otp:'', new_password:'', confirm:'' });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    if (form.new_password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (form.new_password.length < 8)       { setError('Password must be at least 8 characters.'); return; }
    setLoading(true); setError('');
    try {
      await authAPI.resetPassword({ email: form.email, otp: form.otp, new_password: form.new_password });
      setSuccess('Password reset! Redirecting to sign in…');
      setTimeout(() => navigate('/signin'), 1800);
    } catch (err) { setError(extractError(err)); }
    finally { setLoading(false); }
  };

  return (
    <div className={cls.page}>
      <Backdrop />
      <div className={cls.shell}>
        <div className={cls.card}>
          <Brand />
          <div className={cls.iconWrap}><FiLock /></div>
          <h1 className={cls.title}>Reset Password</h1>
          <p className={cls.sub}>Enter the OTP from your email and choose a new password</p>

          {error && <ErrorBox>{error}</ErrorBox>}
          {success && <SuccessBox>{success}</SuccessBox>}

          <form onSubmit={submit} className="space-y-4">
            <Field label="Email">
              <FiMail className={cls.inputIcon} />
              <input type="email" value={form.email} onChange={set('email')} placeholder="john@gmail.com" required className={cls.input} />
            </Field>

            <Field label="OTP Code">
              <FiKey className={cls.inputIcon} />
              <input type="text" value={form.otp} onChange={set('otp')} placeholder="6-digit code" required className={cls.input} />
            </Field>

            <Field label="New Password">
              <FiLock className={cls.inputIcon} />
              <input type="password" value={form.new_password} onChange={set('new_password')} placeholder="Min. 8 characters" required className={cls.input} />
            </Field>

            <Field label="Confirm Password">
              <FiLock className={cls.inputIcon} />
              <input type="password" value={form.confirm} onChange={set('confirm')} placeholder="Repeat new password" required className={cls.input} />
            </Field>

            <button type="submit" disabled={loading} className={cls.btn}>
              {loading ? 'Resetting…' : (<>Reset Password <FiArrowRight /></>)}
            </button>
          </form>

          <p className={cls.switch}>
            <Link to="/signin" className={cls.link + ' inline-flex items-center gap-1.5'}>
              <FiArrowLeft size={14} /> Back to Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export function AuthPages() {
  return (
    <>
      <SignInPage />
      <SignUpPage />
      <OTPPage />
      <ForgotPasswordPage />
      <ResetPasswordPage />
    </>
  );
}
