import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Landmark, ArrowRight, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { loginThunk, clearError } from '@/store/slices/authSlice';
import { cn } from '@/utils/cn';

interface LoginForm {
  username: string;
  password: string;
}

const schema = Yup.object({
  username: Yup.string().required('Username is required'),
  password: Yup.string().required('Password is required'),
});

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error } = useAppSelector((s) => s.auth);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: LoginForm) => {
    dispatch(clearError());
    const result = await dispatch(loginThunk({ username: data.username, password: data.password }));
    if (loginThunk.fulfilled.match(result)) {
      navigate('/dashboard', { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50/50 to-white px-4">
      {/* Decorative orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-40 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-indigo-100 rounded-full blur-3xl opacity-30 pointer-events-none" />

      <div className="relative w-full max-w-sm animate-fade-in">
        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl px-8 py-9">
          {/* Brand */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-md mb-4">
              <Landmark size={24} className="text-white" />
            </div>
            <h1 className="text-lg font-bold text-slate-800 text-center leading-tight">
              Haldia Development Authority
            </h1>
            <p className="text-xs text-slate-400 mt-1">Secure access to official services</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm animate-fade-in">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Username */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Username or Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
  {...register('username')}
  type="text"
  placeholder="Enter your username"
  disabled={loading}
  autoComplete="username"
  style={{ paddingLeft: '2.5rem' }}
  className={cn(
    'form-input h-10 pl-10 pr-3',
    errors.username && 'border-red-400 focus:ring-red-400/40',
  )}
                />
              </div>
              {errors.username && <p className="form-error">{errors.username.message}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
               
                <input
  {...register('password')}
  type={showPassword ? 'text' : 'password'}
  placeholder="••••••••"
  disabled={loading}
  autoComplete="current-password"
  style={{ paddingLeft: '2.5rem' }}
  className={cn(
    'form-input h-10 pl-10 pr-10',
    errors.password && 'border-red-400 focus:ring-red-400/40',
  )}
/>
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="form-error">{errors.password.message}</p>}
            </div>

            {/* Options */}
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-1.5 text-slate-500 cursor-pointer">
                <input type="checkbox" className="rounded" />
                Remember me
              </label>
              <button type="button" className="text-blue-600 hover:text-blue-700 transition-colors">
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full h-9 flex items-center justify-center gap-2 rounded-lg text-sm font-medium',
                'bg-blue-600 text-white hover:bg-blue-700 transition-colors',
                'disabled:opacity-60 disabled:cursor-not-allowed',
                'focus:outline-none focus:ring-2 focus:ring-blue-500/40',
              )}
            >
              {loading ? (
                <><Loader2 size={15} className="animate-spin" /> Signing in…</>
              ) : (
                <>Sign In <ArrowRight size={15} /></>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-4">
          HMIS © {new Date().getFullYear()} Haldia Development Authority
        </p>
      </div>
    </div>
  );
}
