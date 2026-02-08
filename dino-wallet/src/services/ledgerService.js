const db = require('../config/db');
const { TABLES, CURRENT_DB_TYPE, DB_TYPES } = require('../config/constant');
const { v4: uuidv4 } = require('uuid'); // 👈 Import UUID

class LedgerService {

    // --- PRIVATE HELPER: Unified DB Access ---
    async _getDB() {
        let isMySQL = (CURRENT_DB_TYPE === DB_TYPES.MYSQL);
        let connection = isMySQL ? await db.getConnection() : await db;
        
        return {
            connection,
            isMySQL,
            query: async (sql, params = []) => {
                if (isMySQL) return connection.execute(sql, params);
                if (sql.trim().toUpperCase().startsWith('SELECT')) {
                    const res = await connection.all(sql.replace(/\?/g, '?'), params);
                    return [res]; 
                }
                return connection.run(sql, params);
            },
            release: () => { if (isMySQL && connection) connection.release(); }
        };
    }

    // --- HELPER: Resolve ID (User/Account) ---
    async _resolveToAccountId(id, assetName, dbCtx) {
        // 1. Check if it is already an Account ID
        const [acc] = await dbCtx.query(`SELECT id, asset_id FROM ${TABLES.ACCOUNTS} WHERE id = ?`, [id]);
        if (acc && acc.length > 0) return acc[0].id;

        // 2. If not, assume User ID. We need Asset Name.
        if (!assetName) throw new Error(`ID '${id}' is not a valid Account, and Asset Name is missing.`);

        // 3. Find Asset ID
        const [assetRows] = await dbCtx.query(`SELECT id FROM ${TABLES.ASSETS} WHERE name = ?`, [assetName]);
        if (!assetRows || assetRows.length === 0) throw new Error(`Asset '${assetName}' not found.`);
        const assetId = assetRows[0].id;

        // 4. Find User's Wallet for this Asset
        const [userWallet] = await dbCtx.query(
            `SELECT id FROM ${TABLES.ACCOUNTS} WHERE user_id = ? AND asset_id = ?`, 
            [id, assetId]
        );

        if (!userWallet || userWallet.length === 0) throw new Error(`User '${id}' wallet for '${assetName}' not found.`);

        return userWallet[0].id;
    }

    // --- HELPER: Auto-Find System Admin Wallet ---
    async _getSystemAdminWallet(assetName, dbCtx) {
        // 1. Find User with username 'system_admin'
        const [adminUser] = await dbCtx.query(`SELECT id FROM ${TABLES.USERS} WHERE username = 'system_admin'`);
        if (!adminUser || adminUser.length === 0) throw new Error("System Admin user not found!");

        // 2. Resolve their wallet
        return this._resolveToAccountId(adminUser[0].id, assetName, dbCtx);
    }

    // --- CALCULATOR ---
    async calculatePurchaseQuantity(assetName, cashAmount, dbCtx) {
        const [rows] = await dbCtx.query(`SELECT id, sample_package_list_json FROM ${TABLES.ASSETS} WHERE name = ?`, [assetName]);
        if (!rows.length) throw new Error(`Asset '${assetName}' not found`);
        
        let packages = [];
        try {
            packages = typeof rows[0].sample_package_list_json === 'string' 
                ? JSON.parse(rows[0].sample_package_list_json) 
                : rows[0].sample_package_list_json;
        } catch (e) {}

        let bestRatio = 0, bestPackageName = 'Standard';
        (packages || []).forEach(pkg => {
            const ratio = parseFloat(pkg.qty) / parseFloat(pkg.price);
            if (ratio > bestRatio) { bestRatio = ratio; bestPackageName = `${pkg.qty} for ${pkg.price}`; }
        });

        if (bestRatio === 0) bestRatio = 1; // Fallback

        return {
            amount: parseFloat((cashAmount * bestRatio).toFixed(2)),
            desc: `Purchase: $${cashAmount} via '${bestPackageName}' (${bestRatio.toFixed(2)}x)`,
            assetId: rows[0].id
        };
    }

    // --- MAIN TRANSACTION LOGIC ---
    async transferFunds(payload) {
        let { transactionId, fromAccountId, toAccountId, amount, description, type, asset_name, cash_amount } = payload;
        
        const dbCtx = await this._getDB();
        const { connection, isMySQL, query } = dbCtx;

        try {
            if (isMySQL) await connection.beginTransaction();
            else await connection.run('BEGIN TRANSACTION');

            // --- 1. RESOLVE SENDER ---
            // If Purchase AND no sender provided -> Use System Admin
            if (type === 'purchase' && !fromAccountId) {
                fromAccountId = await this._getSystemAdminWallet(asset_name, dbCtx);
            }
            
            // Resolve IDs (User -> Account)
            const resolvedFromId = await this._resolveToAccountId(fromAccountId, asset_name, dbCtx);
            const resolvedToId = await this._resolveToAccountId(toAccountId, asset_name, dbCtx);

            // --- 2. CALCULATE AMOUNT ---
            let finalAmount = amount;
            let finalDesc = description;
            
            if (type === 'purchase' && cash_amount) {
                const calc = await this.calculatePurchaseQuantity(asset_name, cash_amount, dbCtx);
                finalAmount = calc.amount;
                finalDesc = calc.desc;
            }

            // --- 3. EXECUTE TRANSFER ---
            // A. Update Sender (Admin/User)
            await query(`UPDATE ${TABLES.ACCOUNTS} SET balance = balance - ? WHERE id = ?`, [finalAmount, resolvedFromId]);
            
            // B. Update Receiver
            await query(`UPDATE ${TABLES.ACCOUNTS} SET balance = balance + ? WHERE id = ?`, [finalAmount, resolvedToId]);

            // --- 4. RECORD LEDGER (THE FIX 🛠️) ---
            // Added 'uuidv4()' as the first parameter for 'id'
            await query(
                `INSERT INTO ${TABLES.LEDGER} (id, transaction_id, debit_account_id, credit_account_id, amount, description, asset_name_snapshot) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [uuidv4(), transactionId, resolvedFromId, resolvedToId, finalAmount, finalDesc, asset_name || 'Generic']
            );

            if (isMySQL) await connection.commit();
            else await connection.run('COMMIT');
            
            return { status: 'success', credited_amount: finalAmount, description: finalDesc };

        } catch (error) {
            if (isMySQL) await connection.rollback();
            else await connection.run('ROLLBACK');
            throw error;
        } finally {
            dbCtx.release();
        }
    }

    async getBalance(accountId) {
        const dbCtx = await this._getDB();
        try {
            const [rows] = await dbCtx.query(`SELECT balance, name FROM ${TABLES.ACCOUNTS} WHERE id = ?`, [accountId]);
            return rows[0];
        } finally {
            dbCtx.release();
        }
    }
}

module.exports = new LedgerService();