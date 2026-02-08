const ledgerService = require('../services/ledgerService');
const directoryService = require('../services/directoryService');
const { v4: uuidv4 } = require('uuid');

exports.getUserByUUID = async (req, res) => {
    const { userid } = req.params;

    try {
        const userDetails = await directoryService.getUserDetails(userid);

        if (!userDetails) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json(userDetails);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.transfer = async (req, res) => {
    // Flows: 
    // 1. Top-up: System Treasury -> User
    // 2. Purchase: User pays Cash (external) -> System calculates Asset -> Treasury credits User
    
    // const { 
    //     from_account_id,
    //     to_account_id,   
    //     amount,          
    //     cash_amount,     
    //     asset_name,     
    //     idempotency_key, 
    //     type 
    // } = req.body;
    let { 
        id, 
        to_account_id, // User Wallet ID
        from_account_id,  // Usually Treasury ID for purchases
        amount, // Raw Asset Amount (for simple transfers)
        cash_amount, // Cash Amount (for 'purchase' type)
        asset_name,  // e.g., 'Gold Coins' (for 'purchase' type)
        idempotency_key, 
        type 
    } = req.body;
    // Logic: If "id" is provided, it is the Target/Receiver
    if (id && !to_account_id) {
        to_account_id = id;
    }

    try {
        const result = await ledgerService.transferFunds({
            transactionId: idempotency_key || uuidv4(),
            fromAccountId: from_account_id,
            toAccountId: to_account_id,
            amount: amount || 0, // Optional if cash_amount provided
            cash_amount: cash_amount,
            asset_name: asset_name,
            description: req.body.description || (type === 'purchase' ? 'In-App Purchase' : 'Transfer'),
            type: type || 'transfer'
        });

        // --- ⚡ SOCKET.IO UPDATE ---
        // if (req.io) {
        //     // Notify Receiver
        //     req.io.emit('balance_update', {
        //         accountId: to_account_id,
        //         newBalance: null, // Client should refresh or we query db
        //         amountReceived: result.credited_amount,
        //         message: result.description,
        //         timestamp: new Date()
        //     });
        // }
        // Socket.io Real-time update
        if (req.io) {
            req.io.emit('balance_update', {
                accountId: to_account_id,
                amountReceived: result.credited_amount,
                message: result.description,
                timestamp: new Date()
            });
        }

        res.status(200).json(result);

    } catch (error) {
        // Idempotency is actually a success case in many APIs (return existing result)
        if (error.message === 'Transaction already processed') {
            return res.status(200).json({ status: 'idempotent', message: error.message });
        }
        res.status(400).json({ error: error.message });
    }
};
exports.getBalance = async (req, res) => {
    const id = req.params.id;

    try {
        // ---------------------------------------------------------
        // 1. ATTEMPT A: Check if ID is a WALLET ACCOUNT
        // ---------------------------------------------------------
        const balanceData = await ledgerService.getBalance(id);
        
        if (balanceData) {
            // ✅ It is a Wallet! Return standard balance.
            return res.status(200).json(balanceData);
        }

        // ---------------------------------------------------------
        // 2. ATTEMPT B: Check if ID is a USER (Internal Redirect)
        // ---------------------------------------------------------
        // We reuse the exact same logic from Public Directory!
        const userProfile = await directoryService.getUserDetails(id);

        if (userProfile) {
            // ✅ It is a User! 
            // Add the custom message you requested
            userProfile.redirect_message = `Redirected: '${id}' is a User ID. Showing all associated wallets.`;
            
            // Return the full user profile (Accounts + History)
            return res.status(200).json(userProfile);
        }

        // ---------------------------------------------------------
        // 3. FAIL: ID exists in neither table
        // ---------------------------------------------------------
        return res.status(404).json({ error: 'ID not found. It is neither a valid Wallet Account nor a User ID.' });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};