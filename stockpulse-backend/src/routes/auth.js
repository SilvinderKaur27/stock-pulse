const bcrypt = require('bcryptjs');
const express = require('express');
const jwt = require('jsonwebtoken');
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

router.post('/login', async (req, res)=> { 
    try {
    const { email, password } = req.body;
    const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [email])
    const user = result.rows[0];

    if(!user) {
        return res.status(401).json({
            message: "Email not registered"
        })
    }

    const isMatch = await bcrypt.compare(
        password,
        user.password_hash
    )

    if(!isMatch) {
        return res.status(401).json({
            message: "Invalid credentials"
        })
    }

    const accessToken = jwt.sign(
        { id: user.id }, 
        process.env.JWT_SECRET,
        { expiresIn: "15m"}
    )
    const refresh_token = jwt.sign({
        id: user.id},
        process.env.JWT_SECRET,
        {expiresIn: "7d"}
    )

    await pool.query(
        `UPDATE users 
        SET refresh_token = $1
        WHERE id = $2`,[refresh_token, user.id])

    res.json({ 
        accessToken,
        refresh_token: refresh_token
})
    } catch(error) {
        res.status(500).json({
            message: error.message
        })
    }
})

router.post("/refresh", async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if(!refreshToken) {
            return res.status(401).json({
                message: "Refresh token required"
            });
        }

        const decoded = jwt.verify(
            refreshToken,
            process.env.JWT_SECRET
        )

        const result = await  pool.query(
            "SELECT * FROM users WHERE id = $1",
            [decoded.id]
        )

        const user = result.rows[0];

        if (!user || user.refresh_token !== refreshToken) {
            return res.status(401).json({
                message: "Invalid refresh token"
            })
        }
    const accessToken = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET,
            { expiresIn: "15m" }
        );

        res.json({
            accessToken
        });

    } catch(error) {
        res.status(401).json({
            message: "Invalid refresh token"
        });
    }
    })

router.post("/logout", async(req, res)=> {
    try{
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                message: "Refresh token required"
            });
        }

        const decoded = jwt.verify(
            refreshToken,
            process.env.JWT_SECRET
        );

        await pool.query(
            `UPDATE users
             SET refresh_token = NULL
             WHERE id = $1`,
            [decoded.id]
        );

        res.json({
            message: "Logged out successfully"
        });

    } catch (error) {
        res.status(401).json({
            message: "Invalid refresh token"
        });
    }

})

module.exports = router;