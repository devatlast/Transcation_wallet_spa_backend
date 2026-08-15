require('dotenv').config();
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first')
const {Pool} = require('pg');

const pool = new Pool({
   user: process.env.DB_USER,
   host: process.env.DB_HOST,
   databse: process.env.DB_NAME,
   password: process.env.DB_PASSWORD,
   port: process.env.DB_PORT || 5432,
   ssl: {
    rejectUnauthorized: false
   }
});
module.exports = pool;