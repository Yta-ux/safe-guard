import { useTheme } from '@/providers/theme-provider';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import { SECTOR_CHART_COLOR, SECTOR_CHART_COLOR_DARK } from '@/lib/constants';
import type { SectorDistribution } from '@/@types/dashboard.types';

interface BarChartProps {
  data: SectorDistribution[];
}

export function BarChart({ data }: BarChartProps) {
  const { isDark } = useTheme();
  const barColor = isDark ? SECTOR_CHART_COLOR_DARK : SECTOR_CHART_COLOR;
  const gridColor = isDark ? '#3f3f46' : '#e7e3dc';
  const textColor = isDark ? '#a1a1aa' : '#57534e';

  return (
    <div className="w-full h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={data}
          margin={{ top: 25, right: 15, left: -15, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={gridColor}
            vertical={false}
          />
          <XAxis
            dataKey="sector"
            tick={{ fill: textColor, fontFamily: 'Manrope', fontSize: 13, fontWeight: 600 }}
            tickLine={false}
            axisLine={{ stroke: gridColor }}
            dy={5}
          />
          <YAxis
            tick={{ fill: textColor, fontFamily: 'Manrope', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ fill: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)' }}
            contentStyle={{
              backgroundColor: isDark ? '#27272a' : '#ffffff',
              border: `1px solid ${isDark ? '#3f3f46' : '#d6d3d1'}`,
              borderRadius: '8px',
              color: isDark ? '#f4f4f5' : '#1c1917',
              fontFamily: 'Manrope',
              fontSize: '13px',
              padding: '8px 12px',
              boxShadow: isDark ? '0 10px 15px -3px rgba(0, 0, 0, 0.5)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            formatter={(value) => [`${value} incidentes`, '']}
          />
          <Bar
            dataKey="count"
            fill={barColor}
            radius={[6, 6, 0, 0]}
            maxBarSize={48}
          >
            <LabelList
              dataKey="count"
              position="top"
              style={{
                fill: barColor,
                fontFamily: 'Manrope',
                fontSize: '13px',
                fontWeight: 700,
              }}
              offset={8}
            />
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
