const express = require('express');

const cors = require('cors');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const transactionRoutes = require('./routes/transactions');

const app = express();

app.use(cors());

app.use(express.json());

app.get('/', (req, res) => {

    res.json({

        message: 'Wallet API Running'

    });

});

app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/transaction', transactionRoutes)

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(`Server running on port ${PORT}`);

});