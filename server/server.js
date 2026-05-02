const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Connected Successfully'))
.catch((err) => console.error('❌ MongoDB Connection Error:', err));

// ==================== Mongoose Models ====================

// Expense Schema
const expenseSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['Food', 'Travel', 'Things', 'Entertainment', 'Bills', 'Health', 'Others'],
    default: 'Others'
  },
  description: {
    type: String,
    default: ''
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'G-Pay', 'Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Others'],
    default: 'Cash'
  }
}, {
  timestamps: true
});

const Expense = mongoose.model('Expense', expenseSchema);

// Income Schema
const incomeSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  source: {
    type: String,
    default: 'Income'
  },
  description: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const Income = mongoose.model('Income', incomeSchema);

// Budget Schema
const budgetSchema = new mongoose.Schema({
  month: {
    type: String,
    required: true,
    unique: true // e.g., "2026-04"
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

const Budget = mongoose.model('Budget', budgetSchema);

// ==================== Routes ====================

// GET all expenses
app.get('/api/expenses', async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 });
    res.json({
      success: true,
      data: expenses,
      count: expenses.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// POST create expense
app.post('/api/expenses', async (req, res) => {
  try {
    const { date, amount, category, description, paymentMethod } = req.body;
    
    const expense = new Expense({
      date,
      amount,
      category,
      description: description || '',
      paymentMethod: paymentMethod || 'Cash'
    });

    await expense.save();

    res.status(201).json({
      success: true,
      data: expense,
      message: 'Expense created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Validation error',
      error: error.message
    });
  }
});

// PUT update expense
app.put('/api/expenses/:id', async (req, res) => {
  try {
    const { date, amount, category, description, paymentMethod } = req.body;
    
    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      { date, amount, category, description, paymentMethod },
      { new: true, runValidators: true }
    );

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    res.json({
      success: true,
      data: expense,
      message: 'Expense updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Validation error',
      error: error.message
    });
  }
});

// DELETE expense
app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// GET all incomes
app.get('/api/incomes', async (req, res) => {
  try {
    const incomes = await Income.find().sort({ date: -1 });
    res.json({
      success: true,
      data: incomes,
      count: incomes.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// POST create income
app.post('/api/incomes', async (req, res) => {
  try {
    const { date, amount, source, description } = req.body;

    const income = new Income({
      date,
      amount,
      source: source || 'Income',
      description: description || ''
    });

    await income.save();

    res.status(201).json({
      success: true,
      data: income,
      message: 'Income created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Validation error',
      error: error.message
    });
  }
});

// DELETE income
app.delete('/api/incomes/:id', async (req, res) => {
  try {
    const income = await Income.findByIdAndDelete(req.params.id);

    if (!income) {
      return res.status(404).json({
        success: false,
        message: 'Income not found'
      });
    }

    res.json({
      success: true,
      message: 'Income deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// GET all budgets
app.get('/api/budgets', async (req, res) => {
  try {
    const budgets = await Budget.find();
    res.json({
      success: true,
      data: budgets
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// POST/PUT create or update budget
app.post('/api/budgets', async (req, res) => {
  try {
    const { month, amount } = req.body;

    const budget = await Budget.findOneAndUpdate(
      { month },
      { month, amount },
      { upsert: true, new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: budget,
      message: 'Budget saved successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Validation error',
      error: error.message
    });
  }
});

// DELETE budget
app.delete('/api/budgets/:month', async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({ month: req.params.month });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    res.json({
      success: true,
      message: 'Budget deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Health check
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Expense Tracker API is running',
    version: '1.0.0'
  });
});

// ==================== Start Server ====================

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 API: http://localhost:${PORT}/api`);
});

module.exports = app;
