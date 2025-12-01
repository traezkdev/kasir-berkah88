# Kasir Berkah 88

A modern web-based Point of Sale (POS) and inventory management system built with React for the frontend and Node.js/Express.js for the backend. Designed to help small to medium businesses efficiently manage sales, inventory, raw materials, and staff with robust role-based access control.

## 🚀 Features

### Frontend & Core Technologies
-   **React 18** - Modern JavaScript library for building user interfaces.
-   **Vite** - Lightning-fast build tool and development server.
-   **Redux Toolkit** - State management with simplified Redux setup.
-   **TailwindCSS** - Utility-first CSS framework for rapid UI development and responsive design.
-   **React Router v6** - Declarative routing for React applications.
-   **Data Visualization** - Integrated D3.js and Recharts for powerful data visualization (where applicable).
-   **Form Management** - React Hook Form for efficient form handling.
-   **Animation** - Framer Motion for smooth UI animations (where applicable).
-   **Authentication (JWT)** - Secure user login and session management.

### Key Application Features

-   **Role-Based Access Control (RBAC):**
    -   **Admin:** Full access to all features, settings, user management, and sensitive data operations.
    -   **Owner:** Access to financial reports, raw material management, and dashboard insights.
    -   **Kasir (Cashier):** Primarily for processing sales transactions.
    -   **User:** Limited access, typically for basic operations.
    -   **Guest:** Very limited view access.
-   **Main Dashboard (`/`):**
    -   Overview of key business metrics (revenue, expenses, net profit, stock value).
    -   Quick action buttons for common tasks (e.g., new transaction, manage menu).
    -   **Read-only Data Synchronization Status:** Displays the last updated time for Menu Stock, Raw Materials Stock, and Lapak Funds.
-   **Menu Management:**
    -   CRUD (Create, Read, Update, Delete) operations for menu items.
    -   Manage item prices, stock levels, categories, HPP (Cost of Goods Sold), discounts, and featured status.
-   **Raw Material Stock Management (`/raw-material-stock`):**
    -   Comprehensive CRUD operations for raw materials.
    -   Track `current_stock` (stok fisik), `menu_stock` (stok bahan yang sudah diolah/siap jual), `stok_minimum`, `suggestion_purchase_quantity`, `price_per_item`, and `custom_unit`.
    -   **Combined Stock Logic:** Critically determines stock status based on `(current_stock + menu_stock)`.
    -   Features for recording stock-in and stock-out movements.
-   **Critical Stock View (`/main-critical-stock`):**
    -   Dedicated page to list raw materials whose combined stock (`current_stock + menu_stock`) falls below the `stok_minimum`.
    -   Detailed notifications indicating the deficit (e.g., "Stok menipis, kurang X dari standar").
    -   Provides suggested purchase quantities for critical items.
-   **Transaction Management:**
    -   Process new sales transactions efficiently.
    -   View transaction history, including soft-deleted (trashed) transactions.
    -   Support for manual discounts and employee meals.
-   **Expense Tracking:**
    -   Record and manage business expenses by category.
    -   View historical expenses.
-   **Account Management:**
    -   Manage "Owner Deposit" and "Lapak Deposit" accounts for financial tracking.
    -   Record deposits and expenses for each account.
-   **Settings (`/settings`):**
    -   General application settings (website title, logo, description, registration).
    -   User and Employee Management (Admin only).
    -   Master password management for sensitive operations.
    -   **Data Synchronization Modal:** A dedicated modal to manually trigger specific data synchronizations for Menu Stock, Raw Materials, and Lapak Funds, each updating its own timestamp.

### Backend (API)
-   **Node.js with Express.js** - Robust and scalable server-side framework.
-   **MySQL Database** - Relational database for storing all application data.
-   **`rawMaterialsDb.js`** - Centralized module for managing raw material database operations, ensuring data integrity and business logic.
-   **`database.js`** - Manages database connection and automatic schema migrations/updates on server startup.
-   **JWT for API Security** - Protects API endpoints with token-based authentication.

## 📋 Prerequisites

-   Node.js (v14.x or higher)
-   npm or yarn
-   MySQL Server (local or remote access)

## 🛠️ Installation

1.  **Clone the repository:**
    ```bash
    git clone [repository-url]
    cd kasir-berkah88
    ```

2.  **Backend Setup:**
    ```bash
    cd backend
    npm install
    # Create a .env file based on .env.example with your MySQL credentials and JWT_SECRET
    # Example .env content:
    # DB_HOST=localhost
    # DB_USER=root
    # DB_PASSWORD=your_password
    # DB_DATABASE=kasir_berkah88
    # JWT_SECRET=supersecretjwtkey
    # VITE_API_URL=http://localhost:4000 (or your deployed backend URL)
    npm start # Or use `node server.js`
    # The database tables will be automatically created/updated on first run.
    ```

3.  **Frontend Setup:**
    ```bash
    cd .. # Go back to the root directory
    npm install
    # Create a .env file based on .env.example with your backend API URL
    # Example .env content:
    # VITE_API_URL=http://localhost:4000
    npm run dev
    ```

4.  **Access the Application:**
    Open your browser and navigate to `http://localhost:5173` (or the address provided by Vite).

## 📁 Project Structure

```
kasir-berkah88/
├── public/                 # Static assets for frontend
├── src/                    # Frontend source code
│   ├── components/         # Reusable UI components
│   ├── pages/              # Page components (e.g., MainDashboard, RawMaterialStock)
│   ├── styles/             # Global styles and Tailwind configuration
│   ├── utils/              # Utility functions (authFetch.js, etc.)
│   ├── App.jsx             # Main application component
│   ├── Routes.jsx          # Application routes configuration
│   └── index.jsx           # Application entry point
├── backend/                # Backend source code
│   ├── database.js         # MySQL connection and schema management
│   ├── rawMaterialsDb.js   # Raw material specific database functions
│   ├── server.js           # Main Express.js server and API routes
│   └── .env                # Backend environment variables
├── .env                    # Frontend environment variables
├── index.html              # Frontend HTML template
├── package.json            # Project dependencies and scripts (frontend)
├── tailwind.config.js      # Tailwind CSS configuration
└── vite.config.js          # Vite configuration
```

## 🎨 Styling

This project uses Tailwind CSS for styling. The configuration includes:
-   Forms plugin for form styling.
-   Typography plugin for text styling.
-   Aspect ratio plugin for responsive elements.
-   Container queries for component-specific responsive design.
-   Fluid typography for responsive text.
-   Animation utilities.

The app is built with responsive design using Tailwind CSS breakpoints.

## 📦 Deployment

Build the frontend application for production:

```bash
npm run build
```
Deploy the `dist` folder to your static hosting. The `backend` folder should be deployed separately to a Node.js server environment.
