import { Link, useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, LogOut, LayoutDashboard, ChevronDown, Sparkles, User, Settings } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const handleComingSoon = (e) => {
    e.preventDefault();
    toast('Tính năng này đang được phát triển. Vui lòng quay lại sau! 🚀', {
      icon: '🔒',
      duration: 3000,
    });
  };

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to={isAdmin ? '/admin' : '/dashboard'} className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-blue-600 flex items-center justify-center" style={{ borderRadius: '3px' }}>
              <BookOpen size={14} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-sm tracking-tight">
              OnThiVao10<span className="text-blue-600">HaiPhong</span>
            </span>
          </Link>

          {/* Nav Links (Centered/Left-aligned next to logo) */}
          <div className="hidden md:flex items-center gap-6 ml-8 mr-auto">
            <Link
              to={isAdmin ? '/admin' : '/dashboard'}
              className={`text-sm font-medium transition-colors ${
                isActive(isAdmin ? '/admin' : '/dashboard') ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Trang chủ
            </Link>

            {/* Dropdown Khóa học */}
            <div className="relative group cursor-pointer py-4">
              <div className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Khóa học
                <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-200" />
              </div>
              
              <div className="absolute top-full left-0 w-64 bg-white border border-gray-100 shadow-xl rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-1 group-hover:translate-y-0 z-50">
                <div className="py-2">
                  <Link to="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600">ÔN TOÁN THI VÀO 10</Link>
                  <a href="#" onClick={handleComingSoon} className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex justify-between items-center">
                    ÔN TOÁN THI THPT QG
                    <span className="text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full font-medium">Mới</span>
                  </a>
                  <a href="#" onClick={handleComingSoon} className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600">TSA</a>
                  <a href="#" onClick={handleComingSoon} className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600">HSA</a>
                  <div className="border-t border-gray-100 my-1"></div>
                  <a href="#" onClick={handleComingSoon} className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600">Tài liệu lý thuyết</a>
                </div>
              </div>
            </div>

            <a
              href="#"
              onClick={handleComingSoon}
              className="flex items-center gap-1 text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors"
            >
              <Sparkles size={14} />
              Nâng cấp
            </a>
          </div>

          {/* User Account Dropdown */}
          <div className="relative group cursor-pointer py-2">
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <div className="text-sm font-medium text-gray-900 leading-none">{user?.fullName}</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {isAdmin ? 'Quản trị viên' : user?.isPro ? 'Học sinh Pro' : 'Học sinh'}
                </div>
              </div>
              <div className="w-8 h-8 bg-blue-600 flex items-center justify-center text-white text-sm font-bold rounded-full">
                {user?.fullName?.[0]?.toUpperCase() || '?'}
              </div>
              <ChevronDown size={14} className="text-gray-400 group-hover:text-gray-600" />
            </div>

            <div className="absolute top-full right-0 w-48 bg-white border border-gray-100 shadow-xl rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-1 group-hover:translate-y-0 z-50">
              <div className="py-2">
                <div className="px-4 py-2 border-b border-gray-100 mb-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user?.fullName}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
                <a href="#" onClick={handleComingSoon} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <User size={14} /> Hồ sơ của tôi
                </a>
                <a href="#" onClick={handleComingSoon} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <Settings size={14} /> Cài đặt
                </a>
                <div className="border-t border-gray-100 my-1"></div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left transition-colors"
                >
                  <LogOut size={14} /> Đăng xuất
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </nav>
  );
}
