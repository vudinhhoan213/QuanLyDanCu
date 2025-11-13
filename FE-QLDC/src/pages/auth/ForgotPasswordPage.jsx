import { useState, useRef, useEffect } from "react";
import { message, Tooltip } from "antd";
import { EyeOutlined, EyeInvisibleOutlined, SafetyOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const ForgotPasswordPage = () => {
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(300);
  const navigate = useNavigate();
  const identifierRef = useRef(null);
  const otpRef = useRef(null);
  const passwordRef = useRef(null);
  useEffect(() => {
    console.log("🔄 STEP CHANGED:", step);
  }, [step]);

  useEffect(() => {
    identifierRef.current?.focus();
  }, []);

  useEffect(() => {
  if (step === 2) {
    otpRef.current?.focus();
  }
  }, [step]);

  useEffect(() => {
  if (step === 3) {
    passwordRef.current?.focus();
  }
  }, [step]);

  useEffect(() => {
    if (step !== 2) return;
    const timer = setInterval(() => {
      setOtpCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [step]);

  const handleSendOtp = async () => {
    if (!identifier.trim()) 
      return message.error("Vui lòng nhập email hoặc số điện thoại");

    console.log("🔍 1. Bắt đầu gửi OTP, identifier:", identifier);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3000/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không thể gửi mã OTP");

      setStep(2);
      setOtpCountdown(300);
      message.success("OTP đã được gửi đến email của bạn!");
    } catch (err) {
      message.error(err.message || "Có lỗi xảy ra khi gửi OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) return message.error("Nhập OTP");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ identifier: identifier, otp: otp }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "OTP không hợp lệ");

      setStep(3);
      message.success("Xác thực OTP thành công!");
    } catch (err) {
      message.error(err.message || "OTP không hợp lệ");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim()) return message.error("Nhập mật khẩu mới");
    setLoading(true);
    try {
      const payload = { 
        email: identifier, 
        otp: otp, 
        newPassword: newPassword 
      };

      const res = await fetch("http://localhost:3000/auth/reset-password", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Đặt lại mật khẩu thất bại");

      message.success("Đặt lại mật khẩu thành công! Về đăng nhập.");
      navigate("/login");
    } catch (err) {
      message.error(err.message || "Đặt mật khẩu thất bại");
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(prev => !prev);

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-100 via-indigo-100 to-indigo-200">
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md bg-white p-10 rounded-3xl shadow-2xl space-y-8">
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-200 to-blue-400 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg">
              <SafetyOutlined className="text-5xl text-white drop-shadow-md" />
            </div>
            <h2 className="text-4xl font-extrabold text-gray-900 mb-2">Quên mật khẩu</h2>
            <p className="text-gray-600 text-sm">
              Hệ thống quản lý dân cư & khen thưởng
            </p>
          </div>

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <input
                ref={identifierRef}
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendOtp()}
                placeholder="Nhập email hoặc số điện thoại"
                className="w-full px-6 py-5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-800 placeholder-gray-400"
                disabled={loading}
              />
              <button
                onClick={handleSendOtp}
                disabled={loading || !identifier.trim()}
                className="w-full py-5 px-6 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Đang gửi OTP..." : "Gửi OTP"}
              </button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Quay lại đăng nhập
                </button>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-gray-500 text-center">
                OTP sẽ hết hạn sau {otpCountdown}s
              </p>
              <input
                ref={otpRef}
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleVerifyOtp()}
                placeholder="Nhập OTP"
                className="w-full px-6 py-5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-800 placeholder-gray-400"
                disabled={loading}
              />
              <button
                onClick={handleVerifyOtp}
                disabled={loading || !otp.trim()}
                className="w-full py-5 px-6 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Đang xác thực..." : "Xác thực OTP"}
              </button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Thay đổi email/số điện thoại
                </button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="relative">
                <input
                  ref={passwordRef}
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleResetPassword()}
                  placeholder="Nhập mật khẩu mới"
                  className="w-full px-6 py-5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-14 outline-none transition-all text-gray-800 placeholder-gray-400"
                  disabled={loading}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <Tooltip title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"} placement="top">
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
              <button
                onClick={handleResetPassword}
                disabled={loading || !newPassword.trim()}
                className="w-full py-5 px-6 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
