const cacheRoute = require("./jobs/priceFetcher");
const express = require('express');
const pool = require('./db')

const app = express();
const auth = require("./middleware/auth")
const stockRoutes = require("./routes/stocks");
const watchlistRoutes = require("./routes/watchlist");
app.use(express.json());

const authRoutes = require('./routes/auth');
const redis = require("./redis");

app.get('/health', async (req, res)=> {
    const response = await pool.query('SELECT NOW()');
    res.json(response.rows[0]);
    console.log(response.rows[0]);

})
app.get('/protected', auth, (req, res) => {
    res.json({ message: "access granted", userId: req.user.id });
})

app.get("/redis-test", async(req, res)=> {
    try{
        await redis.set("name", "Silvi");

        const value = await redis.get("name");

        res.json({
            value
        })
    }catch(error) {
        res.status(500).json({
            message: error.message
        })
    }
})

app.get("/cache/:ticker", async (req, res) => {
    const key = `price:${req.params.ticker}`;
    const value = await redis.get(key);

    console.log("Key:", key);
    console.log("Value:", value);
    console.log("Type:", typeof value);

    res.send(value);
});

app.use('/auth', authRoutes);
app.use('/stocks', stockRoutes);
app.use("/watchlist", watchlistRoutes);

app.listen(3000, () => {
    console.log('server running on port 3000');
});