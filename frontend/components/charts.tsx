"use client";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { Analytics } from "@/types";
import { label } from "@/lib/api";
const colors = [
  "#c5f467",
  "#38bdf8",
  "#22c55e",
  "#f59e0b",
  "#f87171",
  "#a78bfa",
  "#64748b",
];
export function TrendChart({ data }: { data: Analytics["trends"] }) {
  return (
    <div
      className="trend-chart"
      role="img"
      aria-label={`${data.reduce((n, d) => n + d.count, 0)} applications in the selected period`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 15, right: 12, left: -22, bottom: 0 }}
        >
          <defs>
            <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c5f467" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#c5f467" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="#343e30"
            vertical={false}
            strokeDasharray="3 6"
          />
          <XAxis
            dataKey="date"
            tickFormatter={(v) =>
              new Date(`${v}T12:00:00`).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            }
            axisLine={false}
            tickLine={false}
            minTickGap={40}
            tick={{ fill: "#b9c3b3", fontSize: 12 }}
            dy={9}
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#b9c3b3", fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              background: "#1d231c",
              border: "1px solid #46573b",
              borderRadius: 10,
              color: "#f8fafc",
            }}
            labelFormatter={(v) => String(v)}
          />
          <Area
            type="monotone"
            dataKey="count"
            name="Applications"
            stroke="#c5f467"
            strokeWidth={2.5}
            fill="url(#trend-fill)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
export function Funnel({ data }: { data: Analytics["funnel"] }) {
  const max = data[0]?.count || 1;
  return (
    <div className="funnel">
      {data.map((d, i) => (
        <div className="funnel-row" key={d.stage}>
          <div>
            <span>{d.stage}</span>
            <strong>
              {d.count}
              <small>{Math.round((d.count / max) * 100)}%</small>
            </strong>
          </div>
          <div className="bar-track">
            <div
              style={{
                width: `${(d.count / max) * 100}%`,
                background: ["#c5f467", "#9bcd50", "#76a73c", "#547e2d"][i],
              }}
            />
          </div>
        </div>
      ))}
      <p className="chart-note">Milestones reached across your job search</p>
    </div>
  );
}
export function StatusChart({ data }: { data: Analytics["statuses"] }) {
  const total = data.reduce((n, d) => n + d.count, 0);
  return (
    <div className="status-chart">
      <div className="donut">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={
                data.length ? data : [{ status: "No applications", count: 1 }]
              }
              dataKey="count"
              nameKey="status"
              innerRadius={58}
              outerRadius={75}
              stroke="none"
              paddingAngle={3}
              isAnimationActive={false}
            >
              {(data.length ? data : [{}]).map((_, i) => (
                <Cell
                  key={i}
                  fill={data.length ? colors[i % colors.length] : "#263244"}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "#1d231c",
                border: "1px solid #46573b",
                color: "#f8fafc",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="donut-center">
          <strong>{total}</strong>
          <small>applications</small>
        </div>
      </div>
      <div className="chart-legend">
        {data.map((d, i) => (
          <div key={d.status}>
            <span style={{ background: colors[i % colors.length] }} />
            <span>{label(d.status)}</span>
            <strong>{d.count}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
