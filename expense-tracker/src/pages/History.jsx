import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useExpenses } from '../context/ExpenseContext';
import { COLORS } from '../constants';

const getMonthKey = (dateStr) => {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return '';
  return dateStr.slice(0, 7);
};

const toLocalDate = (dateStr) => {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const toInputDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const escapeCsv = (value) => {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
};

export default function History() {
  const { expenses, isSyncing, syncError, refreshData } = useExpenses();
  const [selectedMonth, setSelectedMonth] = useState('');
  const [searchText, setSearchText] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });

  const monthlyData = useMemo(() => {
    const monthMap = {};

    expenses.forEach(exp => {
      const monthKey = getMonthKey(exp.date);
      if (!monthKey) return;

      if (!monthMap[monthKey]) {
        monthMap[monthKey] = {
          month: monthKey,
          total: 0,
          count: 0,
          categories: {}
        };
      }

      monthMap[monthKey].total += exp.amount || 0;
      monthMap[monthKey].count += 1;

      const cat = exp.category || 'Others';
      monthMap[monthKey].categories[cat] = (monthMap[monthKey].categories[cat] || 0) + (exp.amount || 0);
    });

    return Object.values(monthMap).sort((a, b) => b.month.localeCompare(a.month));
  }, [expenses]);

  const availableMonths = useMemo(() => monthlyData.map(m => m.month), [monthlyData]);

  const baseExpenses = useMemo(() => {
    if (!selectedMonth) return [];
    if (selectedMonth === 'All') return expenses;
    return expenses.filter(exp => getMonthKey(exp.date) === selectedMonth);
  }, [expenses, selectedMonth]);

  const dateRange = useMemo(() => {
    if (dateFilter === 'all') return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    const end = new Date(today);

    if (dateFilter === 'today') return { start, end };

    if (dateFilter === 'week') {
      const day = start.getDay();
      const diff = day === 0 ? 6 : day - 1;
      start.setDate(start.getDate() - diff);
      end.setDate(start.getDate() + 6);
      return { start, end };
    }

    if (dateFilter === 'month') {
      start.setDate(1);
      end.setMonth(end.getMonth() + 1, 0);
      return { start, end };
    }

    if (dateFilter === 'lastMonth') {
      start.setMonth(start.getMonth() - 1, 1);
      end.setFullYear(start.getFullYear(), start.getMonth() + 1, 0);
      return { start, end };
    }

    if (dateFilter === 'custom') {
      return {
        start: customRange.start ? toLocalDate(customRange.start) : null,
        end: customRange.end ? toLocalDate(customRange.end) : null
      };
    }

    return null;
  }, [dateFilter, customRange]);

  const filteredExpenses = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return baseExpenses.filter(exp => {
      const expDate = toLocalDate(exp.date);
      const matchesSearch = !query || [
        exp.description,
        exp.category,
        exp.paymentMethod,
        exp.amount
      ].some(value => String(value ?? '').toLowerCase().includes(query));

      const matchesDate = !dateRange || (
        (!dateRange.start || (expDate && expDate >= dateRange.start)) &&
        (!dateRange.end || (expDate && expDate <= dateRange.end))
      );

      return matchesSearch && matchesDate;
    });
  }, [baseExpenses, searchText, dateRange]);

  const filteredSummary = useMemo(() => {
    const categories = {};
    const total = filteredExpenses.reduce((sum, exp) => {
      const cat = exp.category || 'Others';
      categories[cat] = (categories[cat] || 0) + (exp.amount || 0);
      return sum + (exp.amount || 0);
    }, 0);

    return {
      total,
      count: filteredExpenses.length,
      categories
    };
  }, [filteredExpenses]);

  const categoryChartData = useMemo(() =>
    Object.entries(filteredSummary.categories)
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value),
    [filteredSummary]
  );

  const selectedTitle = selectedMonth === 'All'
    ? 'All History'
    : formatMonthDisplay(selectedMonth);

  const getAverageDivisor = () => {
    if (filteredSummary.count === 0) return 1;
    if (dateRange?.start && dateRange?.end) {
      const msPerDay = 24 * 60 * 60 * 1000;
      return Math.max(1, Math.round((dateRange.end - dateRange.start) / msPerDay) + 1);
    }
    if (selectedMonth && selectedMonth !== 'All') {
      const [year, month] = selectedMonth.split('-').map(Number);
      return new Date(year, month, 0).getDate();
    }
    return filteredSummary.count;
  };

  const formatDateForDisplay = (dateStr) => {
    const date = toLocalDate(dateStr);
    if (!date) return dateStr || 'No date';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  function formatMonthDisplay(monthKey) {
    if (!monthKey) return 'Select History';
    if (monthKey === 'All') return 'All History';
    const [year, month] = monthKey.split('-').map(Number);
    return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  const handleDateFilterChange = (value) => {
    setDateFilter(value);
    if (value === 'custom') {
      const today = new Date();
      setCustomRange({
        start: customRange.start || toInputDate(new Date(today.getFullYear(), today.getMonth(), 1)),
        end: customRange.end || toInputDate(today)
      });
    }
  };

  const handleExportCsv = () => {
    if (filteredExpenses.length === 0) return;

    const rows = [
      ['Date', 'Category', 'Payment Method', 'Description', 'Amount'],
      ...filteredExpenses.map(exp => [
        exp.date || '',
        exp.category || '',
        exp.paymentMethod || '',
        exp.description || '',
        (exp.amount || 0).toFixed(2)
      ])
    ];
    const csv = rows.map(row => row.map(escapeCsv).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `expense-history-${selectedMonth || 'selected'}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  if (isSyncing && expenses.length === 0) {
    return <div className="loading-screen">Loading history...</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>📅 Expense History</h2>
        <button onClick={refreshData} className="btn-refresh" disabled={isSyncing}>
          {isSyncing ? '🔄 Syncing...' : '🔄 Refresh'}
        </button>
      </div>

      {syncError && <div className="error-message">{syncError}</div>}

      {monthlyData.length === 0 ? (
        <div className="empty-state">
          No history available. Start adding expenses to see your monthly history! 📝
        </div>
      ) : (
        <>
          <div className="history-controls history-controls-grid">
            <div className="filter-group">
              <label>Select Month:</label>
              <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
                <option value="">Choose history view</option>
                <option value="All">All History</option>
                {availableMonths.map(month => (
                  <option key={month} value={month}>{formatMonthDisplay(month)}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Search:</label>
              <input
                type="search"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                placeholder="Category, payment, description"
                disabled={!selectedMonth}
              />
            </div>

            <div className="filter-group">
              <label>Date:</label>
              <select
                value={dateFilter}
                onChange={e => handleDateFilterChange(e.target.value)}
                disabled={!selectedMonth}
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="lastMonth">Last Month</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            <button
              type="button"
              className="btn-export"
              onClick={handleExportCsv}
              disabled={!selectedMonth || filteredExpenses.length === 0}
            >
              Download CSV
            </button>
          </div>

          {dateFilter === 'custom' && selectedMonth && (
            <div className="custom-date-row">
              <div className="filter-group">
                <label>From:</label>
                <input
                  type="date"
                  value={customRange.start}
                  onChange={e => setCustomRange({ ...customRange, start: e.target.value })}
                />
              </div>
              <div className="filter-group">
                <label>To:</label>
                <input
                  type="date"
                  value={customRange.end}
                  onChange={e => setCustomRange({ ...customRange, end: e.target.value })}
                />
              </div>
            </div>
          )}

          {!selectedMonth && (
            <div className="empty-state">Select All History or a month to view expenses.</div>
          )}

          {selectedMonth && (
            <>
              <div className="month-summary-card">
                <h3>{selectedTitle}</h3>
                <div className="month-stats-grid">
                  <div className="month-stat">
                    <div className="month-stat-label">Total Spent</div>
                    <div className="month-stat-value">${filteredSummary.total.toFixed(2)}</div>
                  </div>
                  <div className="month-stat">
                    <div className="month-stat-label">Transactions</div>
                    <div className="month-stat-value">{filteredSummary.count}</div>
                  </div>
                  <div className="month-stat">
                    <div className="month-stat-label">Daily Average</div>
                    <div className="month-stat-value">${(filteredSummary.total / getAverageDivisor()).toFixed(2)}</div>
                  </div>
                  <div className="month-stat">
                    <div className="month-stat-label">Top Category</div>
                    <div className="month-stat-value">{categoryChartData.length > 0 ? categoryChartData[0].name : '-'}</div>
                  </div>
                </div>
              </div>

              {categoryChartData.length > 0 && (
                <div className="chart-card">
                  <h3>Total Expense Pie Chart - {selectedTitle}</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryChartData.map((entry, i) => (
                          <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => `$${v.toFixed(2)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="monthly-history-list">
                <h3>{selectedMonth === 'All' ? '📋 All History' : `📋 Expenses - ${formatMonthDisplay(selectedMonth)}`}</h3>

                {filteredExpenses.length === 0 ? (
                  <div className="empty-state">No expenses match this view.</div>
                ) : (
                  Object.entries(
                    filteredExpenses.reduce((groups, expense) => {
                      const dateKey = expense.date || 'No date';
                      if (!groups[dateKey]) groups[dateKey] = [];
                      groups[dateKey].push(expense);
                      return groups;
                    }, {})
                  )
                    .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
                    .map(([dateKey, dayExpenses]) => (
                      <div key={dateKey} className="expense-date-group">
                        <div className="expense-date-header">
                          <h3>{formatDateForDisplay(dateKey)}</h3>
                          <span className="expense-date-total">
                            ${dayExpenses.reduce((sum, e) => sum + (e.amount || 0), 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="expense-date-items">
                          {dayExpenses.map(exp => (
                            <div key={exp.id} className="expense-item-history">
                              <div className="expense-item-info">
                                <div className="expense-item-top">
                                  <span className="expense-category">{exp.category}</span>
                                  {exp.paymentMethod && <span className="payment-badge">{exp.paymentMethod}</span>}
                                </div>
                                {exp.description && <span className="expense-desc">"{exp.description}"</span>}
                              </div>
                              <span className="expense-amount">${(exp.amount || 0).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </>
          )}

          <div className="all-months-grid">
            <h3>📊 Monthly Overview</h3>
            <div className="months-grid">
              {monthlyData.map(month => (
                <div
                  key={month.month}
                  className={`month-card ${selectedMonth === month.month ? 'selected' : ''}`}
                  onClick={() => setSelectedMonth(month.month)}
                >
                  <div className="month-card-header">
                    <h4>{formatMonthDisplay(month.month)}</h4>
                  </div>
                  <div className="month-card-stats">
                    <div className="month-mini-stat">
                      <span className="month-mini-label">Total</span>
                      <span className="month-mini-value">${month.total.toFixed(2)}</span>
                    </div>
                    <div className="month-mini-stat">
                      <span className="month-mini-label">Count</span>
                      <span className="month-mini-value">{month.count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
