const pool = require('../config/db');
const TABLES = require('../config/tables');

class LedgerService {
    async transferFunds(transactionId, fromAccountId, toAccountId, amount, description) {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            // 1. Idempotency Check
            const [existing] = await connection.execute(
                `SELECT id FROM ${TABLES.LEDGER} WHERE transaction_id = ?`, 
                [transactionId]
            );
            if (existing.length > 0) {
                await connection.rollback();
                return { status: 'idempotent', message: 'Transaction already processed' };
            }

            // 2. Deadlock Avoidance: Always lock smaller ID first
            const firstLock = fromAccountId < toAccountId ? fromAccountId : toAccountId;
            const secondLock = fromAccountId < toAccountId ? toAccountId : fromAccountId;

            // Lock the accounts involved
            await connection.execute(`SELECT balance FROM ${TABLES.ACCOUNTS} WHERE id = ? FOR UPDATE`, [firstLock]);
            await connection.execute(`SELECT balance FROM ${TABLES.ACCOUNTS} WHERE id = ? FOR UPDATE`, [secondLock]);

            // 3. Balance Check
           const [senderRows] = await connection.execute(`SELECT balance FROM ${TABLES.ACCOUNTS} WHERE id = ?`, [fromAccountId]);
           const senderBalance = parseFloat(senderRows[0].balance);

            if (senderBalance < amount) {
                await connection.rollback();
                throw new Error('Insufficient funds');
            }

            
            // 4. Update Balances
            await connection.execute(`UPDATE ${TABLES.ACCOUNTS} SET balance = balance - ? WHERE id = ?`, [amount, fromAccountId]);
            await connection.execute(`UPDATE ${TABLES.ACCOUNTS} SET balance = balance + ? WHERE id = ?`, [amount, toAccountId]);

            // 5. Record Ledger Entry
            await connection.execute(
                `INSERT INTO ${TABLES.LEDGER} (transaction_id, debit_account_id, credit_account_id, amount, description) VALUES (?, ?, ?, ?, ?)`,
                [transactionId, fromAccountId, toAccountId, amount, description]
            );

            await connection.commit();
            return { status: 'success', balance: senderBalance - amount };

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async getBalance(accountId) {
       const [rows] = await pool.execute(`SELECT balance, name FROM ${TABLES.ACCOUNTS} WHERE id = ?`, [accountId]);
       return rows[0];
    }
}

module.exports = new LedgerService();