# 💸 Expense Tracker - Multi-Page Web Application

A production-ready, multi-page expense tracking web application built with React, Vite, and Google Sheets API for cloud synchronization.

## 🌟 Features

- **Multi-Page Architecture**: Dashboard, Expense Tracker, and History pages
- **Cloud Sync**: Google Sheets integration for data persistence
- **Budget Tracking**: Set and monitor monthly budgets
- **Category-wise Analysis**: Track expenses by category with visual charts
- **Monthly History**: View and analyze expenses by month
- **Responsive Design**: Mobile-first, production-ready UI
- **Dark Theme**: Modern dark UI with smooth animations

## 📄 Pages

### 1. **Dashboard** (`/`)
- Overview of total expenses, monthly spending, and budget status
- Visual charts showing category breakdown (Pie & Bar charts)
- Recent transactions list
- Budget progress indicator

### 2. **Expense Tracker** (`/tracker`)
- Add, edit, and delete expenses
- Filter expenses by category
- Grouped expense list by date
- Real-time total calculations
- CRUD operations with cloud sync

### 3. **History** (`/history`)
- Monthly expense history view
- Spending trend analysis with line charts
- Category breakdown for selected months
- Monthly overview cards
- Daily average calculations

## 🏗️ Project Structure

```
expense-tracker/
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── components/
│   │   ├── Header.jsx          # Navigation header
│   │   └── Footer.jsx          # Site footer
│   ├── context/
│   │   └── ExpenseContext.jsx  # Global state management
│   ├── pages/
│   │   ├── Dashboard.jsx       # Dashboard page
│   │   ├── ExpenseTracker.jsx  # Expense CRUD page
│   │   └── History.jsx         # Monthly history page
│   ├── App.jsx                 # Main app with routing
│   ├── App.css                 # Component styles
│   ├── index.css               # Global styles
│   └── main.jsx                # Entry point
├── package.json
├── vite.config.js
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd expense-tracker
```

2. Install dependencies:
```bash
npm install
```

3. **Configure Environment Variables:**
```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your Google Apps Script URL
# See API_SETUP.md for detailed instructions
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

### Environment Setup

**⚠️ IMPORTANT:** You must configure your Google Sheets API before the app works!

- 📖 **Quick Setup**: See [API_SETUP.md](API_SETUP.md)
- 🔧 **Environment Config**: See [ENV_CONFIG.md](ENV_CONFIG.md)

```bash
# Your .env file should look like:
VITE_API_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

### Build for Production

```bash
npm run build
```

The production-ready files will be in the `dist/` folder.

### Preview Production Build

```bash
npm run preview
```

## 🛠️ Technologies Used

- **React 19**: UI library
- **React Router DOM**: Page routing
- **Recharts**: Data visualization
- **Vite**: Build tool and dev server
- **Google Sheets API**: Cloud data synchronization
- **CSS3**: Styling with CSS variables and modern features

## 📊 API Configuration

The application uses Google Sheets API for cloud synchronization. The API endpoint is configured in:
```
src/context/ExpenseContext.jsx
```

To use your own Google Sheets API, update the `API_URL` constant.

## 🎨 Styling

The application uses CSS variables for theming located in `src/App.css`:

```css
:root {
  --bg: #0f172a;
  --primary: #3b82f6;
  --success: #10b981;
  --warning: #f59e0b;
  --danger: #ef4444;
  /* ... more variables */
}
```

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (< 768px)

## 🔄 State Management

Global state is managed using React Context API:
- `ExpenseContext` provides expense data and CRUD operations
- Local state for UI elements (filters, editing state, etc.)
- LocalStorage for budget settings persistence

## 📈 Charts & Visualizations

- **Pie Chart**: Category-wise expense distribution
- **Bar Chart**: Category comparison
- **Line Chart**: Monthly spending trends

## 🎯 Future Enhancements

- Export expenses to CSV/Excel
- Multi-currency support
- Recurring expense tracking
- Expense predictions with AI
- Push notifications for budget alerts
- Dark/Light theme toggle

## 📝 License

MIT License - Feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues, questions, or contributions, please open an issue on GitHub.

---

**Built with ❤️ using React & Vite**
