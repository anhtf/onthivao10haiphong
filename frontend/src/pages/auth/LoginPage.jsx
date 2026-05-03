import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, BookOpen } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { login as loginApi } from '../../api/auth.api';
import useAuthStore from '../../stores/authStore';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { getErrorMessage } from '../../utils/helpers';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const res = await loginApi(data);
      login(res.data.user, res.data.accessToken, res.data.refreshToken);
      toast.success(`Chào mừng, ${res.data.user.fullName}!`);
      navigate(res.data.user.role === 'ADMIN' ? '/admin' : '/dashboard', { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 bg-blue-600 p-10 text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-white/20 flex items-center justify-center" style={{ borderRadius: '3px' }}>
            <BookOpen size={14} className="text-white" />
          </div>
          <span className="font-bold text-sm">OnThiVao10HaiPhong</span>
        </div>

        <div>
          <h1 className="text-3xl font-bold leading-snug mb-4">
            Luyện thi Toán<br />vào lớp 10<br />Hải Phòng
          </h1>
          <p className="text-blue-100 text-sm leading-relaxed">
            Ngân hàng đề thi với hàng trăm câu hỏi, hỗ trợ công thức Toán học, chấm điểm tức thì.
          </p>

          <div className="grid grid-cols-3 gap-3 mt-10">
            {[
              { label: 'Đề thi', value: '100+' },
              { label: 'Học sinh', value: '1000+' },
              { label: 'Câu hỏi', value: '5000+' },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 px-3 py-3" style={{ borderRadius: '3px' }}>
                <div className="text-xl font-bold">{s.value}</div>
                <div className="text-xs text-blue-200 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-blue-200">
          © 2024 OnThiVao10HaiPhong
        </p>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm animate-slide-up">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-7 h-7 bg-blue-600 flex items-center justify-center" style={{ borderRadius: '3px' }}>
              <BookOpen size={14} className="text-white" />
            </div>
            <span className="font-bold text-gray-900">OnThiVao10HaiPhong</span>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-1">Đăng nhập</h2>
          <p className="text-sm text-gray-500 mb-6">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-blue-600 hover:underline font-medium">Đăng ký</Link>
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              icon={Mail}
              placeholder="your@email.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email', {
                required: 'Email là bắt buộc.',
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email không hợp lệ.' },
              })}
            />
            <div className="relative">
              <Input
                label="Mật khẩu"
                type={showPassword ? 'text' : 'password'}
                icon={Lock}
                placeholder="••••••••"
                autoComplete="current-password"
                error={errors.password?.message}
                {...register('password', { required: 'Mật khẩu là bắt buộc.' })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            <Button type="submit" variant="primary" size="lg" fullWidth loading={isLoading} iconRight={ArrowRight} className="mt-1">
              Đăng nhập
            </Button>
          </form>

          {/* Demo hint */}
          <div className="mt-6 p-4 bg-gray-100 border border-gray-200" style={{ borderRadius: '3px' }}>
            <p className="text-xs text-gray-500 font-medium mb-1.5">Demo admin</p>
            <p className="text-xs text-gray-600 font-mono">admin@onthivao.edu.vn</p>
            <p className="text-xs text-gray-600 font-mono">Admin@123456</p>
          </div>
        </div>
      </div>
    </div>
  );
}
