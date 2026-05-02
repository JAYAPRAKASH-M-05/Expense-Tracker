import { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Use environment variable for API URL, fallback to empty string if not set
const API_URL = import.meta.env.VITE_API_URL || '';

const ExpenseContext = createContext();

export const normalizeDate = (dateStr) => {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return dateStr;
  }
};

export const useExpenses = () => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpenses must be used within ExpenseProvider');
  }
  return context;
};

export function ExpenseProvider({ children }) {
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('expense-incomes')) || [];
    } catch { return []; }
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [toast, setToast] = useState(null);

  const [budgets, setBudgets] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('expense-budgets')) || {};
    } catch { return {}; }
  });

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  useEffect(() => {
    if (API_URL) {
      // Fetch budgets from API if available
      fetch(`${API_URL}/budgets`)
        .then(res => res.json())
        .then(json => {
          if (json.success && json.data) {
            const budgetMap = {};
            json.data.forEach(budget => {
              budgetMap[budget.month] = budget.amount;
            });
            setBudgets(budgetMap);
          }
        })
        .catch(err => console.error('Failed to fetch budgets:', err));
    }
  }, []);

  useEffect(() => {
    if (!API_URL) {
      // Fallback to localStorage if no API
      localStorage.setItem('expense-budgets', JSON.stringify(budgets));
    }
  }, [budgets]);

  useEffect(() => {
    if (!API_URL) {
      localStorage.setItem('expense-incomes', JSON.stringify(incomes));
    }
  }, [incomes]);

  const fetchExpenses = useCallback(async () => {
    if (!API_URL) {
      setSyncError('API URL not configured. Please set VITE_API_URL in your .env file.');
      setIsSyncing(false);
      return;
    }

    setIsSyncing(true);
    try {
      const res = await fetch(`${API_URL}/expenses`);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const json = await res.json();
      if (json.success) {
        const normalized = (json.data || []).map(exp => ({
          id: String(exp._id || exp.id || ''),
          date: exp.date || '',
          amount: parseFloat(exp.amount || 0) || 0,
          category: exp.category || 'Others',
          description: exp.description || '',
          paymentMethod: exp.paymentMethod || 'Cash'
        }));
        setExpenses(normalized);
        setSyncError('');
      } else {
        setSyncError(json.message || 'Failed to load data');
      }
    } catch (error) {
      console.error('API Error:', error);
      if (error.message.includes('404')) {
        setSyncError('API endpoint not found (404). Check your backend server URL.');
      } else if (error.message.includes('Failed to fetch')) {
        setSyncError('Network error. Make sure the backend server is running on port 5000.');
      } else {
        setSyncError(`Connection failed: ${error.message}`);
      }
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const fetchIncomes = useCallback(async () => {
    if (!API_URL) return;

    try {
      const res = await fetch(`${API_URL}/incomes`);
      if (!res.ok) return;

      const json = await res.json();
      if (json.success) {
        const normalized = (json.data || []).map(income => ({
          id: String(income._id || income.id || ''),
          date: income.date || '',
          amount: parseFloat(income.amount || 0) || 0,
          source: income.source || 'Income',
          description: income.description || ''
        }));
        setIncomes(normalized);
      }
    } catch (error) {
      console.error('Income fetch error:', error);
    }
  }, []);

  useEffect(() => {
    fetchIncomes();
  }, [fetchIncomes]);

  const showToast = useCallback((msg, type = 'success') => setToast({ msg, type }), []);

  const callAPI = useCallback(async (action, data) => {
    if (!API_URL) {
      console.warn('API URL not configured');
      return false;
    }

    try {
      let url, method, body;

      switch(action) {
        case 'create':
          url = `${API_URL}/expenses`;
          method = 'POST';
          body = { 
            date: data.date, 
            amount: data.amount, 
            category: data.category, 
            description: data.description,
            paymentMethod: data.paymentMethod || 'Cash'
          };
          break;
        case 'update':
          url = `${API_URL}/expenses/${data.id}`;
          method = 'PUT';
          body = { 
            date: data.date, 
            amount: data.amount, 
            category: data.category, 
            description: data.description,
            paymentMethod: data.paymentMethod || 'Cash'
          };
          break;
        case 'delete':
          url = `${API_URL}/expenses/${data.id}`;
          method = 'DELETE';
          body = null;
          break;
        default:
          console.warn('Unknown action:', action);
          return false;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : null
      });

      if (!res.ok) {
        console.error(`API request failed: ${res.status}`);
        return false;
      }

      const json = await res.json();
      return json.success;
    } catch (error) {
      console.error('API request error:', error);
      return false;
    }
  }, []);

  const addExpense = async (expenseData) => {
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const expenseObj = {
      ...expenseData,
      id,
      date: normalizeDate(expenseData.date)
    };

    setExpenses(prev => [expenseObj, ...prev]);
    const success = await callAPI('create', expenseObj);
    
    if (!success) {
      showToast('Sync failed. Changes saved locally.', 'error');
    } else {
      showToast('Expense added successfully');
    }
    
    return success;
  };

  const updateExpense = async (id, expenseData) => {
    const expenseObj = {
      ...expenseData,
      id,
      date: normalizeDate(expenseData.date)
    };

    setExpenses(prev => prev.map(exp => exp.id === id ? expenseObj : exp));
    const success = await callAPI('update', expenseObj);
    
    if (!success) {
      showToast('Sync failed. Changes saved locally.', 'error');
    } else {
      showToast('Expense updated successfully');
    }
    
    return success;
  };

  const deleteExpense = async (id) => {
    setExpenses(prev => prev.filter(exp => exp.id !== id));
    const success = await callAPI('delete', { id });
    
    if (!success) {
      showToast('Delete failed. Refresh to restore.', 'error');
      await fetchExpenses();
    }
    
    return success;
  };

  const addIncome = async (incomeData) => {
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const incomeObj = {
      ...incomeData,
      id,
      date: normalizeDate(incomeData.date),
      amount: parseFloat(incomeData.amount || 0) || 0,
      source: incomeData.source?.trim() || 'Income',
      description: incomeData.description?.trim() || ''
    };

    setIncomes(prev => [incomeObj, ...prev]);

    if (!API_URL) {
      showToast('Income added successfully (local only)', 'success');
      return true;
    }

    try {
      const res = await fetch(`${API_URL}/incomes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incomeObj)
      });
      const json = await res.json();
      if (json.success) {
        if (json.data?._id) {
          setIncomes(prev => prev.map(income =>
            income.id === id ? { ...income, id: String(json.data._id) } : income
          ));
        }
        showToast('Income added successfully', 'success');
        return true;
      }
    } catch (error) {
      console.error('Income add error:', error);
    }

    showToast('Income sync failed. Saved locally.', 'error');
    return false;
  };

  const deleteIncome = async (id) => {
    setIncomes(prev => prev.filter(income => income.id !== id));

    if (!API_URL) return true;

    try {
      const res = await fetch(`${API_URL}/incomes/${id}`, { method: 'DELETE' });
      const json = await res.json();
      return json.success;
    } catch (error) {
      console.error('Income delete error:', error);
      showToast('Income delete failed. Refresh to restore.', 'error');
      await fetchIncomes();
      return false;
    }
  };

  const refreshData = async () => {
    await fetchExpenses();
    await fetchIncomes();
  };

  const setMonthlyBudget = useCallback(async (monthKey, amount) => {
    try {
      if (!API_URL) {
        // Fallback to local storage if no API
        setBudgets(prev => ({
          ...prev,
          [monthKey]: amount
        }));
        localStorage.setItem('expense-budgets', JSON.stringify({
          ...budgets,
          [monthKey]: amount
        }));
        showToast('Budget updated successfully (local only)', 'success');
        return true;
      }

      const res = await fetch(`${API_URL}/budgets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: monthKey, amount })
      });

      const json = await res.json();
      
      if (json.success) {
        setBudgets(prev => ({
          ...prev,
          [monthKey]: amount
        }));
        showToast('Budget updated successfully', 'success');
        return true;
      } else {
        showToast('Failed to update budget', 'error');
        return false;
      }
    } catch (error) {
      console.error('Budget update error:', error);
      showToast('Failed to update budget', 'error');
      return false;
    }
  }, [showToast, budgets]);

  return (
    <ExpenseContext.Provider value={{
      expenses,
      incomes,
      isSyncing,
      syncError,
      toast,
      budgets,
      setBudgets,
      setMonthlyBudget,
      addExpense,
      updateExpense,
      deleteExpense,
      addIncome,
      deleteIncome,
      refreshData,
      showToast
    }}>
      {children}
    </ExpenseContext.Provider>
  );
}
