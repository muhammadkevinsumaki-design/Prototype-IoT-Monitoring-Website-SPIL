import { Package, PackageOpen } from 'lucide-react';

interface ContainerCounterProps {
  emptyCount: number;
  loadedCount: number;
}

export function ContainerCounter({ emptyCount, loadedCount }: ContainerCounterProps) {
  const total = emptyCount + loadedCount;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Jumlah Angkatan Container</h3>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <PackageOpen className="text-blue-600" size={20} />
            <span className="text-sm font-medium text-blue-900">Empty</span>
          </div>
          <p className="text-3xl font-bold text-blue-900">{emptyCount}</p>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package className="text-purple-600" size={20} />
            <span className="text-sm font-medium text-purple-900">Muatan</span>
          </div>
          <p className="text-3xl font-bold text-purple-900">{loadedCount}</p>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Total Angkatan</span>
          <span className="text-xl font-bold text-gray-900">{total}</span>
        </div>
      </div>
    </div>
  );
}
