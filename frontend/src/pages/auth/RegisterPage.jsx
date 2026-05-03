import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, BookOpen, Calendar, MapPin, School } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { register as registerApi } from '../../api/auth.api';
import useAuthStore from '../../stores/authStore';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { getErrorMessage } from '../../utils/helpers';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userType, setUserType] = useState('STUDENT');
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const password = watch('password');

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const payload = { 
        email: data.email, 
        password: data.password, 
        fullName: data.fullName,
        userType,
        schoolName: data.schoolName,
      };
      
      if (userType === 'STUDENT') {
        payload.dateOfBirth = data.dateOfBirth;
        payload.hometown = data.hometown;
      }
      
      const res = await registerApi(payload);
      login(res.data.user, res.data.accessToken, res.data.refreshToken);
      toast.success('Đăng ký thành công!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 py-12">
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-7">
          <div className="w-7 h-7 bg-blue-600 flex items-center justify-center" style={{ borderRadius: '3px' }}>
            <BookOpen size={14} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 text-sm">OnThiVao10HaiPhong</span>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-1">Tạo tài khoản</h2>
        <p className="text-sm text-gray-500 mb-6">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-blue-600 hover:underline font-medium">Đăng nhập</Link>
        </p>

        <div className="bg-white border border-gray-200 p-6 shadow-card" style={{ borderRadius: '4px' }}>
          
          {/* Tabs for UserType */}
          <div className="flex bg-gray-100 p-1 rounded mb-6">
            <button
              type="button"
              className={`flex-1 text-sm font-medium py-1.5 rounded transition-all ${userType === 'STUDENT' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setUserType('STUDENT')}
            >
              Học sinh
            </button>
            <button
              type="button"
              className={`flex-1 text-sm font-medium py-1.5 rounded transition-all ${userType === 'TEACHER' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setUserType('TEACHER')}
            >
              Giáo viên
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="Họ và tên"
              icon={User}
              placeholder="Nguyễn Văn A"
              error={errors.fullName?.message}
              {...register('fullName', {
                required: 'Họ và tên là bắt buộc.',
                minLength: { value: 2, message: 'Ít nhất 2 ký tự.' },
              })}
            />
            
            <Input
              label={userType === 'STUDENT' ? 'Trường đang học' : 'Trường đang công tác'}
              icon={School}
              placeholder={userType === 'STUDENT' ? 'Trường THCS/THPT...' : 'Trường THCS/THPT...'}
              error={errors.schoolName?.message}
              {...register('schoolName', {
                required: 'Vui lòng nhập tên trường.',
              })}
            />

            {userType === 'STUDENT' && (
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Ngày sinh"
                  type="date"
                  icon={Calendar}
                  error={errors.dateOfBirth?.message}
                  {...register('dateOfBirth', {
                    required: 'Ngày sinh là bắt buộc.',
                  })}
                />
                <Input
                  label="Quê quán"
                  icon={MapPin}
                  placeholder="Thành phố / Tỉnh"
                  error={errors.hometown?.message}
                  {...register('hometown', {
                    required: 'Quê quán là bắt buộc.',
                  })}
                />
              </div>
            )}

            <Input
              label="Email"
              type="email"
              icon={Mail}
              placeholder="your@email.com"
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
                placeholder="Ít nhất 6 ký tự"
                error={errors.password?.message}
                {...register('password', {
                  required: 'Mật khẩu là bắt buộc.',
                  minLength: { value: 6, message: 'Ít nhất 6 ký tự.' },
                })}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-8 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <Input
              label="Xác nhận mật khẩu"
              type={showPassword ? 'text' : 'password'}
              icon={Lock}
              placeholder="Nhập lại mật khẩu"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword', {
                required: 'Vui lòng xác nhận.',
                validate: (v) => v === password || 'Mật khẩu không khớp.',
              })}
            />
            <Button type="submit" variant="primary" size="lg" fullWidth loading={isLoading} iconRight={ArrowRight} className="mt-1">
              Tạo tài khoản
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

