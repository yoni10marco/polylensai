"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const data = [
    { time: '09:00', price: 45.2 },
    { time: '10:00', price: 46.1 },
    { time: '11:00', price: 44.8 },
    { time: '12:00', price: 47.5 },
    { time: '13:00', price: 48.2 },
    { time: '14:00', price: 49.9 },
    { time: '15:00', price: 49.1 },
    { time: '16:00', price: 51.3 },
    { time: '17:00', price: 52.8 },
    { time: '18:00', price: 51.9 },
    { time: '19:00', price: 53.4 },
    { time: '20:00', price: 55.0 },
];

export default function PriceChart() {
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
