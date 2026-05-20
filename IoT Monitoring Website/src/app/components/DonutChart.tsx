interface DonutChartProps {
  data: {
    label: string;
    value: number;
    color: string;
  }[];
}

export function DonutChart({ data }: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = -90;

  const slices = data.map((item) => {
    const percentage = (item.value / total) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;

    currentAngle = endAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = 50 + 40 * Math.cos(startRad);
    const y1 = 50 + 40 * Math.sin(startRad);
    const x2 = 50 + 40 * Math.cos(endRad);
    const y2 = 50 + 40 * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;

    return {
      ...item,
      percentage,
      path: `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`,
    };
  });

  return (
    <div className="relative">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {slices.map((slice, index) => (
          <path
            key={index}
            d={slice.path}
            fill={slice.color}
            className="transition-opacity hover:opacity-80"
          />
        ))}
        <circle cx="50" cy="50" r="25" fill="#1f2937" />
        <text
          x="50"
          y="48"
          textAnchor="middle"
          className="text-xl font-bold"
          fill="white"
        >
          {total}
        </text>
        <text
          x="50"
          y="58"
          textAnchor="middle"
          className="text-xs"
          fill="#9ca3af"
        >
          Issues
        </text>
      </svg>
    </div>
  );
}
