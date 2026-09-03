"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TimeSeriesPoint, DistributionPoint } from "@/types";
import { formatCompactNumber } from "@/utils/format";

export const CHART_PALETTE = ["#C65D3B", "#1F4D3A", "#C9A24B", "#2F6FB0", "#2E7D52", "#D98A29"];

const axisProps = {
  stroke: "#B8AC9C",
  fontSize: 12,
  tickLine: false,
  axisLine: false,
} as const;

const gridProps = { stroke: "#E7DFD2", strokeDasharray: "3 3", vertical: false } as const;

function TooltipBox({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  formatter?: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 shadow-md">
      {label && <p className="mb-1 text-xs font-semibold text-foreground">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-xs text-foreground-soft">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="capitalize">{p.name}:</span>
          <span className="font-medium text-foreground">
            {formatter ? formatter(p.value) : formatCompactNumber(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------- Area / Line ----------
export function RevenueAreaChart({
  data,
  dataKey = "value",
  color = CHART_PALETTE[0],
  formatter,
  height = 260,
}: {
  data: TimeSeriesPoint[];
  dataKey?: string;
  color?: string;
  formatter?: (v: number) => string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis {...axisProps} tickFormatter={(v) => formatCompactNumber(Number(v))} width={54} />
        <Tooltip content={<TooltipBox formatter={formatter} />} />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2.5}
          fill={`url(#grad-${dataKey})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function MultiLineChart({
  data,
  series,
  height = 260,
}: {
  data: TimeSeriesPoint[];
  series: { key: string; color: string }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis {...axisProps} tickFormatter={(v) => formatCompactNumber(Number(v))} width={44} />
        <Tooltip content={<TooltipBox />} />
        {series.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            stroke={s.color}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

// ---------- Bar ----------
export function GroupedBarChart({
  data,
  series,
  height = 260,
}: {
  data: TimeSeriesPoint[];
  series: { key: string; color: string }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis {...axisProps} tickFormatter={(v) => formatCompactNumber(Number(v))} width={44} />
        <Tooltip content={<TooltipBox />} cursor={{ fill: "rgba(198,93,59,0.05)" }} />
        {series.map((s) => (
          <Bar key={s.key} dataKey={s.key} fill={s.color} radius={[4, 4, 0, 0]} maxBarSize={28} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function HorizontalBarChart({
  data,
  formatter,
  height = 260,
}: {
  data: DistributionPoint[];
  formatter?: (v: number) => string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
        <CartesianGrid stroke="#E7DFD2" strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" {...axisProps} tickFormatter={(v) => formatCompactNumber(Number(v))} />
        <YAxis type="category" dataKey="label" {...axisProps} width={130} />
        <Tooltip content={<TooltipBox formatter={formatter} />} cursor={{ fill: "rgba(198,93,59,0.05)" }} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.color ?? CHART_PALETTE[i % CHART_PALETTE.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ---------- Donut ----------
export function DonutChart({
  data,
  height = 260,
  formatter,
}: {
  data: DistributionPoint[];
  height?: number;
  formatter?: (v: number) => string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <ResponsiveContainer width="100%" height={height} className="max-w-[240px]">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius={62}
            outerRadius={92}
            paddingAngle={2}
            stroke="none"
          >
            {data.map((d, i) => (
              <Cell key={i} fill={d.color ?? CHART_PALETTE[i % CHART_PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip content={<TooltipBox formatter={formatter} />} />
        </PieChart>
      </ResponsiveContainer>
      <ul className="w-full space-y-2">
        {data.map((d, i) => (
          <li key={i} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-foreground-soft">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: d.color ?? CHART_PALETTE[i % CHART_PALETTE.length] }}
              />
              {d.label}
            </span>
            <span className="font-medium text-foreground">
              {total ? Math.round((d.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
