'use client';

import { useEffect, useState } from 'react';

const timeFormat = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false });
const dateFormat = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', weekday: 'long', day: 'numeric', month: 'long' });

// Bangalore time. Starts as a placeholder so server and client render the same markup.
export function useIstTime() {
  const [now, setNow] = useState(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(id);
  }, []);

  return {
    time: now ? timeFormat.format(now) : '09:41',
    date: now ? dateFormat.format(now) : 'Today',
  };
}
