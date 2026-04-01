"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import type { VisualizationSpec } from "@/lib/types";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#6366f1",
];

export function ChartDisplay({ spec }: { spec: VisualizationSpec }) {
  if (spec.type === "table") {
    return <DataTable spec={spec} />;
  }

  return (
    <div className="my-4 rounded-lg border border-gray-200 bg-white p-4" style={{ minWidth: 400 }}>
      <h3 className="mb-3 text-sm font-semibold text-gray-700">
        {spec.title}
      </h3>
      <div style={{ width: "100%", height: 350 }}>
        {spec.type === "bar" && <BarChartView spec={spec} />}
        {spec.type === "pie" && <PieChartView spec={spec} />}
        {spec.type === "line" && <LineChartView spec={spec} />}
      </div>
    </div>
  );
}

function BarChartView({ spec }: { spec: VisualizationSpec }) {
  const yKeys = spec.yKeys || (spec.yKey ? [spec.yKey] : []);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={spec.data} margin={{ top: 5, right: 20, bottom: 60, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey={spec.xKey}
          tick={{ fontSize: 12 }}
          angle={-35}
          textAnchor="end"
          height={80}
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        {yKeys.length > 1 && <Legend />}
        {yKeys.map((key, i) => (
          <Bar
            key={key}
            dataKey={key}
            fill={COLORS[i % COLORS.length]}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

function PieChartView({ spec }: { spec: VisualizationSpec }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={spec.data}
          dataKey={spec.valueKey || "value"}
          nameKey={spec.nameKey || "name"}
          cx="50%"
          cy="50%"
          outerRadius={120}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label={(props: any) =>
            `${props.name ?? ""}: ${(((props.percent as number) ?? 0) * 100).toFixed(1)}%`
          }
          labelLine
        >
          {spec.data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

function LineChartView({ spec }: { spec: VisualizationSpec }) {
  const yKeys = spec.yKeys || (spec.yKey ? [spec.yKey] : []);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={spec.data} margin={{ top: 5, right: 20, bottom: 60, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey={spec.xKey}
          tick={{ fontSize: 12 }}
          angle={-35}
          textAnchor="end"
          height={80}
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        {yKeys.length > 1 && <Legend />}
        {yKeys.map((key, i) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

function DataTable({ spec }: { spec: VisualizationSpec }) {
  const columns = spec.columns || (spec.data[0] ? Object.keys(spec.data[0]) : []);

  return (
    <div className="my-4 rounded-lg border border-gray-200 bg-white overflow-hidden">
      <h3 className="px-4 py-3 text-sm font-semibold text-gray-700 border-b border-gray-200">
        {spec.title}
      </h3>
      <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-2 text-left font-medium text-gray-600 border-b border-gray-200"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {spec.data.map((row, i) => (
              <tr
                key={i}
                className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
              >
                {columns.map((col) => (
                  <td
                    key={col}
                    className="px-4 py-2 text-gray-700 border-b border-gray-100 max-w-xs truncate"
                    title={String(row[col] ?? "")}
                  >
                    {String(row[col] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
