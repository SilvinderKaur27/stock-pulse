const express = require('express');
const pool = require('./db')
const app = express();
const auth = require("./middleware/auth")
app.use(express.json());

const authRoutes = require('./routes/auth');

app.get('/health', async (req, res)=> {
    const response = await pool.query('SELECT NOW()');
    res.json(response.rows[0]);
    console.log(response.rows[0]);

})
app.get('/protected', auth, (req, res) => {
    res.json({ message: "access granted", userId: req.user.id });
})

app.use('/auth', authRoutes);
app.listen(3000, () => {
    console.log('server running on port 3000');
});