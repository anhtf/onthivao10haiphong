import { clsx } from 'clsx';
import { Clock, AlertTriangle } from 'lucide-react';
import useTimer from '../../hooks/useTimer';

export default function Timer({ totalSeconds, onExpire }) {
  const { formattedTime, warningLevel } = useTimer(totalSeconds, onExpire);

  const styles = {
    normal:   'bg-white border-gray-300 text-gray-800',
    warning:  'bg-amber-50 border-amber-400 text-amber-800',
    critical: 'bg-red-50 border-red-500 text-red-700 animate-pulse',
  };

  return (
    <div
      className={clsx(
        'flex items-center gap-2 px-3 py-1.5 border font-mono font-semibold text-sm transition-all duration-500',
        styles[warningLevel]
      )}
      style={{ borderRadius: '3px' }}
    >
      {warningLevel === 'critical'
        ? <AlertTriangle size={15} />
        : <Clock size={15} className={warningLevel === 'warning' ? 'text-amber-500' : 'text-gray-400'} />
      }
      {formattedTime}
    </div>
  );
}
