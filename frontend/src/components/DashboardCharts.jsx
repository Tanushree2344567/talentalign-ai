import React, { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line, CartesianGrid,
} from "recharts";
import "./DashboardCharts.css";

// ── Colours ───────────────────────────────────────────────────────────────────
const BLUE   = "#4f8cff";
const GREEN  = "#22c55e";
const AMBER  = "#f59e0b";
const RED    = "#ef4444";
const PURPLE = "#a855f7";
const TEAL   = "#14b8a6";

const PIE_COLORS = [GREEN, AMBER, RED, PURPLE, TEAL, BLUE];

// ── Custom tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      {label && <p className="chart-tooltip-label">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: <strong>{typeof p.value === "number" && p.value <= 1 ? `${Math.round(p.value * 100)}%` : p.value}</strong>
        </p>
      ))}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const DashboardCharts = ({ projects }) => {

  // 1. Candidates per project (bar chart)
  const candidatesPerProject = useMemo(() =>
    projects
      .filter(p => (p.candidate_count || 0) > 0)
      .map(p => ({
        name: p.title.length > 18 ? p.title.slice(0, 18) + "…" : p.title,
        candidates: p.candidate_count || 0,
      }))
      .slice(0, 8),
    [projects]
  );

  // 2. Projects created over time (line chart)
  const projectsOverTime = useMemo(() => {
    const monthly = {};
    projects.forEach(p => {
      const date = new Date(p.created_at);
      const key = date.toLocaleString("default", { month: "short", year: "2-digit" });
      monthly[key] = (monthly[key] || 0) + 1;
    });
    return Object.entries(monthly).map(([month, count]) => ({ month, count }));
  }, [projects]);

  // 3. Total stats
  const totalCandidates = projects.reduce((s, p) => s + (p.candidate_count || 0), 0);
  const avgCandidates   = projects.length ? Math.round(totalCandidates / projects.length) : 0;

  // 4. Pie — project size distribution
  const sizeDistribution = useMemo(() => {
    const small  = projects.filter(p => (p.candidate_count||0) <= 5).length;
    const medium = projects.filter(p => (p.candidate_count||0) > 5  && (p.candidate_count||0) <= 15).length;
    const large  = projects.filter(p => (p.candidate_count||0) > 15).length;
    return [
      { name: "Small (≤5)",   value: small  },
      { name: "Medium (6-15)", value: medium },
      { name: "Large (>15)",  value: large  },
    ].filter(d => d.value > 0);
  }, [projects]);

  if (projects.length === 0) return null;

  return (
    <div className="charts-section">
      <div className="charts-section-title">
        <h2>📊 Analytics Overview</h2>
        <span className="charts-subtitle">Insights from your projects</span>
      </div>

      {/* ── Top stats strip ── */}
      <div className="analytics-strip">
        <div className="analytics-stat">
          <span className="analytics-stat-number">{projects.length}</span>
          <span className="analytics-stat-label">Total Projects</span>
        </div>
        <div className="analytics-divider"/>
        <div className="analytics-stat">
          <span className="analytics-stat-number">{totalCandidates}</span>
          <span className="analytics-stat-label">Candidates Screened</span>
        </div>
        <div className="analytics-divider"/>
        <div className="analytics-stat">
          <span className="analytics-stat-number">{avgCandidates}</span>
          <span className="analytics-stat-label">Avg per Project</span>
        </div>
        <div className="analytics-divider"/>
        <div className="analytics-stat">
          <span className="analytics-stat-number" style={{color: GREEN}}>AI</span>
          <span className="analytics-stat-label">GPT-4o Powered</span>
        </div>
      </div>

      {/* ── Charts grid ── */}
      <div className="charts-grid">

        {/* Bar chart — candidates per project */}
        {candidatesPerProject.length > 0 && (
          <div className="chart-card chart-card--wide">
            <div className="chart-card-header">
              <h3>Candidates per Project</h3>
              <span className="chart-badge">{candidatesPerProject.length} projects</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={candidatesPerProject} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)"/>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false}/>
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="candidates" fill={BLUE} radius={[6,6,0,0]} name="Candidates"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Pie chart — project size distribution */}
        {sizeDistribution.length > 0 && (
          <div className="chart-card">
            <div className="chart-card-header">
              <h3>Project Size Distribution</h3>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={sizeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {sizeDistribution.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Line chart — projects created over time */}
        {projectsOverTime.length > 1 && (
          <div className="chart-card chart-card--wide">
            <div className="chart-card-header">
              <h3>Projects Created Over Time</h3>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={projectsOverTime} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)"/>
                <XAxis dataKey="month" tick={{ fontSize: 11 }}/>
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false}/>
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={PURPLE}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: PURPLE }}
                  name="Projects"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Summary card */}
        <div className="chart-card chart-card--summary">
          <h3>Quick Summary</h3>
          <ul className="summary-list">
            <li>
              <span className="summary-dot" style={{background: BLUE}}/>
              <span>Most active project has <strong>{Math.max(...projects.map(p=>p.candidate_count||0))} candidates</strong></span>
            </li>
            <li>
              <span className="summary-dot" style={{background: GREEN}}/>
              <span><strong>{projects.length} job opening{projects.length!==1?"s":""}</strong> created so far</span>
            </li>
            <li>
              <span className="summary-dot" style={{background: AMBER}}/>
              <span><strong>{totalCandidates} resumes</strong> screened by AI in total</span>
            </li>
            <li>
              <span className="summary-dot" style={{background: PURPLE}}/>
              <span>Average <strong>{avgCandidates} candidates</strong> per project</span>
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
};

export default DashboardCharts;
