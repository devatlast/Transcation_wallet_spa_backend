const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const{
    sendVerificationEmail
} = require('../services/email');

const router = express.Router();

router.post('/register', async (req, res) => {

    try {

        const {

            name,

            email,

            password

        } = req.body;

        if (!name || !email || !password) {

            return res.status(400).json({

                message: 'Name, email and password are required'

            });

        }

        const existingUser = await pool.query(

            'SELECT id FROM users WHERE email = $1',

            [email]

        );

        if (existingUser.rows.length > 0) {

            return res.status(409).json({

                message: 'Email already registered'

            });

        }

        const passwordHash = await bcrypt.hash(

            password,

            10

        );
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpires = new Date(Date.now() + 15 * 60 * 1000 );

       const userResult = await pool.query(
           `INSERT INTO users(name, email, password_hash, verification_token, verification_expires_at) VALUES
           ($1, $2, $3, $4, $5) RETURNING id, name, email`,

    [ name,  email,  passwordHash, verificationToken, verificationExpires ]
   );

        const user = userResult.rows[0];

        await pool.query(

            `INSERT INTO wallets (user_id)

             VALUES ($1)`,

            [user.id]

        );
        await sendVerificationEmail(email, verificationToken)

        res.status(201).json({

            message: 'Account created! Please check your email to verify account',

            user

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            message: 'Server error'

        });

    }

});

router.post('/login', async (req, res) => {

    try {

        const {

            email,

            password

        } = req.body;

        if (!email || !password) {

            return res.status(400).json({

                message: 'Email and password are required'

            });

        }

        const result = await pool.query(

            `SELECT *

             FROM users

             WHERE email = $1`,

            [email]

        );

        if (result.rows.length === 0) {

            return res.status(401).json({

                message: 'Invalid email or password'

            });

        }

        const user = result.rows[0];

        const passwordMatch = await bcrypt.compare(

            password,

            user.password_hash

        );

        if (!passwordMatch) {

            return res.status(401).json({

                message: 'Invalid email or password'

            });

        }

        if (!user.email_verified) {

            return res.status(403).json({

                message: 'Please verify your email first'

            });

        }

        const token = jwt.sign(

            {

                id: user.id,

                email: user.email

            },

            process.env.JWT_SECRET,

            {

                expiresIn: '1h'

            }

        );

        res.json({

            message: 'Login successful',

            token

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            message: 'Server error'

        });

    }
});
router.get('/verify/:token', async (req, res) => {

    try {

        const { token } = req.params;

        const result = await pool.query(

            `SELECT id

             FROM users

             WHERE verification_token = $1

             AND verification_expires_at > NOW()`,

            [token]

        );

        if (result.rows.length === 0) {

            return res.status(400).json({

                message: 'Invalid or expired verification link'

            });

        }

        const userId = result.rows[0].id;

        await pool.query(

            `UPDATE users

             SET

                email_verified = TRUE,

                verification_token = NULL,

                verification_expires_at = NULL

             WHERE id = $1`,

            [userId]

        );

        res.json({

            message: 'Email verified successfully. You can now log in.'

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            message: 'Server error'

        });

    }

});

module.exports = router;