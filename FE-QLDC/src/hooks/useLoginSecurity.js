// 🛡️ hooks/useLoginSecurity.js
import { useState, useEffect } from "react";

// ✅ Hook lưu state trong localStorage (an toàn)
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }, [key, value]);

  return [value, setValue];
}

// ✅ Hook chính
export const useLoginSecurity = () => {
  const [loginAttempts, setLoginAttempts] = useLocalStorage("loginAttempts", 0);
  const [lockUntil, setLockUntil] = useLocalStorage("lockUntil", null);
  const [lockRemaining, setLockRemaining] = useState(0);

  // 🧩 TỰ RESET nếu dữ liệu cũ lỗi thời (ví dụ khi đổi lockTime)
  useEffect(() => {
    // Nếu lockUntil > 5 phút so với hiện tại => dữ liệu cũ => reset
    if (lockUntil && lockUntil - Date.now() > 5 * 60 * 1000) {
      setLoginAttempts(0);
      setLockUntil(null);
    }
  }, []); // chạy 1 lần khi khởi tạo

  // 🧠 Cập nhật thời gian còn lại mỗi giây
  useEffect(() => {
    if (!lockUntil) return;

    const updateRemaining = () => {
      const remaining = Math.max(0, lockUntil - Date.now());
      setLockRemaining(remaining);

      // Hết thời gian khóa → tự reset
      if (remaining <= 0) {
        setLoginAttempts(0);
        setLockUntil(null);
      }
    };

    updateRemaining(); // chạy ngay 1 lần
    const interval = setInterval(updateRemaining, 1000); // cập nhật mỗi giây
    return () => clearInterval(interval);
  }, [lockUntil]);

  const isLocked = lockUntil && Date.now() < lockUntil;
  const remainingAttempts = Math.max(0, 5 - loginAttempts);

  const recordFailedAttempt = () => {
    const newAttempts = loginAttempts + 1;
    setLoginAttempts(newAttempts);

    if (newAttempts >= 5) {
      const lockTime = 15 * 1000; // 🔒 Khóa 15 giây
      setLockUntil(Date.now() + lockTime);
    }
  };

  const recordSuccess = () => {
    setLoginAttempts(0);
    setLockUntil(null);
  };

  return {
    isLocked,
    loginAttempts,
    remainingAttempts,
    lockRemaining,
    recordFailedAttempt,
    recordSuccess,
  };
};
