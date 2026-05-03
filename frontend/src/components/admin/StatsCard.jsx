export default function StatsCard({ label, value, icon: Icon, color = 'blue', subtext }) {
  const iconColors = {
    blue:    'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    purple:  'bg-purple-50 text-purple-600 border-purple-100',
    amber:   'bg-amber-50 text-amber-600 border-amber-100',
    red:     'bg-red-50 text-red-600 border-red-100',
  };

  return (
    <div
      className="bg-white border border-gray-200 p-5 flex items-start gap-4 shadow-card"
      style={{ borderRadius: '4px' }}
    >
      <div
        className={`w-10 h-10 flex items-center justify-center border ${iconColors[color]}`}
        style={{ borderRadius: '3px' }}
      >
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs text-gray-400 mb-0.5 font-medium">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
        {subtext && <p className="text-xs text-gray-400 mt-0.5">{subtext}</p>}
      </div>
    </div>
  );
}
