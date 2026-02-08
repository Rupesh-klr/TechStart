### How to spin up the database and run the seed script
To start, install Docker, then run the docker-compose up command in your terminal. This automatically builds the system, starts the database, and loads all the initial sample data.

### Your choice of technology and why
I chose Node.js and SQL because they are industry standards that handle high traffic reliably. This ensures the wallet stays fast and stable even when many users connect simultaneously.

### Your strategy for handling concurrency
When multiple users try to update a wallet at the exact same moment, I use a smart locking system. This makes requests wait in a short line so they process one by one. It prevents errors like double-spending and ensures the account balance stays one hundred percent accurate and safe.

---

# 🦕 Dino Wallet Service (Backend)

> **Live Demo:** [Check Balance API](https://techstart.onrender.com/api/v1/wallet/balance/f4900436-04fb-11f1-a356-132376e61fe9)  
> **Repository:** [https://github.com/Rupesh-klr/TechStart](https://github.com/Rupesh-klr/TechStart)

A high-performance, transactional internal wallet service designed for gaming platforms and loyalty systems. It features a **Double-Entry Ledger Architecture** to ensure data integrity, **ACID compliance**, and support for **Multi-Database switching** (MySQL, SQLite, PostgreSQL, MongoDB, MSSQL).

---

## 🚀 Key Features

- **Double-Entry Ledger:** Audit-proof tracking of every credit and debit.
- **Multi-Currency Support:** Handles Gold Coins, Diamonds, Crystals, etc.
- **Concurrency Safe:** Handles high traffic with row-locking and deadlock avoidance.
- **Idempotency:** Prevents accidental double-charges using unique transaction keys.
- **Multi-DB Architecture:** Switch databases instantly using environment variables.

---

## 🛠️ Tech Stack

- **Runtime:** Node.js (Express.js)
- **Database:** MySQL (Default), SQLite (Local Dev), PostgreSQL, MongoDB, MSSQL.
- **Deployment:** Docker, Render.com
- **Architecture:** REST API, Layered Service Architecture.

---

## ⚙️ Setup & Installation

### Option 1: Docker (Recommended)

The easiest way to run the full stack (App + Database).

1.  **Clone the Repo**
    ```bash
    git clone [https://github.com/Rupesh-klr/TechStart.git](https://github.com/Rupesh-klr/TechStart.git)
    cd TechStart/dino-wallet
    ```

2.  **Create `.env` File**
    Create a `.env` file in the `dino-wallet` folder:
    ```ini
    # Database Selector
    # 0 = SQLite (Local File DB)
    # 1 = MySQL
    # 2 = PostgreSQL
    # 3 = MongoDB
    # 4 = MSSQL
    DB_TYPE=1

    # Connection Details
    DB_HOST=148.222.53.7  # Or 'mysql_db' if running local DB container
    DB_USER=your_user
    DB_PASSWORD=your_password
    DB_NAME=dino_wallet
    PORT=3000
    ```

3.  **Run with Docker Compose**
    ```bash
    docker-compose up --build
    ```
    *The app will be available at `http://localhost:3000`.*

---

### Option 2: Local Setup (Manual)

If you don't want to use Docker.

1.  **Clone & Install**
    ```bash
    git clone [https://github.com/Rupesh-klr/TechStart.git](https://github.com/Rupesh-klr/TechStart.git)
    cd TechStart/dino-wallet
    npm install
    ```

2.  **Configure Environment**
    Create a `.env` file with your database credentials.

    ```ini
    # Example for Local Testing (No setup needed)
    DB_TYPE=0 
    ```

3.  **Initialize Database**
    * **For SQLite:** Run `node scripts/seed-sqlite.js`
    * **For MySQL:** Run the SQL in `scripts/seed.sql` using Workbench or DBeaver.

4.  **Start Server**
    ```bash
    npm start
    ```

---
## 📖 API Documentation

### 1. Public Directory
Fetch the last 10 registered users and their wallet details.

* **Endpoint:** `GET /api/v1/dino-wallet/directory`
* **Live Demo:** [https://techstart.onrender.com/api/v1/dino-wallet/directory](https://techstart.onrender.com/api/v1/dino-wallet/directory)

---

### 2. Check Balance / User Profile (Polymorphic)
This endpoint is smart. You can pass a **Wallet Account ID** OR a **User ID**.
* If you pass a **Wallet ID**: It returns that specific wallet's balance.
* If you pass a **User ID**: It returns the full user profile, all their wallets, and transaction history.

* **Endpoint:** `GET /api/v1/wallet/balance/:id`
* **Example (Admin User ID):** `https://techstart.onrender.com/api/v1/wallet/balance/39bf2b49-016b-43a3-b2ad-408815d80657`

**Sample Response (User Profile Mode):**
```json
{
  "meta": {
    "success": true,
    "timestamp": "2026-02-08T17:05:04.586Z",
    "path": "/api/v1/wallet/balance/39bf2b49-016b-43a3-b2ad-408815d80657",
    "method": "GET",
    "req_id": 1,
    "server_node": "dino-node-1",
    "execution_time_ms": 730,
    "auth_status": "Authenticated"
  },
  "data": {
    "user_name": "system_admin",
    "email_id": "admin@dino.com",
    "userid": "39bf2b49-016b-43a3-b2ad-408815d80657",
    "accounts": [
      {
        "account_id": "f4900436-04fb-11f1-a356-132376e61fe9",
        "name": "Treasury - Gold",
        "balance": 1000000,
        "path": "api/v1/wallet/balance/f4900436-04fb-11f1-a356-132376e61fe9"
      },
      {
        "account_id": "f4900696-04fb-11f1-a356-132376e61fe9",
        "name": "Treasury - Diamonds",
        "balance": 1000000,
        "path": "api/v1/wallet/balance/f4900696-04fb-11f1-a356-132376e61fe9"
      }
    ],
    "recent_history": [
      {
        "tx_id": "INIT-GOLD-10b216bc-32a7-47bf-8db8-ab88b4eaa1c8",
        "desc": "Welcome Bonus",
        "amount": 500,
        "asset": "Gold Coins",
        "date": "2026-02-08T09:09:56.000Z",
        "type": "DEBIT (OUT)"
      }
    ],
    "message": "This is coming from user-id: 39bf2b49-016b-43a3-b2ad-408815d80657 wallet details",
    "redirect_message": "Redirected: '39bf2b49-016b-43a3-b2ad-408815d80657' is a User ID. Showing all associated wallets."
  }
}
```


---

## 📂 Project Structure

```text
dino-wallet/
├── src/
│   ├── config/
│   │   ├── constants.js     # Table names & DB Enums
│   │   └── db.js            # DB Connection Factory
│   ├── services/
│   │   └── ledgerService.js # Core Logic (ACID Transactions)
│   ├── controllers/         # Request Handling
│   └── routes/              # API Routes
├── scripts/
│   ├── seed.sql             # MySQL Database Setup
│   ├── seed-sqlite.js       # SQLite Database Setup
│   └── setup.sh             # Docker Helper
├── Dockerfile
├── docker-compose.yml
└── app.js