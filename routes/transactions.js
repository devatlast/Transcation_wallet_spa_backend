const express = require('express');

const crypto = require('crypto');

const pool = require('../db');

const authenticateToken = require('../middleware/auth');

const router = express.Router();

router.post('/send', authenticateToken, async (req, res) => {

    const client = await pool.connect();

    try {

        const {

            destination,

            recipientEmail,

            amount

        } = req.body;

        // Validate required fields

        if (!destination || !recipientEmail || amount === undefined) {

            return res.status(400).json({

                message: 'Destination, recipient email and amount are required'

            });

        }

        // Validate destination

        const allowedDestinations = [

            'chime',

            'cashapp',

            'paypal'

        ];

        if (!allowedDestinations.includes(destination.toLowerCase())) {

            return res.status(400).json({

                message: 'Invalid destination'

            });

        }

        const transferAmount = Number(amount);

        // Validate amount

        if (!Number.isFinite(transferAmount) || transferAmount <= 0) {

            return res.status(400).json({

                message: 'Amount must be greater than 0'

            });

        }

        await client.query('BEGIN');

        // Find sender's wallet

        const senderResult = await client.query(

            `SELECT

                users.id,

                users.email,

                wallets.balance

             FROM users

             JOIN wallets

                ON wallets.user_id = users.id

             WHERE users.id = $1

             FOR UPDATE`,

            [req.user.id]

        );

        if (senderResult.rows.length === 0) {

            await client.query('ROLLBACK');

            return res.status(404).json({

                message: 'Wallet not found'

            });

        }

        const sender = senderResult.rows[0];

        // Check balance

        if (Number(sender.balance) < transferAmount) {

            await client.query('ROLLBACK');

            return res.status(400).json({

                message: 'Insufficient balance'

            });

        }

        // Deduct money from sender's wallet

        await client.query(

            `UPDATE wallets

             SET balance = balance - $1

             WHERE user_id = $2`,

            [

                transferAmount,

                sender.id

            ]

        );

        // Generate transaction reference

        const reference =

            `TX-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

        // Save transaction

        const transactionResult = await client.query(

            `INSERT INTO transactions

                (

                    sender_id,

                    destination,

                    recipient_email,

                    amount,

                    reference,

                    status

                )

             VALUES

                ($1, $2, $3, $4, $5, $6)

             RETURNING

                id,

                sender_id,

                destination,

                recipient_email,

                amount,

                reference,

                status,

                created_at`,

            [

                sender.id,

                destination.toLowerCase(),

                recipientEmail,

                transferAmount,

                reference,

                'pending'

            ]

        );

        await client.query('COMMIT');

        res.status(201).json({

            message: 'Transfer successful',

            transaction: transactionResult.rows[0]

        });

    } catch (error) {

        await client.query('ROLLBACK');

        console.error(error);

        res.status(500).json({

            message: 'Transfer failed'

        });

    } finally {

        client.release();

    }

});

router.get('/', authenticateToken, async (req, res) => {

    try {

        const result = await pool.query(

            `SELECT

                id,

                destination,

                recipient_email,

                amount,

                reference,

                status,

                created_at

             FROM transactions

             WHERE sender_id = $1

             ORDER BY created_at DESC`,

            [req.user.id]

        );

        res.json({

            transactions: result.rows

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            message: 'Unable to fetch transactions'

        });

    }

});

module.exports = router;