import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TemperatureData {
  time: string;
  engineOil: number;
  water: number;
  transmissionOil: number;
}

interface TemperatureChartProps {
  data: TemperatureData[];
}

export function TemperatureChart({ data }: TemperatureChartProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Grafik Temperature</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="time" stroke="#6b7280" style={{ fontSize: '12px' }} />
          <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} label={{ value: '°C', angle: -90, position: 'insideLeft' }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
            labelStyle={{ color: '#374151', fontWeight: 'bold' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Line type="monotone" dataKey="engineOil" stroke="#ef4444" name="Oli Mesin" strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="water" stroke="#3b82f6" name="Air" strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="transmissionOil" stroke="#f59e0b" name="Oli Transmisi" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
