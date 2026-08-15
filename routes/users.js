const express = require('express');

const pool = require('../db');

const authenticateToken = require('../middleware/auth');

const router = express.Router();

router.get('/me', authenticateToken, async (req, res) => {

    try {

        const result = await pool.query(

            `SELECT
                users.name,

                users.email,

                wallets.balance

             FROM users

             JOIN wallets

                ON wallets.user_id = users.id

             WHERE users.id = $1`,

            [req.user.id]

        );

        if (result.rows.length === 0) {

            return res.status(404).json({

                message: 'User not found'

            });

        }

        res.json({

            user: result.rows[0]

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            message: 'Server error'

        });

    }

});

module.exports = router;