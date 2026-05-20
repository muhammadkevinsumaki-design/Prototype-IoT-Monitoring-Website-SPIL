import { useState, useEffect, useRef } from 'react';
import { BarChartHorizontal } from './components/BarChartHorizontal';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import {
  Calendar,
  Thermometer,
  Gauge,
  Battery,
  Clock,
  Navigation,
  AlertTriangle,
  CheckCircle,
  Package,
  PackageOpen,
  Activity,
  Wifi
} from 'lucide-react';

// Generate sparkline data
function generateSparkline() {
  return Array.from({ length: 10 }, () => Math.random() * 100);
}

const MAX_HISTORY_POINTS = 20;

function createEmptyHistoricalData() {
  return Array.from({ length: MAX_HISTORY_POINTS }, () => ({
    time: '',
    tempC: null,
    tTransC: null,
    engineOilPressure: null,
    transmissionOilPressure: null,
  }));
}

function padHistoricalData(data) {
  if (data.length >= MAX_HISTORY_POINTS) {
    return data.slice(-MAX_HISTORY_POINTS);
  }

  const emptyPoints = Array.from({ length: MAX_HISTORY_POINTS - data.length }, () => ({
    time: '',
    tempC: null,
    tTransC: null,
    engineOilPressure: null,
    transmissionOilPressure: null,
  }));

  return [...emptyPoints, ...data];
}

function createHistoricalPoint(row) {
  return {
    time: row.Timestamp ? row.Timestamp.slice(11, 16) : '',
    tempC: parseNumber(row.Temp_C),
    tTransC: parseNumber(row.TTrans_C),
    engineOilPressure: parseNumber(row.Poli_bar),
    transmissionOilPressure: parseNumber(row.PTrans_bar),
  };
}

function appendHistoricalPoint(prev, point) {
  return [...prev.slice(1), point];
}

const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1Mp8GrsijPcYzYjob_qEbnv9Nh7sn8nIgAfvoUAUnw7w/gviz/tq?tqx=out:csv&gid=1416788819';

function parseNumber(value) {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return 0;
  const normalized = value.trim();

  if (normalized === '') {
    return 0;
  }

  // Handle both comma and dot decimal formats.
  if (normalized.includes(',') && normalized.includes('.')) {
    // Assume format like 1.234,56
    return Number(normalized.replace(/\./g, '').replace(',', '.')) || 0;
  }

  if (normalized.includes(',')) {
    return Number(normalized.replace(',', '.')) || 0;
  }

  return Number(normalized) || 0;
}

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}

// The gviz CSV endpoint returns empty header names for trailing columns.
// Map them to known names by index so row.Online etc. are available.
const UNNAMED_COLUMN_MAP = { 18: 'Online', 19: 'IP', 20: 'RSSI' };

function parseCsv(csv) {
  const rows = csv
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);

  const headers = parseCsvLine(rows[0]).map((header, index) => {
    const name = header.trim();
    if (name === '' && UNNAMED_COLUMN_MAP[index]) {
      return UNNAMED_COLUMN_MAP[index];
    }
    return name;
  });
  return rows.slice(1).map(line => {
    const values = parseCsvLine(line);
    return headers.reduce((acc, header, index) => {
      if (header) {
        acc[header] = values[index] ?? '';
      }
      return acc;
    }, {});
  });
}

function getWarningsForData(data) {
  const warnings = [];
  if (data.tempC > 95) {
    warnings.push({ type: 'critical', message: 'Temperature sensor terlalu tinggi!' });
  }
  if (data.engineOilPressure < 2.5) {
    warnings.push({ type: 'critical', message: 'Pressure oli mesin terlalu rendah!' });
  }
  if (data.batteryVoltage < 12.5) {
    warnings.push({ type: 'warning', message: 'Tegangan aki rendah' });
  }
  if (data.rpm > 2500) {
    warnings.push({ type: 'warning', message: 'RPM tinggi' });
  }
  if (data.alarmTemp === 1) {
    warnings.push({ type: 'critical', message: 'Alarm suhu aktif' });
  }
  if (data.alarmPoli === 1) {
    warnings.push({ type: 'critical', message: 'Alarm pressure aktif' });
  }
  if (data.alarmVbat === 1) {
    warnings.push({ type: 'warning', message: 'Alarm tegangan aki aktif' });
  }
  return warnings;
}

function formatWarningTimestamp(date) {
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function combineWarnings(warnings) {
  const uniqueMessages = Array.from(new Set(warnings.map(w => w.message)));
  const type = warnings.some(w => w.type === 'critical') ? 'critical' : 'warning';
  return {
    type,
    message: uniqueMessages.join(' | '),
  };
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function createWarningHistoryWorkbook(entries) {
  const header = `<?xml version="1.0"?>\n<?mso-application progid="Excel.Sheet"?>\n<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n<Worksheet ss:Name="Warning History">\n<Table>`;
  const rows = [
    `<Row><Cell><Data ss:Type="String">Timestamp</Data></Cell><Cell><Data ss:Type="String">Tipe</Data></Cell><Cell><Data ss:Type="String">Pesan</Data></Cell></Row>`,
    ...entries.map(entry => `\n<Row>\n<Cell><Data ss:Type="String">${escapeXml(entry.timestamp)}</Data></Cell>\n<Cell><Data ss:Type="String">${escapeXml(entry.type)}</Data></Cell>\n<Cell><Data ss:Type="String">${escapeXml(entry.message)}</Data></Cell>\n</Row>`),
  ];
  const footer = `</Table>\n</Worksheet>\n</Workbook>`;
  return `${header}\n${rows.join('\n')}\n${footer}`;
}

export default function App() {
  const [brakeActive, setBrakeActive] = useState(true);
  const [historicalData, setHistoricalData] = useState(createEmptyHistoricalData());
  const [warningHistory, setWarningHistory] = useState([]);
  const [dailyTarget, setDailyTarget] = useState(60);
  const latestTimestampRef = useRef('');
  const latestWarningKeyRef = useRef('');
  const hasMountedRef = useRef(false);
  const lastDataChangeTimeRef = useRef(Date.now());

  // Real-time sensor data
  const [sensorData, setSensorData] = useState({
    tempC: 88,
    tTransC: 85,
    engineOilPressure: 3.8,
    transmissionOilPressure: 3.2,
    batteryVoltage: 13.8,
    hourMeter: 4235.5,
    rpm: 1850,
    km: 12458,
    emptyContainers: 45,
    loadedContainers: 38,
    speedKmh: 0,
    dplus: 0,
    uptime: 0,
    alarmTemp: 0,
    alarmPoli: 0,
    alarmVbat: 0,
    online: 1,
  });

  const today = new Date();
  const dateString = today.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const warnings = getWarningsForData(sensorData);
  const isConnected = sensorData.online === 1;

  // Daily activity - jumlah angkatan container per hari
  const dailyActivity = [
    { day: 'Sen', value: 42, maxValue: dailyTarget },
    { day: 'Sel', value: 38, maxValue: dailyTarget },
    { day: 'Rab', value: 45, maxValue: dailyTarget },
    { day: 'Kam', value: 40, maxValue: dailyTarget },
    { day: 'Jum', value: 52, maxValue: dailyTarget },
    { day: 'Sab', value: 35, maxValue: dailyTarget },
    { day: 'Min', value: 28, maxValue: dailyTarget },
  ];

  useEffect(() => {
    const parseLiveData = row => ({
      tempC: parseNumber(row.Temp_C),
      tTransC: parseNumber(row.TTrans_C),
      engineOilPressure: parseNumber(row.Poli_bar),
      transmissionOilPressure: parseNumber(row.PTrans_bar),
      batteryVoltage: parseNumber(row.Vbat_V),
      hourMeter: parseNumber(row.HourMeter),
      rpm: parseNumber(row.RPM),
      km: parseNumber(row.Odo_km),
      emptyContainers: parseNumber(row.Cnt_Empty),
      loadedContainers: parseNumber(row.Cnt_Loaded),
      speedKmh: parseNumber(row.Speed_kmh),
      dplus: parseNumber(row.Dplus),
      uptime: parseNumber(row.Uptime_s),
      alarmTemp: parseNumber(row.Alarm_Temp),
      alarmPoli: parseNumber(row.Alarm_Poli),
      alarmVbat: parseNumber(row.Alarm_Vbat),
      online: parseNumber(row.Online),
      brakeActive: parseNumber(row.Brake) === 1,
    });

    const loadLiveData = async () => {
      try {
        const response = await fetch(SHEET_CSV_URL);
        if (!response.ok) {
          return;
        }

        const csv = await response.text();
        const rows = parseCsv(csv);
        if (rows.length === 0) {
          return;
        }

        const orderedRows = rows
          .filter(row => row.Timestamp)
          .sort((a, b) => new Date(a.Timestamp).getTime() - new Date(b.Timestamp).getTime());

        const latestRow = orderedRows[orderedRows.length - 1];
        const latestPoint = createHistoricalPoint(latestRow);

        // Find the latest row with a non-empty HourMeter to avoid showing 0 due to temporary blank rows,
        // while still respecting explicit resets to '0' or '0.0' sent by the ESP.
        const latestHourMeterRow = [...orderedRows].reverse().find(row => {
          if (row.HourMeter === undefined || row.HourMeter === null) return false;
          return String(row.HourMeter).trim() !== '';
        });
        const finalHourMeter = latestHourMeterRow ? parseNumber(latestHourMeterRow.HourMeter) : 0;

        // Find the latest row with a non-empty Odo_km
        const latestOdoRow = [...orderedRows].reverse().find(row => {
          if (row.Odo_km === undefined || row.Odo_km === null) return false;
          return String(row.Odo_km).trim() !== '';
        });
        const finalOdo = latestOdoRow ? parseNumber(latestOdoRow.Odo_km) : 0;

        // Check if there is a new timestamp update
        const isNewTimestamp = latestRow.Timestamp !== latestTimestampRef.current;
        if (isNewTimestamp) {
          lastDataChangeTimeRef.current = Date.now();
        }

        // Calculate staleness:
        // 1. By comparing sheet time with local system time (with 60s tolerance to accommodate minor clock drift/timezone issues)
        // 2. By tracking elapsed time since we last saw a new timestamp (with 15s tolerance)
        const sheetTime = new Date(latestRow.Timestamp.replace(' ', 'T')).getTime();
        const timeDiffFromNow = (Date.now() - sheetTime) / 1000;
        const timeSinceLastNewData = (Date.now() - lastDataChangeTimeRef.current) / 1000;

        const isStale = isNaN(sheetTime) ? false : (timeDiffFromNow > 60 || timeSinceLastNewData > 15);

        setSensorData(prev => {
          const parsed = parseLiveData(latestRow);
          const hasHourMeter = latestHourMeterRow !== undefined;
          const hasOdo = latestOdoRow !== undefined;
          
          return {
            ...prev,
            ...parsed,
            hourMeter: hasHourMeter ? finalHourMeter : prev.hourMeter,
            km: hasOdo ? finalOdo : prev.km,
            online: isStale ? 0 : 1, // Override online state based on staleness detection
          };
        });

        setBrakeActive(parseNumber(latestRow.Brake) === 1);

        setHistoricalData(prev => {
          if (latestRow.Timestamp === latestTimestampRef.current) {
            const updated = [...prev];
            updated[MAX_HISTORY_POINTS - 1] = latestPoint;
            return updated;
          }

          latestTimestampRef.current = latestRow.Timestamp;
          return appendHistoricalPoint(prev, latestPoint);
        });
      } catch (error) {
        console.error('Failed to load LiveData sheet:', error);
      }
    };

    loadLiveData();
    const interval = setInterval(loadLiveData, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    const currentWarnings = getWarningsForData(sensorData);
    if (currentWarnings.length === 0) {
      latestWarningKeyRef.current = '';
      return;
    }

    const warningKey = currentWarnings
      .map(w => w.message)
      .sort()
      .join('|');

    if (warningKey === latestWarningKeyRef.current) {
      return;
    }

    latestWarningKeyRef.current = warningKey;
    const { type, message } = combineWarnings(currentWarnings);
    const timestamp = formatWarningTimestamp(new Date());
    const entry = { timestamp, type, message };

    setWarningHistory(prev => [...prev, entry].slice(-20));
  }, [sensorData]);

  const downloadWarningHistory = () => {
    const workbook = createWarningHistoryWorkbook(warningHistory);
    const blob = new Blob([workbook], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'warning-history.xls';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const clearWarningHistory = () => setWarningHistory([]);

  const totalContainers = sensorData.emptyContainers + sensorData.loadedContainers;
  const actualHistoricalPoints = historicalData.filter(point => point.tempC != null || point.engineOilPressure != null).length;
  const showSinglePointDot = actualHistoricalPoints <= 1;

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-[1920px] mx-auto">
        {/* Header */}
        <div className="bg-gray-900 border-b border-gray-700 px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Dashboard Reachstacker IoT</h1>
              <p className="text-sm text-gray-400 mt-1">Monitoring kondisi alat berat secara real-time</p>
            </div>
            <button className="bg-white text-gray-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors flex items-center gap-2">
              <Calendar size={16} />
              {dateString}
            </button>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="p-8 space-y-6">
          {/* Warning Banner */}
          {!isConnected ? (
            <div className="bg-red-900/30 border border-red-500 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-red-500" size={24} />
                <div>
                  <h3 className="text-red-400 font-semibold mb-1">Koneksi Terputus</h3>
                  <p className="text-sm text-red-300">Perangkat tidak terhubung, silakan periksa koneksi ESP32.</p>
                </div>
              </div>
            </div>
          ) : warnings.length > 0 ? (
            <div className="bg-red-900/30 border border-red-500 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-red-500" size={24} />
                <div className="flex-1">
                  <h3 className="text-red-400 font-semibold mb-1">Peringatan Sistem</h3>
                  <div className="space-y-1">
                    {warnings.map((w, idx) => (
                      <p key={idx} className="text-sm text-red-300">
                        • {w.message}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-green-900/30 border border-green-500 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-500" size={24} />
                <div>
                  <h3 className="text-green-400 font-semibold">Sistem Normal</h3>
                  <p className="text-sm text-green-300">Semua parameter dalam kondisi baik</p>
                </div>
              </div>
            </div>
          )}

          {/* Brake & Connection Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-gray-400 text-sm mb-4">Unloading Brake Status</h3>
              <div className="flex items-center gap-4">
                <div className={`w-4 h-4 rounded-full ${brakeActive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
                <div>
                  <p className="text-2xl font-bold text-white">{brakeActive ? 'ON' : 'OFF'}</p>
                  <p className="text-sm text-gray-300">{brakeActive ? 'Brake aktif - siap operasi' : 'Brake nonaktif'}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-gray-400 text-sm mb-4">Koneksi Alat</h3>
              <div className="flex items-center gap-4">
                <Wifi className={sensorData.online === 1 ? 'text-green-500' : 'text-red-500'} size={20} />
                <div>
                  <p className="text-2xl font-bold text-white">{sensorData.online === 1 ? 'Terhubung' : 'Terputus'}</p>
                  <p className="text-sm text-gray-300">
                    {sensorData.online === 1 ? 'Perangkat terhubung' : 'Perangkat offline'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Hour Meter */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-5">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-gray-400 text-sm">Hour Meter</h3>
                <Clock className="text-blue-500" size={20} />
              </div>
              <p className="text-3xl font-bold text-white">{sensorData.hourMeter.toFixed(1)}</p>
              <p className="text-xs text-gray-500 mt-1">Jam operasi</p>
            </div>

            {/* RPM */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-5">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-gray-400 text-sm">RPM</h3>
                <Activity className="text-purple-500" size={20} />
              </div>
              <p className="text-3xl font-bold text-white">{Math.round(sensorData.rpm)}</p>
              <p className="text-xs text-gray-500 mt-1">Normal: 1500-2500</p>
            </div>

            {/* Battery Voltage */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-5">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-gray-400 text-sm">Tegangan Aki</h3>
                <Battery className="text-green-500" size={20} />
              </div>
              <p className="text-3xl font-bold text-white">{sensorData.batteryVoltage.toFixed(1)}V</p>
              <p className="text-xs text-gray-500 mt-1">Normal: &gt;12.5V</p>
            </div>

            {/* Kilometer */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-5">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-gray-400 text-sm">Kilometer</h3>
                <Navigation className="text-yellow-500" size={20} />
              </div>
              <p className="text-3xl font-bold text-white">{sensorData.km.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Total jarak</p>
            </div>
          </div>

          {/* Container Counter */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="text-gray-400 text-sm mb-4">Jumlah Angkatan Container</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <PackageOpen className="text-blue-400 mx-auto mb-2" size={24} />
                <p className="text-2xl font-bold text-white">{sensorData.emptyContainers}</p>
                <p className="text-xs text-gray-400">Empty</p>
              </div>
              <div className="text-center">
                <Package className="text-purple-400 mx-auto mb-2" size={24} />
                <p className="text-2xl font-bold text-white">{sensorData.loadedContainers}</p>
                <p className="text-xs text-gray-400">Muatan</p>
              </div>
              <div className="text-center bg-gray-700 rounded-lg flex flex-col justify-center">
                <p className="text-2xl font-bold text-white">{totalContainers}</p>
                <p className="text-xs text-gray-400">Total</p>
              </div>
            </div>
          </div>

          {/* LiveData Monitoring */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="text-white text-lg font-semibold mb-4">LiveData Monitoring</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-700 rounded-lg p-4 text-left">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Temp C</span>
                  <Thermometer className="text-red-400" size={18} />
                </div>
                <p className="text-3xl font-bold text-white">{sensorData.tempC.toFixed(1)}°C</p>
                <p className="text-xs text-gray-500 mt-1">Sensor suhu utama</p>
              </div>
              <div className="bg-gray-700 rounded-lg p-4 text-left">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Transmission Temp</span>
                  <Thermometer className="text-blue-400" size={18} />
                </div>
                <p className="text-3xl font-bold text-white">{sensorData.tTransC.toFixed(1)}°C</p>
                <p className="text-xs text-gray-500 mt-1">Suhu oli transmisi</p>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Speed</span>
                  <Navigation className="text-yellow-400" size={18} />
                </div>
                <p className="text-3xl font-bold text-white">{sensorData.speedKmh.toFixed(1)} km/h</p>
                <p className="text-xs text-gray-500 mt-1">Kecepatan</p>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">D+</span>
                  <Gauge className="text-purple-400" size={18} />
                </div>
                <p className="text-3xl font-bold text-white">{sensorData.dplus}</p>
                <p className="text-xs text-gray-500 mt-1">Sinyal D+</p>
              </div>
            </div>

            {/* Temperature Chart */}
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={historicalData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9ca3af" style={{ fontSize: '12px' }} interval="preserveStartEnd" />
                <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} domain={["auto", "auto"]} label={{ value: '°C', angle: -90, position: 'insideLeft', fill: '#9ca3af' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#f3f4f6' }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }}
                  iconType="line"
                />
                <Line type="monotone" dataKey="tempC" stroke="#ef4444" name="Temp C" strokeWidth={3} dot={showSinglePointDot} isAnimationActive={false} />
                <Line type="monotone" dataKey="tTransC" stroke="#3b82f6" name="Transmission Temp" strokeWidth={3} dot={showSinglePointDot} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 text-xs text-gray-400">
              <div className="bg-gray-700 rounded-lg p-3 text-left">
                <p className="font-semibold text-white">Uptime</p>
                <p>{sensorData.uptime} s</p>
              </div>
              <div className="bg-gray-700 rounded-lg p-3 text-left">
                <p className="font-semibold text-white">Alarm Suhu</p>
                <p>{sensorData.alarmTemp === 1 ? 'Aktif' : 'Normal'}</p>
              </div>
              <div className="bg-gray-700 rounded-lg p-3 text-left">
                <p className="font-semibold text-white">Alarm Pressure</p>
                <p>{sensorData.alarmPoli === 1 ? 'Aktif' : 'Normal'}</p>
              </div>
              <div className="bg-gray-700 rounded-lg p-3 text-left">
                <p className="font-semibold text-white">Alarm Vbat</p>
                <p>{sensorData.alarmVbat === 1 ? 'Aktif' : 'Normal'}</p>
              </div>
            </div>
          </div>

          {/* Pressure Monitoring */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="text-white text-lg font-semibold mb-4">Pressure Monitoring</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Pressure Oli Mesin</span>
                  <Gauge className="text-purple-400" size={18} />
                </div>
                <p className="text-3xl font-bold text-white">{sensorData.engineOilPressure.toFixed(1)} Bar</p>
                <p className="text-xs text-gray-500 mt-1">Normal: 3.0-4.5 Bar</p>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Pressure Oli Transmisi</span>
                  <Gauge className="text-pink-400" size={18} />
                </div>
                <p className="text-3xl font-bold text-white">{sensorData.transmissionOilPressure.toFixed(1)} Bar</p>
                <p className="text-xs text-gray-500 mt-1">Normal: 2.5-4.0 Bar</p>
              </div>
            </div>

            {/* Pressure Chart */}
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={historicalData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9ca3af" style={{ fontSize: '12px' }} interval="preserveStartEnd" />
                <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} domain={["auto", "auto"]} label={{ value: 'Bar', angle: -90, position: 'insideLeft', fill: '#9ca3af' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#f3f4f6' }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }}
                  iconType="rect"
                />
                <Area type="monotone" dataKey="engineOilPressure" stroke="#a855f7" fill="#a855f7" fillOpacity={0.4} name="Oli Mesin" strokeWidth={2} dot={showSinglePointDot} isAnimationActive={false} />
                <Area type="monotone" dataKey="transmissionOilPressure" stroke="#ec4899" fill="#ec4899" fillOpacity={0.4} name="Oli Transmisi" strokeWidth={2} dot={showSinglePointDot} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Activity & Recent Operations */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <h3 className="text-white text-lg font-semibold">Jumlah Angkatan Container (7 Hari Terakhir)</h3>
                <p className="text-xs text-gray-400 mt-1">Total angkatan container per hari (target: {dailyTarget}/hari)</p>
              </div>
              
              {/* Sleek Target Settings Widget */}
              <div className="flex items-center gap-2.5 bg-gray-900/60 border border-gray-700 px-3.5 py-1.5 rounded-xl w-fit shrink-0 shadow-inner">
                <span className="text-xs font-semibold text-gray-400">Atur Target:</span>
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => setDailyTarget(prev => Math.max(5, prev - 5))}
                    className="w-7 h-7 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg hover:text-white transition-all text-xs font-black cursor-pointer shadow-sm select-none"
                    type="button"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={dailyTarget}
                    onChange={(e) => setDailyTarget(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-12 bg-transparent text-center text-xs font-extrabold text-white focus:outline-none border-b border-transparent focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button 
                    onClick={() => setDailyTarget(prev => Math.min(300, prev + 5))}
                    className="w-7 h-7 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg hover:text-white transition-all text-xs font-black cursor-pointer shadow-sm select-none"
                    type="button"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
            <BarChartHorizontal data={dailyActivity} />
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <div>
                <h3 className="text-white text-lg font-semibold">Riwayat Peringatan</h3>
                <p className="text-xs text-gray-400">Peringatan tersimpan berdasarkan waktu dan penyebab.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={downloadWarningHistory}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-2 rounded-lg transition-colors"
                  type="button"
                >
                  Download Excel
                </button>
                <button
                  onClick={clearWarningHistory}
                  className="bg-red-600 hover:bg-red-500 text-white text-xs px-3 py-2 rounded-lg transition-colors"
                  type="button"
                >
                  Hapus Riwayat
                </button>
              </div>
            </div>
            {warningHistory.length === 0 ? (
              <p className="text-sm text-gray-400">Belum ada peringatan.</p>
            ) : (
              <div className="space-y-3 max-h-[320px] overflow-y-auto">
                {warningHistory.map((entry, index) => (
                  <div key={`${entry.timestamp}-${index}`} className="bg-gray-900 border border-gray-700 rounded-lg p-3">
                    <p className="text-xs text-gray-500">{entry.timestamp}</p>
                    <p className="text-sm text-red-300">
                      {entry.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}