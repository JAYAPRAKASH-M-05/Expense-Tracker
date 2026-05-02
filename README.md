# 💸 Expense Tracker - MongoDB Edition

A modern, full-stack expense tracking application built with **React**, **Express**, **MongoDB**, and **Vite**.

## 🌟 Features

### 💰 Expense Management
- ✅ Add, edit, and delete expenses
- ✅ Categorize expenses (Food, Travel, Bills, etc.)
- ✅ Track payment methods (Cash, G-Pay, Credit Card, etc.)
- ✅ Date-based expense grouping
- ✅ Filter by category

### 🎯 Budget Tracking
- ✅ Set monthly budgets
- ✅ Visual progress bars
- ✅ Smart alerts (80% warning, over-budget alerts)
- ✅ Month-by-month budget tracking

### 📊 Analytics & Reports
- ✅ Dashboard with overview statistics
- ✅ Pie charts for category breakdown
- ✅ Bar charts for spending comparison
- ✅ Line charts for spending trends
- ✅ Monthly history view

### 💾 Cloud Storage with MongoDB
- ✅ Fast and reliable data storage
- ✅ RESTful API architecture
- ✅ Real-time data synchronization
- ✅ No storage limits (unlike Google Sheets)

---

## 🏗️ Tech Stack

### Frontend
- **React 19** - UI library
- **React Router DOM** - Page routing
- **Recharts** - Data visualization
- **Vite** - Build tool
- **CSS3** - Modern styling with CSS variables

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **CORS** - Cross-origin resource sharing

---

## 📁 Project Structure

```
Expense-Tracker/
├── server/                      # Backend Server
│   ├── server.js               # Main server with API routes
│   ├── .env                    # Environment variables
│   ├── .env.example            # Template for env vars
│   ├── .gitignore              # Git ignore rules
│   └── package.json            # Backend dependencies
│
├── expense-tracker/            # Frontend Application
│   ├── src/
│   │   ├── components/        # Reusable components (Header, Footer)
│   │   ├── context/           # Global state management
│   │   ├── pages/             # Page components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ExpenseTracker.jsx
│   │   │   └── History.jsx
│   │   ├── constants.js       # Shared constants
│   │   ├── App.jsx            # Main app with routing
│   │   ├── App.css            # Component styles
│   │   └── main.jsx           # Entry point
│   ├── .env                   # Frontend environment
│   ├── .env.example           # Template
│   └── package.json           # Frontend dependencies
│
├── MONGODB_SETUP.md          # Detailed MongoDB setup guide
├── QUICKSTART.md             # Quick start guide
└── README.md                 # This file
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)

### Option 1: Quick Setup (5 Minutes)

**1. Install MongoDB**
- Local: Download from https://www.mongodb.com/try/download/community
- Cloud: Sign up at https://www.mongodb.com/cloud/atlas (FREE)

**2. Start Backend**
```bash
cd server
npm install
npm run dev
```

**3. Start Frontend**
```bash
cd expense-tracker
npm install
npm run dev
```

**4. Open Browser**
```
http://localhost:5173
```

### Option 2: Detailed Setup

📖 See **MONGODB_SETUP.md** for complete instructions

---

## 🔑 Environment Variables

### Backend (`/server/.env`)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/expense-tracker
```

### Frontend (`/expense-tracker/.env`)
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 📡 API Endpoints

### Expenses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/expenses` | Get all expenses |
| POST | `/api/expenses` | Create expense |
| PUT | `/api/expenses/:id` | Update expense |
| DELETE | `/api/expenses/:id` | Delete expense |

### Budgets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/budgets` | Get all budgets |
| POST | `/api/budgets` | Create/Update budget |
| DELETE | `/api/budgets/:month` | Delete budget |

### Health Check
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api` | API status |

---

## 📊 Database Schema

### Expense Document
```javascript
{
  _id: ObjectId("..."),
  date: "2026-04-12",
  amount: 25.50,
  category: "Food",
  description: "Lunch at restaurant",
  paymentMethod: "G-Pay",
  createdAt: ISODate("2026-04-12T10:30:00Z"),
  updatedAt: ISODate("2026-04-12T10:30:00Z")
}
```

### Budget Document
```javascript
{
  _id: ObjectId("..."),
  month: "2026-04",
  amount: 1000,
  createdAt: ISODate("2026-04-01T00:00:00Z"),
  updatedAt: ISODate("2026-04-01T00:00:00Z")
}
```

---

## 🎯 Pages

### 1. Dashboard (`/`)
- Overview statistics cards
- Budget management
- Category charts (Pie & Bar)
- Recent transactions table

### 2. Expense Tracker (`/tracker`)
- Add/Edit expense form
- Payment method selection
- Category filtering
- Date-grouped expense list

### 3. History (`/history`)
- Monthly expense history
- Month selector
- Spending trend line chart
- Monthly overview cards

---

## 🎨 Features in Detail

### Payment Methods
- 💵 Cash
- 📱 G-Pay
- 💳 Credit Card
- 🏧 Debit Card
- 🔗 UPI
- 🏦 Net Banking
- 📝 Others

### Expense Categories
- 🍔 Food
- ✈️ Travel
- 🛍️ Things
- 🎬 Entertainment
- 📄 Bills
- 🏥 Health
- 📝 Others

---

## 🧪 Testing

### Test Backend
```bash
# Health check
curl http://localhost:5000/api

# Create expense
curl -X POST http://localhost:5000/api/expenses \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-04-12",
    "amount": 25.50,
    "category": "Food",
    "description": "Lunch",
    "paymentMethod": "G-Pay"
  }'
```

### Test Frontend
1. Open http://localhost:5173
2. Add a new expense
3. Check if it appears in the list
4. Verify in MongoDB Compass

---

## 🚀 Deployment

### Backend (Choose one)
- **Render** (Free): https://render.com
- **Railway** (Free): https://railway.app
- **Heroku**: https://heroku.com
- **DigitalOcean**: https://digitalocean.com

### Frontend (Choose one)
- **Vercel**: https://vercel.com
- **Netlify**: https://netlify.com
- **GitHub Pages**

### Environment Variables for Production

**Backend:**
```env
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/expense-tracker
```

**Frontend:**
```env
VITE_API_URL=https://your-backend-url.com/api
```

---

## 🔒 Security

- ✅ Environment variables for sensitive data
- ✅ CORS configured for frontend domain
- ✅ MongoDB authentication
- ✅ Input validation with Mongoose
- ✅ No hardcoded credentials

---

## 📚 Documentation

- **Quick Start:** `QUICKSTART.md`
- **MongoDB Setup:** `MONGODB_SETUP.md`
- **API Reference:** `/server/server.js`
- **Frontend Context:** `/expense-tracker/src/context/ExpenseContext.jsx`

---

## 🐛 Troubleshooting

### MongoDB Connection Failed
1. Check MongoDB is running
2. Verify `MONGODB_URI` in `/server/.env`
3. For Atlas: Check credentials and IP whitelist

### Can't Connect to API
1. Backend must be running on port 5000
2. Check `VITE_API_URL` in frontend `.env`
3. Restart dev server after `.env` changes

### Module Not Found
```bash
cd server
npm install
```

📖 **Full troubleshooting guide:** `MONGODB_SETUP.md`

---

## 📝 License

MIT License - Feel free to use for personal or commercial projects.

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📧 Support

For issues or questions:
- Check `MONGODB_SETUP.md`
- Check `QUICKSTART.md`
- Open an issue on GitHub

---

## 🎉 Ready to Start?

```bash
# Terminal 1 - Backend
cd server
npm install
npm run dev

# Terminal 2 - Frontend
cd expense-tracker
npm install
npm run dev

# Open browser
http://localhost:5173
```

**Happy Expense Tracking! 🚀**
