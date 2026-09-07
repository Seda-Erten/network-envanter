"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#64748b'];
const STATUS_COLORS = { 'aktif': '#10b981', 'pasif': '#64748b', 'arizali': '#ef4444' };

export default function DashboardCharts({ devices }) {
  const typeCount = devices.reduce((acc, dev) => {
    acc[dev.type] = (acc[dev.type] || 0) + 1;
    return acc;
  }, {});
  
  const typeData = Object.keys(typeCount).map(key => ({
    name: key.toUpperCase(),
    value: typeCount[key]
  }));

  if (devices.length === 0) return null;

  return (
    <div style={{ display: 'flex', gap: '20px', marginBottom: '40px', flexWrap: 'wrap' }}>
      

      <div className="panel" style={{ flex: '1 1 300px', padding: '20px' }}>
        <h3 style={{ marginTop: 0, marginBottom: 20, color: 'var(--text)', fontSize: 16 }}>Cihaz Dağılımı (Grafik)</h3>
        <div style={{ height: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={typeData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}
              >
                {typeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, color: '#f8fafc' }}
                itemStyle={{ color: '#e2e8f0' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="panel" style={{ flex: '2 1 400px', padding: '20px', overflowX: 'auto' }}>
        <h3 style={{ marginTop: 0, marginBottom: 20, color: 'var(--text)', fontSize: 16 }}>Envanter İstatistikleri (Tablo)</h3>
        <table className="netbox-table" style={{marginTop: 0}}>
          <thead>
            <tr>
              <th>Cihaz Tipi</th>
              <th>Toplam Sayı</th>
              <th style={{textAlign: 'right'}}>Oran (%)</th>
            </tr>
          </thead>
          <tbody>
            {typeData.sort((a, b) => b.value - a.value).map((item, idx) => (
              <tr key={idx}>
                <td className="font-semibold" style={{display: 'flex', alignItems: 'center', gap: 10}}>
                  <div style={{width: 12, height: 12, borderRadius: '50%', background: COLORS[idx % COLORS.length]}}></div>
                  {item.name}
                </td>
                <td>{item.value} adet</td>
                <td style={{textAlign: 'right'}} className="text-cyan">{((item.value / devices.length) * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{background: 'var(--panel-raised)', borderTop: '2px solid var(--border)'}}>
              <td className="font-semibold">GENEL TOPLAM</td>
              <td className="font-semibold">{devices.length} adet</td>
              <td style={{textAlign: 'right'}} className="font-semibold text-cyan">100%</td>
            </tr>
          </tfoot>
        </table>
      </div>

    </div>
  );
}
