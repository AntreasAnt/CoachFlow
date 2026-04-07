import React, { useEffect, useMemo, useState } from 'react';
import AdminDashboardLayout from '../../../components/AdminDashboardLayout';
import APIClient from '../../../utils/APIClient';
import { BACKEND_ROUTES_API } from '../../../config/config';

const cardBaseStyle = {
  borderRadius: '12px',
  backgroundColor: '#2d2d2d',
  border: '1px solid rgba(255, 255, 255, 0.07)',
};

const labelStyle = { color: '#9ca3af' };
const valueStyle = { color: '#fff', fontWeight: 800 };

const formatMaybeNumber = (value) => {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number') return value.toLocaleString();
  return String(value);
};

const formatCurrencyBreakdown = (items) => {
  if (!Array.isArray(items) || items.length === 0) return '—';
  return items
    .map((row) => `${row.currency} ${Number(row.revenue || 0).toLocaleString()}`)
    .join(' • ');
};

const normalizeSeries = (rawRows, startDate, endDate, valueKey = 'count') => {
  const result = [];
  const valueByDate = new Map();

  if (Array.isArray(rawRows)) {
    rawRows.forEach((row) => {
      if (!row?.date) return;
      valueByDate.set(row.date, Number(row[valueKey] ?? 0));
    });
  }

  if (!startDate || !endDate) {
    return Array.isArray(rawRows)
      ? rawRows.map((row) => ({ date: row.date, value: Number(row[valueKey] ?? 0) }))
      : [];
  }

  const cursor = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(cursor.getTime()) || Number.isNaN(end.getTime())) {
    return Array.isArray(rawRows)
      ? rawRows.map((row) => ({ date: row.date, value: Number(row[valueKey] ?? 0) }))
      : [];
  }

  while (cursor.getTime() <= end.getTime()) {
    const iso = cursor.toISOString().slice(0, 10);
    result.push({ date: iso, value: valueByDate.get(iso) ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  return result;
};

const sumSeries = (series) => (Array.isArray(series) ? series.reduce((sum, p) => sum + Number(p?.value ?? 0), 0) : 0);

const toISODate = (d) => {
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const addDays = (isoDate, days) => {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return toISODate(d);
};

const presetRange = (days) => {
  const end = toISODate(new Date());
  const start = addDays(end, -(Math.max(1, Number(days)) - 1));
  return { start, end };
};

const Sparkline = ({ title, series }) => {
  const width = 520;
  const height = 90;
  const padding = 8;

  const values = Array.isArray(series) ? series.map((p) => Number(p.value ?? 0)) : [];
  const maxValue = values.length > 0 ? Math.max(...values, 0) : 0;
  const minValue = values.length > 0 ? Math.min(...values, 0) : 0;
  const span = maxValue - minValue || 1;

  const points = (Array.isArray(series) ? series : []).map((p, idx) => {
    const x = padding + (idx * (width - padding * 2)) / Math.max(1, series.length - 1);
    const y = height - padding - ((Number(p.value ?? 0) - minValue) * (height - padding * 2)) / span;
    return { x, y };
  });

  const path = points.length > 0
    ? points
        .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`)
        .join(' ')
    : '';

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      role="img"
      aria-label={title}
      style={{ display: 'block' }}
    >
      <rect x="0" y="0" width={width} height={height} fill="rgba(0,0,0,0)" />
      <path
        d={path}
        fill="none"
        stroke="rgba(16, 185, 129, 0.95)"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {points.length > 0 ? (
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r="3.5"
          fill="#10b981"
        />
      ) : null}
    </svg>
  );
};

const LineChart = ({ title, seriesList }) => {
  const width = 640;
  const height = 160;
  const pad = 14;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;

  const allValues = (Array.isArray(seriesList) ? seriesList : [])
    .flatMap((s) => (Array.isArray(s?.series) ? s.series : []))
    .map((p) => Number(p?.value ?? 0));

  const maxValue = allValues.length ? Math.max(...allValues, 0) : 0;
  const minValue = allValues.length ? Math.min(...allValues, 0) : 0;
  const span = maxValue - minValue || 1;

  const makePath = (series) => {
    const points = (Array.isArray(series) ? series : []).map((p, idx) => {
      const x = pad + (idx * innerW) / Math.max(1, series.length - 1);
      const y = pad + (1 - (Number(p?.value ?? 0) - minValue) / span) * innerH;
      return { x, y };
    });

    if (!points.length) return '';
    return points
      .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`)
      .join(' ');
  };

  const gridLines = 3;
  const grid = Array.from({ length: gridLines + 1 }).map((_, i) => {
    const y = pad + (i * innerH) / gridLines;
    return <line key={i} x1={pad} x2={width - pad} y1={y} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />;
  });

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      role="img"
      aria-label={title}
      style={{ display: 'block' }}
    >
      <rect x="0" y="0" width={width} height={height} fill="rgba(0,0,0,0)" />
      {grid}
      {(Array.isArray(seriesList) ? seriesList : []).map((s) => (
        <path
          key={s.key}
          d={makePath(s.series)}
          fill="none"
          stroke={s.color}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
};

const SectionHeader = ({ title, subtitle }) => (
  <div className="d-flex align-items-end justify-content-between gap-3" style={{ marginTop: '1.25rem', marginBottom: '0.75rem' }}>
    <div>
      <div style={{ color: '#fff', fontWeight: 900, letterSpacing: '-0.02em' }}>{title}</div>
      {subtitle ? <div className="small" style={{ color: '#9ca3af' }}>{subtitle}</div> : null}
    </div>
  </div>
);

const MetricStrip = ({ title, subtitle, items }) => (
  <div className="card border-0" style={cardBaseStyle}>
    <div className="card-body p-3">
      <div className="d-flex justify-content-between align-items-start gap-3 mb-2">
        <div>
          <div style={{ color: '#fff', fontWeight: 900 }}>{title}</div>
          {subtitle ? <div className="small" style={{ color: '#9ca3af' }}>{subtitle}</div> : null}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: 10,
        }}
      >
        {(Array.isArray(items) ? items : []).map((it) => (
          <div
            key={it.key}
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid rgba(255, 255, 255, 0.06)',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              minHeight: 54,
            }}
          >
            <div className="small" style={{ color: '#9ca3af', fontWeight: 700 }}>{it.label}</div>
            <div style={{ color: '#fff', fontWeight: 900, lineHeight: 1.1 }}>{formatMaybeNumber(it.value)}</div>
            {it.hint ? <div className="small" style={{ color: '#10b981', fontWeight: 700 }}>{it.hint}</div> : null}
          </div>
        ))}
      </div>
    </div>
  </div>
);

const TrendCard = ({ title, subtitle, series, totalValue }) => (
  <div className="card border-0 h-100" style={cardBaseStyle}>
    <div className="card-body p-4">
      <div className="d-flex justify-content-between align-items-start gap-3 mb-2">
        <div>
          <div style={{ color: '#fff', fontWeight: 900 }}>{title}</div>
          {subtitle ? <div className="small" style={{ color: '#9ca3af' }}>{subtitle}</div> : null}
        </div>
        <div style={{ color: '#fff', fontWeight: 900 }}>{formatMaybeNumber(totalValue)}</div>
      </div>
      <Sparkline title={title} series={series} />
    </div>
  </div>
);

const GraphCard = ({ title, subtitle, seriesList, legend }) => (
  <div className="card border-0 h-100" style={cardBaseStyle}>
    <div className="card-body p-3">
      <div className="d-flex justify-content-between align-items-start gap-3 mb-2">
        <div>
          <div style={{ color: '#fff', fontWeight: 900 }}>{title}</div>
          {subtitle ? <div className="small" style={{ color: '#9ca3af' }}>{subtitle}</div> : null}
        </div>
        {legend ? (
          <div className="d-flex flex-wrap justify-content-end gap-2">
            {legend.map((it) => (
              <div key={it.label} className="small" style={{ color: '#9ca3af', fontWeight: 700 }}>
                <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 99, backgroundColor: it.color, marginRight: 6 }} />
                {it.label}
              </div>
            ))}
          </div>
        ) : null}
      </div>
      <LineChart title={title} seriesList={seriesList} />
    </div>
  </div>
);

const MiniTable = ({ title, rows, columns }) => (
  <div className="card border-0" style={{ ...cardBaseStyle }}>
    <div className="card-body p-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0" style={{ color: '#fff', fontWeight: 800 }}>{title}</h5>
      </div>
      <div className="table-responsive">
        <table
          className="table table-sm table-borderless align-middle mb-0"
          style={{
            backgroundColor: 'transparent',
            '--bs-table-bg': 'transparent',
            '--bs-table-striped-bg': 'transparent',
            '--bs-table-active-bg': 'transparent',
            '--bs-table-hover-bg': 'transparent',
            '--bs-table-color': '#ffffff',
          }}
        >
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="small"
                  style={{
                    color: '#9ca3af',
                    fontWeight: 800,
                    backgroundColor: 'transparent',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.isArray(rows) && rows.length > 0 ? (
              rows.map((row, idx) => (
                <tr key={idx}>
                  {columns.map((col) => (
                    <td key={col.key} style={{ color: '#fff' }}>{col.format ? col.format(row[col.key], row) : formatMaybeNumber(row[col.key])}</td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} style={{ color: '#9ca3af' }}>No data</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [periodDays, setPeriodDays] = useState(14);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const buildQuery = ({ start, end, days }) => {
    const params = new URLSearchParams();
    if (start && end) {
      params.set('start', start);
      params.set('end', end);
      return params.toString();
    }
    params.set('days', String(days ?? 14));
    return params.toString();
  };

  const fetchAnalytics = async ({ start, end, days } = {}) => {
    setLoading(true);
    setError('');

    try {
      const qs = buildQuery({
        start: start ?? startDate,
        end: end ?? endDate,
        days: days ?? periodDays,
      });
      const response = await APIClient.get(`${BACKEND_ROUTES_API}GetAdminAnalytics.php?${qs}`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to load analytics');
      }
      setAnalytics(response.analytics);

      const p = response.analytics?.period;
      if (p?.start && p?.end) {
        setStartDate(p.start);
        setEndDate(p.end);
      }
      if (typeof p?.days === 'number' && [7, 14, 30, 90].includes(p.days)) {
        setPeriodDays(p.days);
      }
    } catch (e) {
      console.error('Admin analytics error:', e);
      setError(e.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const { start, end } = presetRange(periodDays);
    setStartDate(start);
    setEndDate(end);
    fetchAnalytics({ start, end, days: periodDays });
  }, []);

  const overview = analytics?.overview || {};
  const users = analytics?.users || {};
  const workouts = analytics?.usage?.workouts || {};
  const nutrition = analytics?.usage?.nutrition || {};
  const messages = analytics?.messages || {};
  const commerce = analytics?.commerce || {};
  const period = analytics?.period || {};
  const signupsSeries = normalizeSeries(users.signups_timeseries, period.start, period.end);
  const loginsSeries = normalizeSeries(users.logins_timeseries, period.start, period.end);
  const workoutsSeries = normalizeSeries(workouts.sessions_timeseries, period.start, period.end);
  const nutritionSeries = normalizeSeries(nutrition.logs_timeseries, period.start, period.end);
  const purchasesSeries = normalizeSeries(commerce.purchases_timeseries, period.start, period.end);
  const revenueSeries = normalizeSeries(commerce.purchases_timeseries, period.start, period.end, 'revenue');
  const messagesSeries = normalizeSeries(messages.sent_timeseries, period.start, period.end);
  const coachingRequestsSeries = normalizeSeries(analytics?.coaching?.requests?.requests_timeseries, period.start, period.end);
  const purchasesPeriodCount = useMemo(() => sumSeries(purchasesSeries), [purchasesSeries]);
  const topPrograms = (analytics?.content?.programs?.top_programs || []).slice(0, 8);

  const userRolesRows = useMemo(() => users.by_role || [], [users.by_role]);
  const activeByRolePeriodRows = useMemo(() => users.active_by_role_period || [], [users.active_by_role_period]);
  const newByRolePeriodRows = useMemo(() => users.new_by_role_period || [], [users.new_by_role_period]);
  const programsByStatusRows = useMemo(() => analytics?.content?.programs?.by_status || [], [analytics?.content?.programs?.by_status]);
  const coachingRequestsByStatusRows = useMemo(() => analytics?.coaching?.requests?.by_status || [], [analytics?.coaching?.requests?.by_status]);

  const revenuePeriodSummary = useMemo(
    () => formatCurrencyBreakdown(commerce.revenue_period_by_currency || commerce.revenue_30d_by_currency || overview.gmv_30d_by_currency),
    [commerce.revenue_period_by_currency, commerce.revenue_30d_by_currency, overview.gmv_30d_by_currency]
  );

  const keyMetricsItems = useMemo(() => {
    const items = [
      { key: 'total_users', label: 'Total users', value: overview.total_users, hint: 'All time' },
      { key: 'active_users', label: 'Active users', value: overview.active_users_period ?? overview.active_users_7d, hint: 'Range (logins)' },
      { key: 'new_users', label: 'New users', value: overview.new_users_period ?? overview.new_users_7d, hint: 'Range' },
      { key: 'revenue', label: 'Revenue', value: revenuePeriodSummary, hint: 'Completed (range)' },
    ];

    if (users?.verified !== null && users?.verified !== undefined) {
      items.push({ key: 'verified', label: 'Verified', value: users.verified });
    }
    if (users?.disabled !== null && users?.disabled !== undefined) {
      items.push({ key: 'disabled', label: 'Disabled', value: users.disabled });
    }
    return items;
  }, [overview.total_users, overview.active_users_period, overview.active_users_7d, overview.new_users_period, overview.new_users_7d, revenuePeriodSummary, users?.verified, users?.disabled]);

  const activityItems = useMemo(() => {
    return [
      { key: 'workouts_sessions', label: 'Workouts', value: workouts.sessions_period ?? workouts.sessions_7d, hint: 'Sessions (range)' },
      { key: 'workouts_users', label: 'Workout users', value: workouts.active_users_period ?? workouts.active_users_7d, hint: 'Unique (range)' },
      { key: 'food_logs', label: 'Food logs', value: nutrition.logs_period ?? nutrition.logs_7d, hint: 'Logs (range)' },
      { key: 'nutrition_users', label: 'Nutrition users', value: nutrition.active_users_period ?? nutrition.active_users_7d, hint: 'Unique (range)' },
      { key: 'messages_sent', label: 'Messages', value: messages.sent_period ?? messages.sent_7d, hint: 'Sent (range)' },
      { key: 'messages_senders', label: 'Senders', value: messages.active_senders_period ?? messages.active_senders_7d, hint: 'Unique (range)' },
      { key: 'purchases', label: 'Purchases', value: purchasesPeriodCount, hint: 'Completed (range)' },
    ];
  }, [workouts.sessions_period, workouts.sessions_7d, workouts.active_users_period, workouts.active_users_7d, nutrition.logs_period, nutrition.logs_7d, nutrition.active_users_period, nutrition.active_users_7d, messages.sent_period, messages.sent_7d, messages.active_senders_period, messages.active_senders_7d, purchasesPeriodCount]);

  return (
    <AdminDashboardLayout>
      <div className="admin-page">
        <div className="admin-page-header">
          <div>
            <h2 className="admin-page-title">Analytics</h2>
            <p className="admin-page-subtitle">
              Platform usage, growth, and revenue metrics{period?.start && period?.end ? ` • ${period.start} → ${period.end}` : ''}
            </p>
          </div>
          <div className="admin-page-header-actions">
            <select
              className="form-select form-select-sm"
              value={periodDays}
              onChange={(e) => {
                const next = Number(e.target.value);
                setPeriodDays(next);
                const { start, end } = presetRange(next);
                setStartDate(start);
                setEndDate(end);
                fetchAnalytics({ start, end, days: next });
              }}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#fff',
                minWidth: 160,
                fontWeight: 700,
              }}
              aria-label="Quick range presets"
              title="Quick range presets"
            >
              <option value={7}>Last 7d</option>
              <option value={14}>Last 14d</option>
              <option value={30}>Last 30d</option>
              <option value={90}>Last 90d</option>
            </select>

            <input
              type="date"
              className="form-control form-control-sm"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#fff',
                minWidth: 150,
                fontWeight: 700,
              }}
              aria-label="Start date"
              title="Start date"
            />

            <input
              type="date"
              className="form-control form-control-sm"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#fff',
                minWidth: 150,
                fontWeight: 700,
              }}
              aria-label="End date"
              title="End date"
            />

            <button
              type="button"
              className="btn btn-sm"
              style={{
                color: '#0f172a',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                backgroundColor: 'rgba(16, 185, 129, 0.95)',
                fontWeight: 800,
              }}
              onClick={() => fetchAnalytics({ start: startDate, end: endDate })}
              disabled={!startDate || !endDate}
            >
              Apply
            </button>
            <button
              type="button"
              className="btn btn-sm"
              style={{
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                backgroundColor: 'transparent',
                fontWeight: 700,
              }}
              onClick={() => fetchAnalytics({ start: startDate, end: endDate, days: periodDays })}
            >
              <i className="bi bi-arrow-clockwise me-2"></i>
              Refresh
            </button>
          </div>
        </div>

        {/* Tabs (match Trainer-style UI) */}
        <style>
          {`
            .analytics-tab {
              transition: all 0.3s ease;
              padding: 10px 14px;
              margin-right: 4px;
              border-radius: 8px 8px 0 0;
            }
            .analytics-tab:hover {
              background-color: rgba(16, 185, 129, 0.10) !important;
              color: #10b981 !important;
            }
          `}
        </style>
        <ul className="nav nav-tabs mb-3" style={{ borderBottom: '2px solid rgba(255, 255, 255, 0.08)' }}>
          <li className="nav-item">
            <button
              className="analytics-tab"
              onClick={() => setActiveTab('overview')}
              style={{
                color: activeTab === 'overview' ? '#fff' : '#9ca3af',
                backgroundColor: activeTab === 'overview' ? 'rgba(16, 185, 129, 0.16)' : 'transparent',
                border: 'none',
                borderBottom: activeTab === 'overview' ? '3px solid #10b981' : 'none',
                fontWeight: activeTab === 'overview' ? '700' : '600',
              }}
            >
              <i className="bi bi-speedometer2 me-2"></i>
              Overview
            </button>
          </li>

          <li className="nav-item">
            <button
              className="analytics-tab"
              onClick={() => setActiveTab('sales')}
              style={{
                color: activeTab === 'sales' ? '#fff' : '#9ca3af',
                backgroundColor: activeTab === 'sales' ? 'rgba(16, 185, 129, 0.16)' : 'transparent',
                border: 'none',
                borderBottom: activeTab === 'sales' ? '3px solid #10b981' : 'none',
                fontWeight: activeTab === 'sales' ? '700' : '600',
              }}
            >
              <i className="bi bi-currency-exchange me-2"></i>
              Sales
            </button>
          </li>

          <li className="nav-item">
            <button
              className="analytics-tab"
              onClick={() => setActiveTab('coaches')}
              style={{
                color: activeTab === 'coaches' ? '#fff' : '#9ca3af',
                backgroundColor: activeTab === 'coaches' ? 'rgba(16, 185, 129, 0.16)' : 'transparent',
                border: 'none',
                borderBottom: activeTab === 'coaches' ? '3px solid #10b981' : 'none',
                fontWeight: activeTab === 'coaches' ? '700' : '600',
              }}
            >
              <i className="bi bi-people me-2"></i>
              Coaches
            </button>
          </li>

          <li className="nav-item">
            <button
              className="analytics-tab"
              onClick={() => setActiveTab('users')}
              style={{
                color: activeTab === 'users' ? '#fff' : '#9ca3af',
                backgroundColor: activeTab === 'users' ? 'rgba(16, 185, 129, 0.16)' : 'transparent',
                border: 'none',
                borderBottom: activeTab === 'users' ? '3px solid #10b981' : 'none',
                fontWeight: activeTab === 'users' ? '700' : '600',
              }}
            >
              <i className="bi bi-person-check me-2"></i>
              Users
            </button>
          </li>

          <li className="nav-item">
            <button
              className="analytics-tab"
              onClick={() => setActiveTab('graphs')}
              style={{
                color: activeTab === 'graphs' ? '#fff' : '#9ca3af',
                backgroundColor: activeTab === 'graphs' ? 'rgba(16, 185, 129, 0.16)' : 'transparent',
                border: 'none',
                borderBottom: activeTab === 'graphs' ? '3px solid #10b981' : 'none',
                fontWeight: activeTab === 'graphs' ? '700' : '600',
              }}
            >
              <i className="bi bi-graph-up me-2"></i>
              Graphs
            </button>
          </li>
          <li className="nav-item">
            <button
              className="analytics-tab"
              onClick={() => setActiveTab('tables')}
              style={{
                color: activeTab === 'tables' ? '#fff' : '#9ca3af',
                backgroundColor: activeTab === 'tables' ? 'rgba(16, 185, 129, 0.16)' : 'transparent',
                border: 'none',
                borderBottom: activeTab === 'tables' ? '3px solid #10b981' : 'none',
                fontWeight: activeTab === 'tables' ? '700' : '600',
              }}
            >
              <i className="bi bi-table me-2"></i>
              Tables
            </button>
          </li>
        </ul>

        {error && (
          <div
            className="alert alert-danger mb-4"
            style={{
              backgroundColor: 'rgba(220, 38, 38, 0.1)',
              border: '1px solid rgba(220, 38, 38, 0.3)',
              color: '#ef4444',
            }}
          >
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </div>
        )}

        {loading ? (
          <div className="d-flex justify-content-center align-items-center py-5">
            <div className="spinner-border" style={{ color: '#10b981' }} role="status">
              <span className="visually-hidden">Loading analytics...</span>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <>
                <SectionHeader title="Key metrics" subtitle="More info, less wasted space" />
                <MetricStrip title="Overview" subtitle="High-level snapshot" items={keyMetricsItems} />

                <SectionHeader title="Activity" subtitle="More info, less wasted space" />
                <MetricStrip title="Usage" subtitle="What users did in the selected range" items={activityItems} />
              </>
            )}

            {activeTab === 'graphs' && (
              <>
                <SectionHeader title="Graphs" subtitle="Clean trend charts for the selected range" />
                <div className="row g-3">
                  <div className="col-12 col-xl-6">
                    <GraphCard
                      title="Users"
                      subtitle="Signups vs logins"
                      seriesList={[
                        { key: 'signups', color: 'rgba(16, 185, 129, 0.95)', series: signupsSeries },
                        { key: 'logins', color: 'rgba(59, 130, 246, 0.95)', series: loginsSeries },
                      ]}
                      legend={[
                        { label: 'Signups', color: 'rgba(16, 185, 129, 0.95)' },
                        { label: 'Logins', color: 'rgba(59, 130, 246, 0.95)' },
                      ]}
                    />
                  </div>
                  <div className="col-12 col-xl-6">
                    <GraphCard
                      title="Engagement"
                      subtitle="Workouts, nutrition logs, messages"
                      seriesList={[
                        { key: 'workouts', color: 'rgba(16, 185, 129, 0.95)', series: workoutsSeries },
                        { key: 'nutrition', color: 'rgba(245, 158, 11, 0.95)', series: nutritionSeries },
                        { key: 'messages', color: 'rgba(59, 130, 246, 0.95)', series: messagesSeries },
                      ]}
                      legend={[
                        { label: 'Workouts', color: 'rgba(16, 185, 129, 0.95)' },
                        { label: 'Food logs', color: 'rgba(245, 158, 11, 0.95)' },
                        { label: 'Messages', color: 'rgba(59, 130, 246, 0.95)' },
                      ]}
                    />
                  </div>

                  <div className="col-12 col-xl-6">
                    <GraphCard
                      title="Commerce"
                      subtitle="Completed purchases per day"
                      seriesList={[{ key: 'purchases', color: 'rgba(16, 185, 129, 0.95)', series: purchasesSeries }]}
                      legend={[{ label: 'Purchases', color: 'rgba(16, 185, 129, 0.95)' }]}
                    />
                  </div>
                  <div className="col-12 col-xl-6">
                    <GraphCard
                      title="Revenue"
                      subtitle="Revenue per day (completed)"
                      seriesList={[{ key: 'revenue', color: 'rgba(245, 158, 11, 0.95)', series: revenueSeries }]}
                      legend={[{ label: 'Revenue', color: 'rgba(245, 158, 11, 0.95)' }]}
                    />
                  </div>

                  <div className="col-12 col-xl-6">
                    <GraphCard
                      title="Coaching"
                      subtitle="Requests created per day"
                      seriesList={[
                        { key: 'coaching', color: 'rgba(59, 130, 246, 0.95)', series: coachingRequestsSeries },
                      ]}
                      legend={[{ label: 'Requests', color: 'rgba(59, 130, 246, 0.95)' }]}
                    />
                  </div>
                </div>
              </>
            )}

            {activeTab === 'tables' && (
              <>
                <SectionHeader title="Breakdowns" subtitle="Where activity is coming from" />
                <div className="row g-3">
                  <div className="col-12 col-xl-4">
                    <MiniTable
                      title="Users by role"
                      rows={userRolesRows}
                      columns={[
                        { key: 'role', label: 'Role' },
                        { key: 'count', label: 'Users' },
                      ]}
                    />
                  </div>
                  <div className="col-12 col-xl-4">
                    <MiniTable
                      title="Active users by role (range)"
                      rows={activeByRolePeriodRows}
                      columns={[
                        { key: 'role', label: 'Role' },
                        { key: 'count', label: 'Users' },
                      ]}
                    />
                  </div>
                  <div className="col-12 col-xl-4">
                    <MiniTable
                      title="New users by role (range)"
                      rows={newByRolePeriodRows}
                      columns={[
                        { key: 'role', label: 'Role' },
                        { key: 'count', label: 'Users' },
                      ]}
                    />
                  </div>
                  <div className="col-12 col-xl-4">
                    <MiniTable
                      title="Programs by status"
                      rows={programsByStatusRows}
                      columns={[
                        { key: 'status', label: 'Status' },
                        { key: 'count', label: 'Programs' },
                      ]}
                    />
                  </div>
                  <div className="col-12 col-xl-4">
                    <MiniTable
                      title="Coaching requests"
                      rows={coachingRequestsByStatusRows}
                      columns={[
                        { key: 'status', label: 'Status' },
                        { key: 'count', label: 'Requests' },
                      ]}
                    />
                  </div>
                  <div className="col-12 col-xl-4">
                    <MiniTable
                      title="Revenue by currency (range)"
                      rows={(commerce?.revenue_period_by_currency || commerce?.revenue_total_by_currency || []).map(
                        (r) => ({
                          currency: r.currency,
                          revenue: r.revenue,
                        }),
                      )}
                      columns={[
                        { key: 'currency', label: 'Currency' },
                        { key: 'revenue', label: 'Revenue' },
                      ]}
                    />
                  </div>
                  <div className="col-12">
                    <MiniTable
                      title="Top programs (top 8)"
                      rows={topPrograms}
                      columns={[
                        { key: 'title', label: 'Title' },
                        { key: 'status', label: 'Status' },
                        { key: 'purchase_count', label: 'Purchases' },
                        { key: 'view_count', label: 'Views' },
                      ]}
                    />
                  </div>
                </div>
              </>
            )}

            {activeTab === 'sales' && (
              <>
                <SectionHeader title="Sales" subtitle="Top-selling programs and coaches (selected range)" />
                <div className="row g-3">
                  <div className="col-12">
                    <MiniTable
                      title="Top programs by sales (range)"
                      rows={analytics?.leaderboards?.top_programs_by_sales_period || []}
                      columns={[
                        { key: 'program_title', label: 'Program' },
                        { key: 'trainer_name', label: 'Coach' },
                        { key: 'sales_count', label: 'Sales' },
                        {
                          key: 'revenue_total',
                          label: 'Revenue',
                          format: (v, row) => {
                            if (!v) return '—';
                            const n = Number(v);
                            if (Number.isNaN(n)) return String(v);
                            if (Number(row?.currency_count) === 1 && row?.currency) return `${row.currency} ${n.toFixed(2)}`;
                            return `${n.toFixed(2)} (multi)`;
                          },
                        },
                      ]}
                    />
                  </div>
                  <div className="col-12 col-xl-6">
                    <MiniTable
                      title="Top coaches by sales (range)"
                      rows={analytics?.leaderboards?.top_trainers_by_sales_period || []}
                      columns={[
                        { key: 'trainer_name', label: 'Coach' },
                        { key: 'sales_count', label: 'Sales' },
                        {
                          key: 'revenue_total',
                          label: 'Revenue',
                          format: (v, row) => {
                            if (!v) return '—';
                            const n = Number(v);
                            if (Number.isNaN(n)) return String(v);
                            if (Number(row?.currency_count) === 1 && row?.currency) return `${row.currency} ${n.toFixed(2)}`;
                            return `${n.toFixed(2)} (multi)`;
                          },
                        },
                      ]}
                    />
                  </div>
                  <div className="col-12 col-xl-6">
                    <MiniTable
                      title="Revenue by currency (range)"
                      rows={(commerce?.revenue_period_by_currency || commerce?.revenue_total_by_currency || []).map((r) => ({
                        currency: r.currency,
                        revenue: r.revenue,
                      }))}
                      columns={[
                        { key: 'currency', label: 'Currency' },
                        { key: 'revenue', label: 'Revenue' },
                      ]}
                    />
                  </div>
                </div>
              </>
            )}

            {activeTab === 'coaches' && (
              <>
                <SectionHeader title="Coaches" subtitle="Connections leaderboard" />
                <div className="row g-3">
                  <div className="col-12 col-xl-6">
                    <MiniTable
                      title="Most connections (all time)"
                      rows={analytics?.leaderboards?.top_trainers_by_connections || []}
                      columns={[
                        { key: 'trainer_name', label: 'Coach' },
                        { key: 'active_connections', label: 'Active' },
                        { key: 'total_connections', label: 'Total' },
                      ]}
                    />
                  </div>
                  <div className="col-12 col-xl-6">
                    <MiniTable
                      title="New connections started (range)"
                      rows={analytics?.leaderboards?.top_trainers_by_new_connections_period || []}
                      columns={[
                        { key: 'trainer_name', label: 'Coach' },
                        { key: 'connections_started', label: 'Started' },
                      ]}
                    />
                  </div>
                </div>
              </>
            )}

            {activeTab === 'users' && (
              <>
                <SectionHeader title="Users" subtitle="Top buyers (selected range)" />
                <div className="row g-3">
                  <div className="col-12">
                    <MiniTable
                      title="Users with most purchases (range)"
                      rows={analytics?.leaderboards?.top_users_by_purchases_period || []}
                      columns={[
                        { key: 'user_name', label: 'User' },
                        { key: 'user_role', label: 'Role' },
                        { key: 'purchase_count', label: 'Purchases' },
                        {
                          key: 'spent_total',
                          label: 'Spent',
                          format: (v, row) => {
                            if (!v) return '—';
                            const n = Number(v);
                            if (Number.isNaN(n)) return String(v);
                            if (Number(row?.currency_count) === 1 && row?.currency) return `${row.currency} ${n.toFixed(2)}`;
                            return `${n.toFixed(2)} (multi)`;
                          },
                        },
                      ]}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="mt-4 small" style={{ color: '#9ca3af' }}>
              Generated at: <span style={{ color: '#fff' }}>{analytics?.generated_at || '—'}</span>
            </div>
          </>
        )}
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminAnalytics;
