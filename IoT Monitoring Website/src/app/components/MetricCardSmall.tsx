import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardSmallProps {
  value: number;
  color: string;
  trend: 'up' | 'down';
  sparklineData: number[];
}

export function MetricCardSmall({ value, color, trend, sparklineData }: MetricCardSmallProps) {
  const colorClasses = {
    blue: 'border-blue-500 text-blue-500',
    green: 'border-green-500 text-green-500',
    purple: 'border-purple-500 text-purple-500',
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-12 h-12 rounded-full border-4 ${colorClasses[color as keyof typeof colorClasses]} flex items-center justify-center bg-gray-900`}>
          {trend === 'up' ? (
            <TrendingUp size={20} />
          ) : (
            <TrendingDown size={20} />
          )}
        </div>
        <div className="flex-1 h-8 ml-3">
          <svg width="100%" height="32" className="opacity-60">
            <polyline
              fill="none"
              stroke={color === 'blue' ? '#3b82f6' : color === 'green' ? '#10b981' : '#a855f7'}
              strokeWidth="2"
              points={sparklineData.map((val, idx) =>
                `${(idx / (sparklineData.length - 1)) * 100},${32 - (val / Math.max(...sparklineData)) * 28}`
              ).join(' ')}
            />
          </svg>
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
