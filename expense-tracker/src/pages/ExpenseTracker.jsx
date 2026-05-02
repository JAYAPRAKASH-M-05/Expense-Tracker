import { useState, useCallback, useMemo } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { CATEGORIES, PAYMENT_METHODS } from '../constants';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';

export default function ExpenseTracker() {
  const {
    expenses,
    isSyncing,
    toast,
    addExpense,
    updateExpense,
    deleteExpense,
    refreshData
  } = useExpenses();

  const [filter, setFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null });
  const [editingId, setEditingId] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    category: 'Food',
    description: '',
    paymentMethod: 'Cash'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!form.date || isNaN(amount) || amount <= 0) return;

    const btnKey = editingId ? 'update' : 'create';
    setActionLoading(prev => ({ ...prev, [btnKey]: true }));

    const payload = {
      ...form,
      amount,
      description: form.description.trim()
    };

    let success;
    if (editingId) {
      success = await updateExpense(editingId, payload);
    } else {
      success = await addExpense(payload);
    }

    setActionLoading(prev => ({ ...prev, [btnKey]: false }));

    if (success) {
      setForm({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        category: 'Food',
        description: '',
        paymentMethod: 'Cash'
      });
      setEditingId(null);
      setIsModalOpen(false);
    }
  };

  const handleDelete = async (id) => {
    if (id) {
      setActionLoading(prev => ({ ...prev, [`delete-${id}`]: true }));
      await deleteExpense(id);
      setActionLoading(prev => ({ ...prev, [`delete-${id}`]: false }));
    }
  };

  const openDeleteModal = (id) => {
    setDeleteConfirm({ isOpen: true, id });
  };

  const closeDeleteModal = () => {
    setDeleteConfirm({ isOpen: false, id: null });
  };

  const handleEdit = useCallback((exp) => {
    setEditingId(exp.id);
    setForm({
      date: exp.date,
      amount: (exp.amount || 0).toString(),
      category: exp.category || 'Food',
      description: exp.description || '',
      paymentMethod: exp.paymentMethod || 'Cash'
    });
    setIsModalOpen(true);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setForm({ 
      date: new Date().toISOString().split('T')[0], 
      amount: '', 
      category: 'Food', 
      description: '',
      paymentMethod: 'Cash'
    });
    setIsModalOpen(false);
  }, []);

  const handleAddNew = () => {
    setEditingId(null);
    setForm({
      date: new Date().toISOString().split('T')[0],
      amount: '',
      category: 'Food',
      description: '',
      paymentMethod: 'Cash'
    });
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setEditingId(null);
    setForm({ 
      date: new Date().toISOString().split('T')[0], 
      amount: '', 
      category: 'Food', 
      description: '',
      paymentMethod: 'Cash'
    });
    setIsModalOpen(false);
  };

  const filteredExpenses = useMemo(() =>
    filter === 'All' ? expenses : expenses.filter(exp => exp.category === filter),
    [expenses, filter]
  );

  const totalAmount = useMemo(() =>
    filteredExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0),
    [filteredExpenses]
  );

  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return 'No date';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return dateStr;
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>💳 Expense Tracker</h2>
        <button onClick={refreshData} className="btn-refresh" disabled={isSyncing}>
          {isSyncing ? '🔄 Syncing...' : '🔄 Refresh'}
        </button>
      </div>

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      {/* Add Expense Button Card */}
      <div className="add-expense-card">
        <button onClick={handleAddNew} className="btn-add-expense">
          <span className="btn-icon">➕</span>
          <span className="btn-text">Add New Expense</span>
        </button>
      </div>

      {/* Expense Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title={editingId ? '✏️ Edit Expense' : '➕ Add New Expense'}
      >
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-form-grid">
            <div className="modal-form-field">
              <label className="modal-field-label">Date</label>
              <input
                type="date"
                className="modal-field-input"
                value={form.date}
                onChange={e => setForm({...form, date: e.target.value})}
                required
              />
            </div>
            <div className="modal-form-field">
              <label className="modal-field-label">Amount ($)</label>
              <input
                type="number"
                className="modal-field-input"
                placeholder="0.00"
                value={form.amount}
                onChange={e => setForm({...form, amount: e.target.value})}
                step="0.01"
                min="0.01"
                required
              />
            </div>
            <div className="modal-form-field">
              <label className="modal-field-label">Category</label>
              <select
                className="modal-field-input"
                value={form.category}
                onChange={e => setForm({...form, category: e.target.value})}
              >
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="modal-form-field">
              <label className="modal-field-label">Payment Method</label>
              <select
                className="modal-field-input"
                value={form.paymentMethod}
                onChange={e => setForm({...form, paymentMethod: e.target.value})}
              >
                {PAYMENT_METHODS.map(method => <option key={method} value={method}>{method}</option>)}
              </select>
            </div>
            <div className="modal-form-field modal-form-field-wide">
              <label className="modal-field-label">Description</label>
              <input
                type="text"
                className="modal-field-input"
                placeholder="What was this for?"
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
              />
            </div>
          </div>
          <div className="modal-form-buttons">
            <button
              type="submit"
              className={`btn-modal-submit ${editingId ? 'btn-modal-update' : ''}`}
              disabled={actionLoading.create || actionLoading.update}
            >
              {actionLoading.create || actionLoading.update
                ? '⏳ Syncing...'
                : (editingId ? '💾 Update Expense' : '➕ Add Expense')}
            </button>
            <button type="button" onClick={handleModalClose} className="btn-modal-cancel-outline">
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={closeDeleteModal}
        onConfirm={() => handleDelete(deleteConfirm.id)}
        title="Delete Expense"
        message="Are you sure you want to delete this expense? This action cannot be undone."
        confirmText="🗑️ Delete"
        cancelText="Cancel"
        type="danger"
      />

      <div className="controls-card">
        <div className="filter-group">
          <label>Filter by Category:</label>
          <select value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="All">All Categories</option>
            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        <div className="summary-badge">
          <span>Total:</span> 
          <strong>${totalAmount.toFixed(2)}</strong>
          <span className="count-badge">({filteredExpenses.length} items)</span>
        </div>
      </div>

      <div className="expense-grouped-list">
        {filteredExpenses.length === 0 ? (
          <div className="empty-state">
            {expenses.length === 0 
              ? 'No expenses found. Start tracking your spending! 📝' 
              : 'No expenses match this filter.'}
          </div>
        ) : (
          Object.entries(
            filteredExpenses.reduce((groups, expense) => {
              const dateKey = expense.date || 'No date';
              if (!groups[dateKey]) groups[dateKey] = [];
              groups[dateKey].push(expense);
              return groups;
            }, {})
          )
            .sort(([dateA], [dateB]) => {
              try {
                const [yearA, monthA, dayA] = dateA.split('-').map(Number);
                const [yearB, monthB, dayB] = dateB.split('-').map(Number);
                const dateObjA = new Date(yearA, (monthA || 1) - 1, dayA || 1);
                const dateObjB = new Date(yearB, (monthB || 1) - 1, dayB || 1);
                return dateObjB - dateObjA;
              } catch {
                return 0;
              }
            })
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
                    <div key={exp.id} className="expense-item-grouped">
                      <div className="expense-item-info">
                        <div className="expense-item-top">
                          <span className="expense-category">{exp.category}</span>
                          {exp.paymentMethod && (
                            <span className="payment-badge">{exp.paymentMethod}</span>
                          )}
                        </div>
                        {exp.description && <span className="expense-desc">"{exp.description}"</span>}
                      </div>
                      <div className="expense-item-actions">
                        <span className="expense-amount">${(exp.amount || 0).toFixed(2)}</span>
                        <button onClick={() => handleEdit(exp)} className="btn-edit" title="Edit">✏️</button>
                        <button
                          onClick={() => openDeleteModal(exp.id)}
                          className="btn-delete"
                          disabled={actionLoading[`delete-${exp.id}`]}
                          title="Delete"
                        >
                          {actionLoading[`delete-${exp.id}`] ? '⏳' : '🗑️'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
