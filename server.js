const pool = require('./db')
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

app.get('/db-test', async (req, res) => {

    try {

        const result = await pool.query('SELECT NOW()');

        res.json({

            message: 'Database connection works',

            time: result.rows[0]

        });

    } catch (error) {

        console.error('DB TEST ERROR:', error);

        res.status(500).json({

            message: 'Database connection failed',

            code: error.code,

            errno: error.errno,

            detail: error.message

        });

    }

});

app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/transaction', transactionRoutes)

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(`Server running on port ${PORT}`);

});