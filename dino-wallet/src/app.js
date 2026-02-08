const express = require('express');
const walletRoutes = require('./routes/walletRoutes');
require('dotenv').config();

const app = express();
app.use(express.json());

app.use('/api/v1/wallet', walletRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Dino Wallet running on port ${PORT}`);
});