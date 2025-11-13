import { useState, useEffect } from "react";

// 🧩 Hook lưu trong localStorage an toàn
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

// 🛡️ Hook chính quản lý bảo mật đăng nhập
export const useLoginSecurity = () => {
  const MAX_ATTEMPTS = 5;
  const LOCK_TIME_MS = 15 * 1000; // 🔒 15 giây

  const [loginAttempts, setLoginAttempts] = useLocalStorage("loginAttempts", 0);
  const [lockUntil, setLockUntil] = useLocalStorage("lockUntil", null);
  const [lockRemaining, setLockRemaining] = useState(0);

  // 🧠 Cập nhật thời gian còn lại mỗi giây
  useEffect(() => {
    if (!lockUntil) {
      setLockRemaining(0);
      return;
    }

    const update = () => {
      const remaining = Math.max(0, lockUntil - Date.now());
      setLockRemaining(remaining);

      // Hết thời gian khóa → reset
      if (remaining <= 0) {
        setLoginAttempts(0);
        setLockUntil(null);
      }
    };

    update(); // chạy ngay lập tức
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [lockUntil]);

  const isLocked = !!lockUntil && Date.now() < lockUntil;
  const remainingAttempts = Math.max(0, MAX_ATTEMPTS - loginAttempts);

  const recordFailedAttempt = () => {
    const newAttempts = loginAttempts + 1;
    setLoginAttempts(newAttempts);

    if (newAttempts >= MAX_ATTEMPTS) {
      setLockUntil(Date.now() + LOCK_TIME_MS);
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
