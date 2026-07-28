import { useTheme } from '@/providers/theme-provider';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  CATEGORY_CHART_COLORS,
  CATEGORY_CHART_COLORS_DARK,
} from '@/lib/constants';
import type { CategoryDistribution } from '@/@types/dashboard.types';

interface DonutChartProps {
  data: CategoryDistribution[];
  total: number;
}

export function DonutChart({ data, total }: DonutChartProps) {
  const { isDark } = useTheme();
  const colorMap = isDark ? CATEGORY_CHART_COLORS_DARK : CATEGORY_CHART_COLORS;

  return (
    <div className="flex flex-col items-center w-full">
      {/* Donut Pie Container with Perfectly Aligned Overlay */}
      <div className="w-full h-[220px] relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="category"
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={95}
              paddingAngle={3}
              strokeWidth={0}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.category}
                  fill={colorMap[entry.category] ?? '#887368'}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#2c2a28' : '#ffffff',
                border: `1px solid ${isDark ? '#554339' : '#dbc1b5'}`,
                borderRadius: '8px',
                color: isDark ? '#e7e1de' : '#1d1b19',
                fontFamily: 'Manrope',
                fontSize: '13px',
                padding: '8px 12px',
              }}
              formatter={(value) => [`${value} relatos`, '']}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Geometrically Centered Total Label (Exact 50% X / 50% Y) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-extrabold text-on-surface leading-none tracking-tight">
            {total.toLocaleString('pt-BR')}
          </span>
          <span className="text-[11px] uppercase tracking-widest text-on-surface-variant font-semibold mt-1">
            Total
          </span>
        </div>
      </div>

      {/* Clean Detailed Legend List */}
      <div className="w-full mt-4 flex flex-col gap-2.5 pt-4 border-t border-outline-variant/40">
        {data.map((item) => (
          <div key={item.category} className="flex items-center justify-between px-1 text-label-sm">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: colorMap[item.category] ?? '#887368' }}
              />
              <span className="text-on-surface-variant font-medium">
                {item.category} ({item.percentage}%)
              </span>
            </div>
            <span
              className="font-bold"
              style={{ color: colorMap[item.category] ?? '#887368' }}
            >
              {item.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
