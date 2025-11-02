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
  const [loading, setLoading] = useState(false); // Trạng thái loading khi đăng nhập
  const [identifier, setIdentifier] = useState(""); // Tên đăng nhập
  const [password, setPassword] = useState(""); // Mật khẩu
  const [error, setError] = useState(""); // Thông báo lỗi hiển thị
  const [showPassword, setShowPassword] = useState(false); // Toggle ẩn/hiện mật khẩu

  // 🎯 HOOKS
  const navigate = useNavigate(); // Điều hướng sau khi đăng nhập
  const { login } = useAuth(); // Lấy hàm login từ context
  const usernameRef = useRef(null); // Ref để tự động focus ô nhập tên đăng nhập

  // 🧠 Tự động focus khi người dùng mở trang đăng nhập
  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  // 🔐 Xử lý logic đăng nhập
  const handleLogin = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // Thêm delay nhỏ để UX mượt hơn
      await new Promise((r) => setTimeout(r, 400));

      // Gọi hàm login từ AuthContext
      const user = await login({ identifier, password });

      // Thông báo thành công
      message.success("Đăng nhập thành công 🎉");

      // Kiểm tra vai trò để điều hướng đến đúng dashboard
      const isLeader = user.role === ROLES.LEADER;
      setTimeout(() => {
        navigate(isLeader ? ROUTES.LEADER_DASHBOARD : ROUTES.CITIZEN_DASHBOARD);
      }, 500);
    } catch (err) {
      // Hiển thị thông báo lỗi (nếu có)
      const errorMsg = err.message || "Tài khoản hoặc mật khẩu không đúng";
      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      // Dừng trạng thái loading
      setLoading(false);
    }
  }, [identifier, password, login, navigate]);

  // 📥 Xử lý submit form
  const handleSubmit = (e) => {
    e.preventDefault();

    // Kiểm tra rỗng trước khi gửi
    if (!identifier.trim() || !password.trim()) {
      setError("Vui lòng nhập tài khoản và mật khẩu");
      return;
    }

    handleLogin();
  };

  // 👁️ Toggle hiển thị mật khẩu
  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

  // 🎨 GIAO DIỆN CHÍNH
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-100 via-indigo-100 to-indigo-200">
      {/* 🖼️ BÊN TRÁI - ẢNH MINH HỌA */}
      <div className="hidden md:flex flex-1 items-center justify-center p-8">
        <img
          src="/images/Screenshot 2025-10-29 222421.jpg"
          alt="Hệ thống quản lý dân cư"
          className="w-full h-full object-cover rounded-2xl shadow-lg"
        />
      </div>

      {/* 🧾 BÊN PHẢI - FORM ĐĂNG NHẬP */}
      <div className="flex-1 flex items-center justify-center bg-white rounded-l-3xl shadow-2xl">
        <div className="w-full max-w-md p-10 space-y-10">
          {/* 🔷 HEADER */}
          <div className="text-center animate-fadeIn">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg">
              <SafetyOutlined className="text-6xl text-blue-500" />
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
            {/* 🧍‍♂️ Ô nhập TÊN ĐĂNG NHẬP */}
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
                className="w-full px-6 py-5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-800 placeholder-gray-400"
                placeholder="Nhập tên đăng nhập"
                disabled={loading}
              />
            </div>

            {/* 🔒 Ô nhập MẬT KHẨU */}
            <div className="animate-fadeIn delay-100">
              <label className="block text-base font-medium text-gray-700 mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  className="w-full px-6 py-5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-14 outline-none transition-all text-gray-800 placeholder-gray-400"
                  placeholder="Nhập mật khẩu"
                  disabled={loading}
                />

                {/* 👁️ Nút ẩn/hiện mật khẩu */}
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
              </div>
            </div>

            {/* ✅ Ghi nhớ đăng nhập & Quên mật khẩu */}
            <div className="flex items-center justify-between animate-fadeIn delay-200 text-sm">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="w-6 h-6 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  disabled={loading}
                />
                <span className="text-base text-gray-600">Ghi nhớ đăng nhập</span>
              </label>
              <button
                type="button"
                disabled={loading}
                className="text-blue-600 hover:text-blue-800 transition"
              >
                Quên mật khẩu?
              </button>
            </div>

            {/* ⚠️ HIỂN THỊ LỖI */}
            {error && (
              <div className="animate-fadeIn p-5 bg-red-50 border border-red-200 rounded-xl text-center text-red-600 text-base">
                {error}
              </div>
            )}

            {/* 🔘 NÚT ĐĂNG NHẬP */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 px-6 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {loading ? (
                // Hiệu ứng loading xoay + text
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
            Hỗ trợ: Ban quản lý - 0900.xxx.xxx
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
