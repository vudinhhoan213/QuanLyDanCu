"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const LoginPage = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!identifier || !password) {
      setError("Vui lòng nhập tài khoản và mật khẩu");
      return;
    }

    (async () => {
      try {
        const user = await login({ identifier, password });
        const isLeader = user.role === "TO_TRUONG";
        navigate(isLeader ? "/leader/dashboard" : "/citizen/dashboard");
      } catch (err) {
        setError(err?.response?.data?.message || "Đăng nhập thất bại");
      }
    })();
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat relative"
      style={{
        backgroundImage:
          "url(https://media.istockphoto.com/id/1320991884/vi/anh/nh%C3%ACn-t%E1%BB%AB-tr%C3%AAn-kh%C3%B4ng-c%E1%BB%A7a-residential-distratic-t%E1%BA%A1i-major-mackenzie-dr-v%C3%A0-islinton-ave-ng%C3%B4i-nh%C3%A0.jpg?s=612x612&w=0&k=20&c=ozR2EvckMfAj714b261rhjXtA_NQwfMt-wsL0_4Tpgg=)",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/60 via-indigo-900/50 to-purple-900/60"></div>
      <div className="bg-white/95 backdrop-blur-sm p-8 rounded-lg shadow-2xl w-full max-w-md relative z-10">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Quản Lý Dân Cư
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tài khoản
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Tên đăng nhập hoặc Email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mật khẩu
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
          >
            Đăng nhập
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
