const db = require('../config/db'); // Import the DB connection/pool
const { TABLES, CURRENT_DB_TYPE, DB_TYPES } = require('../config/constant'); // 👈 Fixed Import

class LedgerService {
    async transferFunds(transactionId, fromAccountId, toAccountId, amount, description) {
        
        let connection;
        let isMySQL = (CURRENT_DB_TYPE === DB_TYPES.MYSQL);

        // 1. Get Connection (Handle difference between MySQL Pool and SQLite DB)
        if (isMySQL) {
            connection = await db.getConnection(); // MySQL Pool needs this
        } else {
            connection = await db; // SQLite/Postgres usually export the client directly
        }

        try {
            // 2. Start Transaction
            if (isMySQL) {
                await connection.beginTransaction();
            } else {
                await connection.run('BEGIN TRANSACTION'); // SQLite syntax
            }

            // --- QUERY ADAPTER (Helper to handle syntax differences) ---
            const query = async (sql, params) => {
                if (isMySQL) return connection.execute(sql, params);
                // SQLite uses 'get' for selects, 'run' for updates. This is a simplified adapter.
                if (sql.trim().toUpperCase().startsWith('SELECT')) {
                    const result = await connection.all(sql.replace(/\?/g, '?'), params); // SQLite uses ? too
                    return [result]; // Return as array to match MySQL format
                }
                return connection.run(sql, params);
            };
            // -----------------------------------------------------------

            // 3. Idempotency Check
            const [existing] = await query(
                `SELECT id FROM ${TABLES.LEDGER} WHERE transaction_id = ?`, 
                [transactionId]
            );
            if (existing && existing.length > 0) {
                if(isMySQL) await connection.rollback();
                else await connection.run('ROLLBACK');
                return { status: 'idempotent', message: 'Transaction already processed' };
            }

            // 4. Deadlock Avoidance & Locking
            // Note: SQLite is single-file locked, so explicit row locking (FOR UPDATE) 
            // isn't supported/needed the same way, but we keep logic for MySQL.
            if (isMySQL) {
                const firstLock = fromAccountId < toAccountId ? fromAccountId : toAccountId;
                const secondLock = fromAccountId < toAccountId ? toAccountId : fromAccountId;
                await connection.execute(`SELECT balance FROM ${TABLES.ACCOUNTS} WHERE id = ? FOR UPDATE`, [firstLock]);
                await connection.execute(`SELECT balance FROM ${TABLES.ACCOUNTS} WHERE id = ? FOR UPDATE`, [secondLock]);
            }

            // 5. Balance Check
            const [senderRows] = await query(`SELECT balance FROM ${TABLES.ACCOUNTS} WHERE id = ?`, [fromAccountId]);
            const senderBalance = parseFloat(senderRows[0].balance);

            if (senderBalance < amount) {
                throw new Error('Insufficient funds');
            }

            // 6. Update Balances
            await query(`UPDATE ${TABLES.ACCOUNTS} SET balance = balance - ? WHERE id = ?`, [amount, fromAccountId]);
            await query(`UPDATE ${TABLES.ACCOUNTS} SET balance = balance + ? WHERE id = ?`, [amount, toAccountId]);

            // 7. Record Ledger Entry
            await query(
                `INSERT INTO ${TABLES.LEDGER} (transaction_id, debit_account_id, credit_account_id, amount, description) VALUES (?, ?, ?, ?, ?)`,
                [transactionId, fromAccountId, toAccountId, amount, description]
            );

            // 8. Commit
            if (isMySQL) await connection.commit();
            else await connection.run('COMMIT');
            
            return { status: 'success', balance: senderBalance - amount };

        } catch (error) {
            if (connection) {
                if (isMySQL) await connection.rollback();
                else await connection.run('ROLLBACK');
            }
            throw error;
        } finally {
            if (isMySQL && connection) connection.release(); // Only MySQL pools need release
        }
    }

    async getBalance(accountId) {
        let isMySQL = (CURRENT_DB_TYPE === DB_TYPES.MYSQL);
        let connection = isMySQL ? await db : await db; // Direct access for single queries

        if(isMySQL) {
             const [rows] = await connection.execute(`SELECT balance, name FROM ${TABLES.ACCOUNTS} WHERE id = ?`, [accountId]);
             return rows[0];
        } else {
             // SQLite
             const rows = await connection.get(`SELECT balance, name FROM ${TABLES.ACCOUNTS} WHERE id = ?`, [accountId]);
             return rows;
        }
    }
}

module.exports = new LedgerService();