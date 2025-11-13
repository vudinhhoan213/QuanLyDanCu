//Ưu điểm: Có thời gian đếm ngược, số lần nhập sai
//Khóa acc 15s, logo vuông, match với
//Màn hình bên trái, có quên mật khẩu
//Nhược điểm: độ rộng nhỏ hơn ban đầu
// 🎯 Import hooks & thư viện
import { useState, useCallback, useEffect, useRef } from "react";
import { message, Tooltip } from "antd";
import {
  SafetyOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLoginSecurity } from "../../hooks/useLoginSecurity"; // ✅ Hook bảo mật
// ✅ Định nghĩa hằng số vai trò người dùng
const ROLES = {
  LEADER: "TO_TRUONG",
  CITIZEN: "CONG_DAN",
};
// ✅ Định nghĩa route điều hướng tương ứng từng vai trò
const ROUTES = {
  LEADER_DASHBOARD: "/leader/dashboard",
  CITIZEN_DASHBOARD: "/citizen/dashboard",
};
const LoginPage = () => {
  // 🎯 STATE QUẢN LÝ FORM
  const [loading, setLoading] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false); // ✅ Ghi nhớ đăng nhập
  // 🎯 HOOKS
  const navigate = useNavigate();
  const { login } = useAuth();
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);

  // ✅ Hook bảo mật đăng nhập
  const {
    isLocked,
    loginAttempts,
    remainingAttempts,
    lockRemaining,
    recordFailedAttempt,
    recordSuccess,
  } = useLoginSecurity();
  // 🧠 Tự động focus khi người dùng mở trang đăng nhập
  useEffect(() => {
    usernameRef.current?.focus();
  }, []);
  // 🧠 Nếu người dùng đã chọn "Ghi nhớ đăng nhập" thì tải lại username
  useEffect(() => {
    const savedUser = localStorage.getItem("rememberedUser");
    if (savedUser) {
      setIdentifier(savedUser);
      setRememberMe(true);
    }
  }, []);
  // 🧠 Lưu hoặc xóa username khi người dùng bật/tắt "Ghi nhớ đăng nhập"
  useEffect(() => {
    if (rememberMe && identifier.trim()) {
      localStorage.setItem("rememberedUser", identifier);
    } else {
      localStorage.removeItem("rememberedUser");
    }
  }, [rememberMe, identifier]);
  // 🔐 Xử lý logic đăng nhập
  const handleLogin = useCallback(async () => {
    if (isLocked) {
      message.warning(
        `Tài khoản tạm bị khóa, vui lòng thử lại sau ${Math.ceil(
          lockRemaining / 1000
        )} giây`
      );
      return;
    }
    setLoading(true);
    setError("");
    try {
      // Thêm delay nhỏ để UX mượt hơn
      await new Promise((r) => setTimeout(r, 400));
      // Gọi hàm login từ AuthContext
      const user = await login({ identifier, password });
      // Nếu đăng nhập đúng
      recordSuccess();
      message.success("Đăng nhập thành công 🎉");
      // Điều hướng theo vai trò
      const isLeader = user.role === ROLES.LEADER;
      setTimeout(() => {
        navigate(isLeader ? ROUTES.LEADER_DASHBOARD : ROUTES.CITIZEN_DASHBOARD);
      }, 500);
    } catch (err) {
      recordFailedAttempt(); // ✅ Ghi nhận thất bại
      const errorMsg = err.message || "Tài khoản hoặc mật khẩu không đúng";
      setError(errorMsg);
      if (remainingAttempts > 0) {
        message.error(
          `${errorMsg}. Bạn còn ${remainingAttempts} lần thử trước khi bị khóa.`
        );
      } else {
        message.error("Tài khoản tạm bị khóa trong 15 giây 🚫");
      }
    } finally {
      setLoading(false);
    }
  }, [
    identifier,
    password,
    login,
    navigate,
    isLocked,
    lockRemaining,
    remainingAttempts,
    recordFailedAttempt,
    recordSuccess,
  ]);
  // 📥 Submit form
  const handleSubmit = (e) => {
  e.preventDefault();

    if (!identifier.trim()) {
     setError("Vui lòng nhập tài khoản");
      usernameRef.current?.focus(); // focus vào username nếu trống
     return;
    }

   if (!password.trim()) {
      setError("Vui lòng nhập mật khẩu");
     passwordRef.current?.focus(); // focus vào password nếu trống
      return;
   }

  setError(""); // xóa lỗi trước khi login
  handleLogin();
};
  // 👁️ Toggle hiển thị mật khẩu
  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);
  // 🎨 GIAO DIỆN
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-100 via-indigo-100 to-indigo-200">
      {/* 🖼️ BÊN TRÁI */}
      <div className="hidden md:flex flex-1 items-center justify-center p-8">
        <img
          src="/images/Screenshot 2025-10-29 222421.jpg"
          alt="Hệ thống quản lý dân cư"
          className="w-full h-full object-cover rounded-2xl shadow-lg"
        />
      </div>
      {/* 🧾 BÊN PHẢI */}
      <div className="flex-1 flex items-center justify-center bg-white rounded-l-3xl shadow-2xl">
        <div className="w-full max-w-md p-10 space-y-10">
          {/* 🔷 HEADER */}
          <div className="text-center animate-fadeIn">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-200 to-blue-400 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg">
              <SafetyOutlined className="text-5xl text-white drop-shadow-md" />
            </div>
            <h2 className="text-4xl font-extrabold text-gray-900">
              Đăng nhập hệ thống
            </h2>
            <p className="text-gray-600 mt-3 text-sm">
              Hệ thống quản lý dân cư & khen thưởng
            </p>
          </div>
          {/* 🔑 FORM */}
          <form onSubmit={handleSubmit} className="space-y-6">
  {/* 🧍‍♂️ TÊN ĐĂNG NHẬP */}
  <div className="animate-fadeIn">
    <label className="block text-base font-medium text-gray-700 mb-2">
      Tên đăng nhập
    </label>
    <input
      ref={usernameRef}
      type="text"
      value={identifier}
      onChange={(e) => {
        setIdentifier(e.target.value);
        setError("");
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          if (!identifier.trim()) {
            setError("Vui lòng nhập tài khoản");
            usernameRef.current?.focus();
          } else if (!password.trim()) {
            passwordRef.current?.focus();
          } else {
            handleSubmit(e); // submit form
          }
        }
      }}
      className="w-full px-6 py-5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-800 placeholder-gray-400"
      placeholder="Nhập tên đăng nhập"
      disabled={loading || isLocked}
    />
  </div>

  {/* 🔒 MẬT KHẨU */}
  <div className="animate-fadeIn delay-100">
    <label className="block text-base font-medium text-gray-700 mb-2">
      Mật khẩu
    </label>
    <div className="relative">
      <input
        ref={passwordRef}
        type={showPassword ? "text" : "password"}
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          setError("");
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleSubmit(e); // submit form trực tiếp
          }
        }}
        className="w-full px-6 py-5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-14 outline-none transition-all text-gray-800 placeholder-gray-400"
        placeholder="Nhập mật khẩu"
        disabled={loading || isLocked}
      />
      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
        <Tooltip
          title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          placement="top"
        >
          <button
            type="button"
            onClick={togglePasswordVisibility}
            disabled={loading}
            className="text-gray-500 hover:text-blue-600 text-2xl transition-colors"
          >
            {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
          </button>
        </Tooltip>
      </div>
         {" "}
    </div>
  </div>

  {/* ⚠️ CẢNH BÁO SAI / KHÓA */}
  {isLocked ? (
    <div className="p-4 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-xl text-center">
      🚫 Tài khoản bị khóa. Thử lại sau{" "}
      <strong>{Math.ceil(lockRemaining / 1000)} giây</strong>.
    </div>
  ) : loginAttempts > 0 ? (
    <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-center">
      Sai {loginAttempts} lần. Còn {remainingAttempts} lần trước khi bị khóa.
    </div>
  ) : null}

  {/* 🧠 GHI NHỚ ĐĂNG NHẬP */}
  <div className="flex items-center justify-between animate-fadeIn delay-150">
    <label className="flex items-center space-x-2 text-gray-700 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={rememberMe}
        onChange={(e) => setRememberMe(e.target.checked)}
        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
      />
      <span className="text-sm font-medium">Ghi nhớ đăng nhập</span>
    </label>
    <button
      type="button"
      disabled={loading}
      onClick={() => navigate("/forgot-password")}
      span className="font-medium text-blue-600 hover:underline text-sm"
    >
      <span className="font-medium text-blue-600 hover:underline text-sm">
        Quên mật khẩu?
      </span>
    </button>
  </div>

  {/* 🔘 NÚT ĐĂNG NHẬP */}
  <button
    type="submit"
    disabled={loading || isLocked || !identifier.trim() || !password.trim()}
    className="w-full py-5 px-6 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed text-lg"
  >
    {loading ? (
      <div className="flex items-center justify-center space-x-2">
        <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
        <span>Đang đăng nhập...</span>
      </div>
    ) : (
      "Đăng nhập"
    )}
  </button>
</form>

          {/* 📞 FOOTER */}
          <div className="mt-8 text-center text-sm text-gray-500">
            Hỗ trợ kỹ thuật:{" "}
            <span className="font-medium text-blue-600">
              Ban quản lý - 0900.xxx.xxx
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default LoginPage;