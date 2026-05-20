import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PressureData {
  time: string;
  engineOil: number;
  transmissionOil: number;
}

interface PressureChartProps {
  data: PressureData[];
}

export function PressureChart({ data }: PressureChartProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Grafik Pressure</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="time" stroke="#6b7280" style={{ fontSize: '12px' }} />
          <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} label={{ value: 'Bar', angle: -90, position: 'insideLeft' }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
            labelStyle={{ color: '#374151', fontWeight: 'bold' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Area type="monotone" dataKey="engineOil" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} name="Oli Mesin" />
          <Area type="monotone" dataKey="transmissionOil" stroke="#ec4899" fill="#ec4899" fillOpacity={0.6} name="Oli Transmisi" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
