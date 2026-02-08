const directoryService = require('../services/directoryService');

exports.getDirectory = async (req, res) => {
    try {
        const users = await directoryService.getLastTenUsers();
        
        // The Response Interceptor in app.js will automatically wrap this 
        // in { meta: ..., data: users }
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};