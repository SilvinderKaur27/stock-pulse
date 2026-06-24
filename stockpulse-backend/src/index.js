const express = require('express');
const pool = require('./db')
const app = express();


app.get('/health', async (req, res)=> {
    const response = await pool.query('SELECT NOW()');
    res.json(response.rows[0]);
    console.log(response.row[0]);

})
app.listen(3000, () => {
    console.log('server running on port 3000');
});