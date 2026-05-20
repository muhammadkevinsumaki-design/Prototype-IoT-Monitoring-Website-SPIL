import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface Warning {
  id: string;
  type: 'critical' | 'warning' | 'normal';
  message: string;
  timestamp: Date;
}

interface NotificationBarProps {
  warnings: Warning[];
}

export function NotificationBar({ warnings }: NotificationBarProps) {
  const criticalWarnings = warnings.filter(w => w.type === 'critical');
  const normalWarnings = warnings.filter(w => w.type === 'warning');

  if (warnings.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <CheckCircle className="text-green-600" size={24} />
          <div>
            <h3 className="font-semibold text-green-900">Sistem Normal</h3>
            <p className="text-sm text-green-700">Semua parameter dalam kondisi baik</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 mb-6">
      {criticalWarnings.length > 0 && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-4 animate-pulse">
          <div className="flex items-start gap-3">
            <XCircle className="text-red-600 flex-shrink-0 mt-0.5" size={24} />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-2">Peringatan Kritis!</h3>
              <ul className="space-y-1">
                {criticalWarnings.map(warning => (
                  <li key={warning.id} className="text-sm text-red-800">
                    • {warning.message} <span className="text-xs text-red-600">({warning.timestamp.toLocaleTimeString('id-ID')})</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {normalWarnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={24} />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900 mb-2">Peringatan</h3>
              <ul className="space-y-1">
                {normalWarnings.map(warning => (
                  <li key={warning.id} className="text-sm text-yellow-800">
                    • {warning.message} <span className="text-xs text-yellow-600">({warning.timestamp.toLocaleTimeString('id-ID')})</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
