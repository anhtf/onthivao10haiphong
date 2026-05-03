import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Countdown timer hook.
 * @param {number} totalSeconds - Total seconds for the exam
 * @param {function} onExpire - Callback when timer reaches 0
 * @returns {{ timeLeft, isExpired, formattedTime, warningLevel }}
 */
export default function useTimer(totalSeconds, onExpire) {
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (totalSeconds <= 0) return;
    setTimeLeft(totalSeconds);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onExpireRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [totalSeconds]);

  const formatTime = useCallback((seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, []);

  const isExpired = timeLeft <= 0;
  // Warning levels: 'normal' | 'warning' (< 25%) | 'critical' (< 5 min or < 10%)
  const warningLevel =
    totalSeconds > 0 && timeLeft <= Math.min(300, totalSeconds * 0.1)
      ? 'critical'
      : totalSeconds > 0 && timeLeft <= totalSeconds * 0.25
      ? 'warning'
      : 'normal';

  return {
    timeLeft,
    isExpired,
    formattedTime: formatTime(timeLeft),
    warningLevel,
  };
}
