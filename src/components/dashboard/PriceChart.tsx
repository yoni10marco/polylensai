"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface ChartPoint {
    time: string;
    price: number;
}

export default function PriceChart({ data }: { data: ChartPoint[] }) {
    if (!data || data.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div className="text-muted flex flex-col items-center gap-3">
                    <p>No price history available.</p>
                </div>
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#00e5ff" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2b2f3a" vertical={false} />
                <XAxis
                    dataKey="time"
                    stroke="#9ca3af"
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                />
                <YAxis
                    stroke="#9ca3af"
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    domain={['auto', 'auto']}
                    tickFormatter={(value) => `${value}¢`}
                    dx={-10}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#1a1d24',
                        border: '1px solid #2b2f3a',
                        borderRadius: '8px',
                        color: '#fff'
                    }}
                    itemStyle={{ color: '#00e5ff', fontWeight: 'bold' }}
                    labelStyle={{ color: '#9ca3af', marginBottom: '4px' }}
                    formatter={(value: number) => [`${value}¢`, 'Probability/Price']}
                />
                <Area
                    type="monotone"
                    dataKey="price"
                    stroke="#00e5ff"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorPrice)"
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
