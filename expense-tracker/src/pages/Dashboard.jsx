import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useExpenses } from '../context/ExpenseContext';
import { CATEGORIES, COLORS } from '../constants';
import Modal from '../components/Modal';

const getCurrentMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const getMonthKey = (dateStr) => {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return '';
  return dateStr.slice(0, 7);
};

const formatMonthDisplay = (monthKey) => {
  if (!monthKey) return 'Select Month';
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

export default function Dashboard() {
  const {
    expenses,
    incomes,
    budgets,
    setMonthlyBudget,
    addIncome,
    deleteIncome,
    isSyncing,
    syncError,
    refreshData
  } = useExpenses();

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey());
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [incomeForm, setIncomeForm] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    source: 'Salary',
    description: ''
  });

  const monthOptions = useMemo(() => {
    const months = new Set([getCurrentMonthKey(), ...Object.keys(budgets)]);
    expenses.forEach(exp => {
      const monthKey = getMonthKey(exp.date);
      if (monthKey) months.add(monthKey);
    });
    incomes.forEach(income => {
      const monthKey = getMonthKey(income.date);
      if (monthKey) months.add(monthKey);
    });
    return [...months].sort((a, b) => b.localeCompare(a));
  }, [expenses, incomes, budgets]);

  const selectedMonthLabel = formatMonthDisplay(selectedMonth);
  const budget = budgets[selectedMonth] || 0;

  const handleBudgetSubmit = (e) => {
    e.preventDefault();
    const amount = parseFloat(budgetInput);
    if (isNaN(amount) || amount < 0) return;

    setMonthlyBudget(selectedMonth, amount);
    setIsEditingBudget(false);
    setBudgetInput('');
  };

  const handleIncomeSubmit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(incomeForm.amount);
    if (!incomeForm.date || isNaN(amount) || amount <= 0) return;

    const success = await addIncome({
      ...incomeForm,
      amount
    });

    if (success) {
      setIncomeForm({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        source: 'Salary',
        description: ''
      });
      setIsIncomeModalOpen(false);
    }
  };

  const monthExpenses = useMemo(() =>
    expenses.filter(exp => getMonthKey(exp.date) === selectedMonth),
    [expenses, selectedMonth]
  );

  const previousMonthKey = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 2, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }, [selectedMonth]);

  const previousMonthSpent = useMemo(() =>
    expenses
      .filter(exp => getMonthKey(exp.date) === previousMonthKey)
      .reduce((sum, exp) => sum + (exp.amount || 0), 0),
    [expenses, previousMonthKey]
  );

  const monthIncomes = useMemo(() =>
    incomes.filter(income => getMonthKey(income.date) === selectedMonth),
    [incomes, selectedMonth]
  );

  const monthlySpent = useMemo(() =>
    monthExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0),
    [monthExpenses]
  );

  const monthlyIncome = useMemo(() =>
    monthIncomes.reduce((sum, income) => sum + (income.amount || 0), 0),
    [monthIncomes]
  );

  const savings = monthlyIncome - monthlySpent;
  const overallSavings = useMemo(() => {
    const currentMonthKey = getCurrentMonthKey();
    const monthTotals = {};

    incomes.forEach(income => {
      const monthKey = getMonthKey(income.date);
      if (!monthKey || monthKey >= currentMonthKey) return;
      if (!monthTotals[monthKey]) monthTotals[monthKey] = { income: 0, expense: 0 };
      monthTotals[monthKey].income += income.amount || 0;
    });

    expenses.forEach(expense => {
      const monthKey = getMonthKey(expense.date);
      if (!monthKey || monthKey >= currentMonthKey) return;
      if (!monthTotals[monthKey]) monthTotals[monthKey] = { income: 0, expense: 0 };
      monthTotals[monthKey].expense += expense.amount || 0;
    });

    return Object.values(monthTotals).reduce((sum, month) => sum + (month.income - month.expense), 0);
  }, [expenses, incomes]);
  const savingsPercent = monthlyIncome > 0 ? (savings / monthlyIncome) * 100 : 0;
  const remainingBudget = budget - monthlySpent;
  const overBudgetAmount = Math.max(monthlySpent - budget, 0);
  const budgetPercent = budget > 0 ? Math.min((monthlySpent / budget) * 100, 100) : 0;
  const isOverBudget = budget > 0 && monthlySpent > budget;
  const isWarning = budget > 0 && monthlySpent >= budget * 0.8 && !isOverBudget;
  const budgetTone = isOverBudget ? 'danger' : isWarning ? 'warning' : 'success';

  const categoryData = useMemo(() => {
    const totals = {};
    CATEGORIES.forEach(cat => totals[cat] = 0);
    monthExpenses.forEach(exp => {
      const cat = exp.category || 'Others';
      totals[cat] = (totals[cat] || 0) + (exp.amount || 0);
    });
    return CATEGORIES
      .map(cat => ({ name: cat, value: Math.round(totals[cat] * 100) / 100 }))
      .filter(d => d.value > 0);
  }, [monthExpenses]);

  const paymentData = useMemo(() => {
    const totals = {};
    monthExpenses.forEach(exp => {
      const method = exp.paymentMethod || 'Cash';
      totals[method] = (totals[method] || 0) + 1;
    });
    return Object.entries(totals).sort((a, b) => b[1] - a[1]);
  }, [monthExpenses]);

  const insights = useMemo(() => {
    const items = [];
    if (categoryData.length > 0) {
      items.push(`${categoryData[0].name} is your highest spending category in ${selectedMonthLabel}.`);
    }
    if (previousMonthSpent > 0) {
      const change = ((monthlySpent - previousMonthSpent) / previousMonthSpent) * 100;
      const direction = change >= 0 ? 'more' : 'less';
      items.push(`You spent ${Math.abs(change).toFixed(0)}% ${direction} than last month.`);
    }
    if (paymentData.length > 0) {
      items.push(`Most payments were made through ${paymentData[0][0]}.`);
    }
    if (monthlyIncome > 0) {
      items.push(`Your savings rate is ${savingsPercent.toFixed(0)}% for ${selectedMonthLabel}.`);
    }
    if (items.length === 0) {
      items.push(`Add expenses or income for ${selectedMonthLabel} to see insights.`);
    }
    return items;
  }, [categoryData, monthlySpent, monthlyIncome, paymentData, previousMonthSpent, savingsPercent, selectedMonthLabel]);

  const recentExpenses = useMemo(() =>
    [...monthExpenses].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5),
    [monthExpenses]
  );

  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return 'No date';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
    return dateStr;
  };

  if (isSyncing && expenses.length === 0) {
    return <div className="loading-screen">Loading dashboard...</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>📊 Dashboard</h2>
        <button onClick={refreshData} className="btn-refresh" disabled={isSyncing}>
          {isSyncing ? '🔄 Syncing...' : '🔄 Refresh'}
        </button>
      </div>

      {syncError && <div className="error-message">{syncError}</div>}

      <div className="dashboard-toolbar">
        <div className="filter-group">
          <label>Dashboard Month:</label>
          <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
            {monthOptions.map(month => (
              <option key={month} value={month}>{formatMonthDisplay(month)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <div className="stat-label">Income</div>
            <div className="stat-value">${monthlyIncome.toFixed(2)}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📉</div>
          <div className="stat-info">
            <div className="stat-label">Expense</div>
            <div className="stat-value">${monthlySpent.toFixed(2)}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🏦</div>
          <div className="stat-info">
            <div className="stat-label">Month Savings</div>
            <div className={`stat-value ${savings < 0 ? 'value-danger' : 'value-success'}`}>
              ${savings.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💎</div>
          <div className="stat-info">
            <div className="stat-label">Overall Savings</div>
            <div className={`stat-value ${overallSavings < 0 ? 'value-danger' : 'value-success'}`}>
              ${overallSavings.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-info">
            <div className="stat-label">Savings Rate</div>
            <div className={`stat-value ${savingsPercent < 0 ? 'value-danger' : 'value-success'}`}>
              {monthlyIncome > 0 ? `${savingsPercent.toFixed(0)}%` : '0%'}
            </div>
          </div>
        </div>
      </div>

      <div className={`budget-management-card budget-${budgetTone}`}>
        <div className="budget-header-row">
          <h3>🎯 Monthly Budget ({selectedMonthLabel})</h3>
          {!isEditingBudget && (
            <button onClick={() => {
              setBudgetInput(budget || '');
              setIsEditingBudget(true);
            }} className="btn-edit-budget">
              {budget > 0 ? '✏️ Edit Budget' : '➕ Set Budget'}
            </button>
          )}
        </div>

        {isEditingBudget ? (
          <form onSubmit={handleBudgetSubmit} className="budget-form">
            <div className="budget-form-field">
              <label>Budget Amount ($)</label>
              <input
                type="number"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                placeholder="Enter monthly budget"
                min="0"
                step="0.01"
                required
                autoFocus
              />
            </div>
            <div className="budget-form-buttons">
              <button type="submit" className="btn-budget-save">💾 Save Budget</button>
              <button type="button" onClick={() => {
                setIsEditingBudget(false);
                setBudgetInput('');
              }} className="btn-budget-cancel">
                Cancel
              </button>
            </div>
          </form>
        ) : budget > 0 ? (
          <div className="budget-progress">
            <div className="budget-metrics-grid">
              <div><span>Budget</span><strong>${budget.toFixed(2)}</strong></div>
              <div><span>Spent</span><strong>${monthlySpent.toFixed(2)}</strong></div>
              <div><span>Remaining</span><strong className={remainingBudget < 0 ? 'value-danger' : 'value-success'}>${remainingBudget.toFixed(2)}</strong></div>
              <div><span>Over Budget</span><strong className={overBudgetAmount > 0 ? 'value-danger' : ''}>${overBudgetAmount.toFixed(2)}</strong></div>
            </div>
            <div className="budget-bar-bg">
              <div className={`budget-bar ${budgetTone}`} style={{ width: `${budgetPercent}%` }}></div>
            </div>
            {isWarning && <p className="budget-alert">⚠️ 80% budget used</p>}
            {isOverBudget && <p className="budget-alert danger">🚨 Over budget by ${overBudgetAmount.toFixed(2)}</p>}
            {!isOverBudget && !isWarning && <p className="budget-ok">✅ ${remainingBudget.toFixed(2)} remaining</p>}
          </div>
        ) : (
          <div className="budget-empty">
            <p>🎯 Set a monthly budget to track your spending for {selectedMonthLabel}</p>
            <button onClick={() => setIsEditingBudget(true)} className="btn-budget-set">Set Budget Now</button>
          </div>
        )}
      </div>

      <div className="income-management-card">
        <div className="budget-header-row">
          <h3>💵 Income Tracking</h3>
          <button type="button" onClick={() => setIsIncomeModalOpen(true)} className="btn-edit-budget">
            ➕ Add Income
          </button>
        </div>

        {monthIncomes.length > 0 && (
          <div className="income-list">
            {monthIncomes.map(income => (
              <div key={income.id} className="income-row">
                <span>{formatDateForDisplay(income.date)}</span>
                <span>{income.source}</span>
                <strong>${(income.amount || 0).toFixed(2)}</strong>
                <button onClick={() => deleteIncome(income.id)} className="btn-delete" title="Delete income">🗑️</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={isIncomeModalOpen}
        onClose={() => setIsIncomeModalOpen(false)}
        title="➕ Add Income"
      >
        <form onSubmit={handleIncomeSubmit} className="modal-form">
          <div className="modal-form-grid">
            <div className="modal-form-field">
              <label className="modal-field-label">Date</label>
              <input
                type="date"
                className="modal-field-input"
                value={incomeForm.date}
                onChange={e => setIncomeForm({ ...incomeForm, date: e.target.value })}
                required
              />
            </div>
            <div className="modal-form-field">
              <label className="modal-field-label">Amount ($)</label>
              <input
                type="number"
                className="modal-field-input"
                value={incomeForm.amount}
                onChange={e => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                placeholder="0.00"
                min="0.01"
                step="0.01"
                required
              />
            </div>
            <div className="modal-form-field">
              <label className="modal-field-label">Source</label>
              <input
                type="text"
                className="modal-field-input"
                value={incomeForm.source}
                onChange={e => setIncomeForm({ ...incomeForm, source: e.target.value })}
                placeholder="Salary"
              />
            </div>
            <div className="modal-form-field modal-form-field-wide">
              <label className="modal-field-label">Description</label>
              <input
                type="text"
                className="modal-field-input"
                value={incomeForm.description}
                onChange={e => setIncomeForm({ ...incomeForm, description: e.target.value })}
                placeholder="Optional note"
              />
            </div>
          </div>
          <div className="modal-form-buttons">
            <button type="submit" className="btn-modal-submit">Add Income</button>
            <button type="button" onClick={() => setIsIncomeModalOpen(false)} className="btn-modal-cancel-outline">
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      <div className="insights-card">
        <h3>💡 Dashboard Insights</h3>
        <div className="insights-list">
          {insights.map((insight, index) => (
            <div key={index} className="insight-item">{insight}</div>
          ))}
        </div>
      </div>

      {categoryData.length > 0 && (
        <div className="charts-section">
          <div className="chart-card">
            <h3>Category Breakdown - {selectedMonthLabel}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryData.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `$${v.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h3>Monthly Flow by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `$${v}`} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => `$${v.toFixed(2)}`} />
                <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="recent-expenses-card">
        <h3>🕒 Recent Transactions - {selectedMonthLabel}</h3>
        {recentExpenses.length === 0 ? (
          <div className="empty-state">No expenses for {selectedMonthLabel} yet.</div>
        ) : (
          <div className="expense-table">
            <div className="expense-table-header">
              <span>Date</span>
              <span>Category</span>
              <span>Payment</span>
              <span>Description</span>
              <span>Amount</span>
            </div>
            {recentExpenses.map(exp => (
              <div key={exp.id} className="expense-table-row">
                <span>{formatDateForDisplay(exp.date)}</span>
                <span className="category-badge">{exp.category}</span>
                <span className="payment-badge-small">{exp.paymentMethod || 'Cash'}</span>
                <span className="description-text">{exp.description || '-'}</span>
                <span className="amount-text">${(exp.amount || 0).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
