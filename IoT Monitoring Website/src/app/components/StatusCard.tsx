import { LucideIcon } from 'lucide-react';

interface StatusCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  status?: 'normal' | 'warning' | 'critical';
  subtitle?: string;
}

export function StatusCard({ title, value, unit, icon: Icon, status = 'normal', subtitle }: StatusCardProps) {
  const statusColors = {
    normal: 'bg-white border-gray-200',
    warning: 'bg-yellow-50 border-yellow-300',
    critical: 'bg-red-50 border-red-300'
  };

  const textColors = {
    normal: 'text-gray-900',
    warning: 'text-yellow-900',
    critical: 'text-red-900'
  };

  const iconColors = {
    normal: 'text-blue-600',
    warning: 'text-yellow-600',
    critical: 'text-red-600'
  };

  return (
    <div className={`${statusColors[status]} border rounded-lg p-4 transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <Icon className={iconColors[status]} size={20} />
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-bold ${textColors[status]}`}>{value}</span>
        {unit && <span className="text-sm text-gray-500">{unit}</span>}
      </div>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}
