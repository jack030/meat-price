import { useEffect, useRef, useState } from 'react';

export default function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = window.localStorage.getItem(key);
      return saved === null ? (typeof initialValue === 'function' ? initialValue() : initialValue) : JSON.parse(saved);
    } catch {
      return typeof initialValue === 'function' ? initialValue() : initialValue;
    }
  });
  const isFirstWrite = useRef(true);
  useEffect(() => {
    if (isFirstWrite.current) {
      isFirstWrite.current = false;
      return;
    }
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
  }, [key, value]);
  return [value, setValue];
}
