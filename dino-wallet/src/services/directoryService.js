const db = require('../config/db');
const { TABLES, CURRENT_DB_TYPE, DB_TYPES } = require('../config/constant');

class DirectoryService {
    
    // --- PRIVATE HELPER: Reuse logic for fetching Users + Accounts ---
    async _getUsersWithAccounts(whereClause, limit = null) {
        let isMySQL = (CURRENT_DB_TYPE === DB_TYPES.MYSQL);
        let connection = isMySQL ? await db : await db;

        // 1. Fetch Users
        const userSql = `
            SELECT id, username, user_email 
            FROM ${TABLES.USERS} 
            WHERE is_deleted = 0 ${whereClause}
            ${limit ? `LIMIT ${limit}` : ''}
        `;
        
        let users;
        if (isMySQL) {
            const [rows] = await connection.execute(userSql);
            users = rows;
        } else {
            users = await connection.all(userSql);
        }

        if (!users || users.length === 0) return [];

        // 2. Fetch Accounts
        const userIds = users.map(u => `'${u.id}'`).join(',');
        const accountSql = `
            SELECT id, user_id, name, balance, asset_id 
            FROM ${TABLES.ACCOUNTS} 
            WHERE user_id IN (${userIds}) AND is_deleted = 0
        `;

        let accounts;
        if (isMySQL) {
            const [rows] = await connection.execute(accountSql);
            accounts = rows;
        } else {
            accounts = await connection.all(accountSql);
        }

        // 3. Merge
        return users.map(user => {
            const userAccounts = accounts.filter(acc => acc.user_id === user.id);
            return {
                user_name: user.username,
                email_id: user.user_email,
                userid: user.id,
                accounts: userAccounts.map(acc => ({
                    account_id: acc.id,
                    name: acc.name, // e.g., "Rupesh Gold Wallet"
                    balance: parseFloat(acc.balance),
                    path: `api/v1/wallet/balance/${acc.id}`
                }))
            };
        });
    }

    // --- PUBLIC METHODS ---

    // 1. Get Directory (Last 10)
    async getLastTenUsers() {
        try {
            return await this._getUsersWithAccounts('ORDER BY created_at DESC', 10);
        } catch (error) {
            console.error("Directory Error:", error);
            throw new Error('Failed to fetch directory');
        }
    }

    // 2. Get Single User Details + Ledger History
    async getUserDetails(userId) {
        let isMySQL = (CURRENT_DB_TYPE === DB_TYPES.MYSQL);
        let connection = isMySQL ? await db : await db;

        try {
            // A. Reuse helper to get basic info + accounts
            // Note: We check user-id specifically here
            const users = await this._getUsersWithAccounts(`AND id = '${userId}'`, 1);
            
            if (users.length === 0) return null; // User not found
            
            const userProfile = users[0];

            // B. Fetch Last 5 Transactions for ALL user accounts
            const accountIds = userProfile.accounts.map(a => `'${a.account_id}'`).join(',');
            
            if (accountIds) {
                const historySql = `
                    SELECT id, transaction_id, amount, description, created_at, asset_name_snapshot, debit_account_id, credit_account_id
                    FROM ${TABLES.LEDGER}
                    WHERE (debit_account_id IN (${accountIds}) OR credit_account_id IN (${accountIds}))
                    ORDER BY created_at DESC
                    LIMIT 5
                `;

                let history;
                if (isMySQL) {
                    const [rows] = await connection.execute(historySql);
                    history = rows;
                } else {
                    history = await connection.all(historySql);
                }

                // Attach history to the profile
                userProfile.recent_history = history.map(h => ({
                    tx_id: h.transaction_id,
                    desc: h.description,
                    amount: parseFloat(h.amount),
                    asset: h.asset_name_snapshot,
                    date: h.created_at,
                    type: accountIds.includes(`'${h.credit_account_id}'`) ? 'CREDIT (IN)' : 'DEBIT (OUT)'
                }));
            } else {
                userProfile.recent_history = [];
            }

            // C. Add Custom Message as requested
            userProfile.message = `This is coming from user-id: ${userProfile.userid} wallet details`;

            return userProfile;

        } catch (error) {
            console.error("User Detail Error:", error);
            throw new Error('Failed to fetch user details');
        }
    }
}

module.exports = new DirectoryService();