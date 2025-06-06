
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { AnalysisItem, BloomLevel, ChartDataPoint } from '../types';
import { BLOOM_LEVELS_LIST, BLOOM_LEVEL_COLORS } from '../constants';

interface BloomChartProps {
  items: AnalysisItem[];
  title?: string;
}

const BloomChart: React.FC<BloomChartProps> = ({ items, title }) => {
  const processChartData = (): ChartDataPoint[] => {
    const counts: Record<BloomLevel, number> = BLOOM_LEVELS_LIST.reduce((acc, level) => {
      acc[level] = 0;
      return acc;
    }, {} as Record<BloomLevel, number>);

    items.forEach(item => {
      if (counts[item.bloom_level] !== undefined) {
        counts[item.bloom_level]++;
      }
    });

    const totalItems = items.length;
    if (totalItems === 0) return [];

    return BLOOM_LEVELS_LIST.map(level => ({
      name: level,
      value: counts[level],
      percentage: parseFloat(((counts[level] / totalItems) * 100).toFixed(1)),
    }));
  };

  const chartData = processChartData();

  if (items.length === 0) {
    return <p className="text-center text-slate-500 py-4">No hay datos para mostrar en el gráfico.</p>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      {title && <h3 className="text-xl font-semibold mb-4 text-slate-700">{title}</h3>}
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 70 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="name" 
            angle={-45} 
            textAnchor="end" 
            height={80} 
            interval={0}
            tick={{ fontSize: 12, fill: '#475569' }} 
          />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#475569' }}/>
          <Tooltip
            cursor={{ fill: 'rgba(200,200,200,0.2)' }}
            contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}
            formatter={(value: number, name: string, props) => {
                 if (props.payload && typeof props.payload.percentage === 'number') {
                    return [`${value} (${props.payload.percentage}%)`, "Cantidad"];
                 }
                 return [value, "Cantidad"];
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="value" name="Número de Ítems" unit="">
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={BLOOM_LEVEL_COLORS[entry.name]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BloomChart;
