import { useEffect, useState } from 'react';
import { todayISO } from './format.js';

export function useLocalDay() {
  const [today, setToday] = useState(todayISO);
  useEffect(() => {
    let timer;
    const sync = () => {
      setToday(todayISO());
      clearTimeout(timer);
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 100);
      timer = setTimeout(sync, midnight.getTime() - Date.now());
    };
    sync();
    window.addEventListener('focus', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('focus', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);
  return today;
}
