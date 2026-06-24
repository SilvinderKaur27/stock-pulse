const bcrypt = require('bcryptjs');
const express = require('express');
const pool = require('../db');
const router = express.Router();



router.post('/register', async(req, res)=> {
    try {
    const { name, email, password } = req.body;

    if(!name || !email || !password) {
        return res.status(400).json({
            message: 'All fields are required'
        });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await pool.query(
        `INSERT INTO users (name, email, password_hash)
        VALUES ($1, $2, $3)`, 
        [name, email, passwordHash]
    );

    res.status(201).json({
        message: 'User registered successfully'
    })
}catch(error) {
    console.error(error);

    res.status(500).json({
        message: error.message
    });
}


});

module.exports = router;