const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({

    service: 'gmail',

    auth: {

        user: process.env.EMAIL_USER,

        pass: process.env.EMAIL_PASSWORD

    }

});

async function sendVerificationEmail(email, token) {

    const verificationLink =

        `http://localhost:3000/auth/verify/${token}`;

    await transporter.sendMail({

        from: process.env.EMAIL_USER,

        to: email,

        subject: 'Verify your CoinMarket account',

        html: `

            <h2>Welcome to CoinMarket Wallet</h2>

            <p>

                Please verify your email address.

            </p>

            <p>

                Click the link below:

            </p>

            <a href="${verificationLink}">

                Verify Email

            </a>

            <p>

                This link will expire in 15 minutes.

            </p>

        `

    });

}

module.exports = {

    sendVerificationEmail

};