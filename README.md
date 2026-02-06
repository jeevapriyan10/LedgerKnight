# Ledger Knight

> **Institutional Financial Management Platform with Blockchain Integration**

A secure, role-based financial management system for institutions with Ethereum wallet integration, transaction approval workflows, and real-time analytics.

## Features

- **Secure Authentication**: JWT-based authentication with role-based access control (Auditor & Associate)
- **Blockchain Integration**: Automated Ethereum wallet generation and on-chain transaction execution
- **Transaction Management**: Approval workflow where Associates create and Auditors approve transactions
- **Analytics Dashboard**: Real-time transaction insights and financial reporting
- **Modern UI**: Professional dark theme with responsive design

## Tech Stack

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- ethers.js (Ethereum blockchain)
- JSON Web Tokens (JWT)
- Security: Helmet, CORS, Rate Limiting

**Frontend:**
- React 18 + Vite
- Axios for API communication
- Lucide React icons
- Vanilla CSS (modern design system)

## Project Structure

```
Lknight/
├── backend/              # Express API server
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API endpoints
│   ├── services/        # Business logic (database, crypto, blockchain)
│   ├── middleware/      # Auth & validation
│   └── index.js         # Server entry point
│
├── frontend/            # React application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── styles/      # CSS files
│   │   ├── App.jsx      # Main app
│   │   └── main.jsx     # Entry point
│   └── index.html
│
└── README.md

```

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- MongoDB (local or Atlas)
- npm >= 9.0.0

### Installation

1. **Backend Setup**

```bash
cd backend
npm install

# Create .env file
copy .env.example .env
# Edit .env with your MongoDB URI, JWT secret, and RPC provider
```

2. **Frontend Setup**

```bash
cd frontend
npm install

# Create .env file (optional, defaults to localhost:4000)
copy .env.example .env
```

### Running Locally

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Server runs on http://localhost:4000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# App runs on http://localhost:5173
```

### Environment Variables

**Backend (.env):**
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
ENCRYPTION_KEY=your_64_char_hex_key
RPC_PROVIDER_URL=https://ethereum-sepolia-rpc.publicnode.com
PORT=4000
CORS_ORIGIN=http://localhost:5173
```

**Frontend (.env):**
```env
VITE_BACKEND_URL=http://localhost:4000
```

## Usage Guide

### 1. Register Institution

- Navigate to the app and click "Get Started"
- Click "Register" tab
- Fill in:
  - Institution Name
  - Location
  - Auditor Password
- Save the generated **Institution ID** and **Wallet Address**

### 2. Login as Auditor

- Select "Auditor" tab
- Enter Institution ID and Password
- Access full admin dashboard

### 3. Create Associates

- In Auditor Dashboard, go to "Manage Associates" tab
- Click "Add Associate"
- Set password for associate
- Confirm with auditor password
- Save the generated Employee ID

### 4. Manage Transactions

**As Associate:**
- Login with Institution ID, Employee ID, and password
- Click "New Transaction"
- Fill form:
  - Receiver Address (Ethereum address)
  - Amount (in ETH)
  - Purpose
  - Priority and Deadline
- Submit for approval

**As Auditor:**
- Go to "Review Transactions" tab
- Review pending transactions
- Click "Review" on any transaction
- Add comment (optional)
- Enter auditor password
- Click "Approve", "Decline", or "Needs Review"

### 5. View Analytics

- As Auditor, navigate to "Analytics" tab
- View transaction statistics:
  - Total transactions
  - Status breakdown
  - Total approved amount
  - Average transaction value

## API Endpoints

### Authentication
- `POST /auth/register` - Register new institution
- `POST /auth/login-auditor` - Auditor login
- `POST /auth/login-associate` - Associate login
- `POST /auth/create-associate` - Create new associate (auditor only)
- `DELETE /auth/delete-associate` - Remove associate (auditor only)

### Transactions
- `POST /transactions` - Create transaction (associate only)
- `GET /transactions` - List all transactions (authenticated)
- `POST /transactions/:txId/review` - Review transaction (auditor only)

### Analytics
- `GET /analytics` - Transaction statistics (authenticated)

### Institutions
- `GET /institutions/:id` - Get institution details
- `GET /institutions/:id/balance` - Get wallet balance

## Deployment

See `DEPLOYMENT.md` for detailed deployment instructions for:
- Local testing with MongoDB
- Vercel deployment guide
- Environment configuration

## Security Features

- JWT authentication with 24-hour expiration
- Password-protected operations
- Ethereum wallet private key encryption
- Rate limiting (100 requests/minute)
- CORS protection
- Helmet security headers
- Input validation with Zod

## License

MIT License - see LICENSE file

## Author

Built by jeevapriyan10

---

**Note**: This is a development version. For production:
- Add password hashing (bcrypt)
- Use production MongoDB Atlas cluster
- Set strong JWT secrets
- Enable HTTPS
- Configure proper CORS origins
