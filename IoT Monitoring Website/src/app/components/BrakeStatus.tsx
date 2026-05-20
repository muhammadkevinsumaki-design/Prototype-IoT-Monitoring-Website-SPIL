import { Power } from 'lucide-react';

interface BrakeStatusProps {
  isActive: boolean;
}

export function BrakeStatus({ isActive }: BrakeStatusProps) {
  return (
    <div className={`border rounded-lg p-6 transition-all ${isActive ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-300'}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-700">Unloading Brake</h3>
        <Power className={isActive ? 'text-green-600' : 'text-gray-400'} size={24} />
      </div>
      <div className="flex items-center gap-3">
        <div className={`w-4 h-4 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
        <span className={`text-lg font-semibold ${isActive ? 'text-green-900' : 'text-gray-600'}`}>
          {isActive ? 'ON' : 'OFF'}
        </span>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        {isActive ? 'Brake aktif - siap operasi' : 'Brake nonaktif'}
      </p>
    </div>
  );
}
