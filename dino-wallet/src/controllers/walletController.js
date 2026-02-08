const ledgerService = require('../services/ledgerService');
const { v4: uuidv4 } = require('uuid');

exports.transfer = async (req, res) => {
    // Flows: 
    // 1. Top-up: System Treasury -> User
    // 2. Bonus: System Treasury -> User
    // 3. Spend: User -> System Treasury (or specific service account)
    
    const { from_account_id, to_account_id, amount, idempotency_key, type } = req.body;

    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

    try {
        const result = await ledgerService.transferFunds(
            idempotency_key || uuidv4(), // Use provided key or generate new one
            from_account_id,
            to_account_id,
            amount,
            type || 'transfer'
        );
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getBalance = async (req, res) => {
    try {
        const balance = await ledgerService.getBalance(req.params.id);
        if (!balance) return res.status(404).json({ error: 'Account not found' });
        res.status(200).json(balance);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};