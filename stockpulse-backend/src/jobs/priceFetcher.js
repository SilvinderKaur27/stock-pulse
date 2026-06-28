const cron = require("node-cron");
const axios = require("axios");
const pool = require("../db");
const redis = require("../redis");

async function fetchPrices() {
    try {
        console.log("Fetching latest prices...");

        const result = await pool.query(`SELECT DISTINCT stock_ticker FROM watchlist`
        );
        console.log(result.rows);

        for (const stock of result.rows) {
            const response = await axios.get(
                "https://www.alphavantage.co/query",
                {
                    params: {
                        function: "GLOBAL_QUOTE", symbol: stock.stock_ticker,
                        apikey: process.env.ALPHA_VANTAGE_API_KEY
                    }
                }
            );
            console.log(response.data);

            const quote = {
                "01. symbol": stock.stock_ticker,
                "05. price": "271.63",
                "10. change percent": "5.17%"
            };

            await redis.set(
                `price:${stock.stock_ticker}`,
                JSON.stringify(quote)
            )
            const saved = await redis.get(`price:${stock.stock_ticker}`);
            console.log("Saved:", saved);
        }
    } catch (error) {
        console.error(error.message);
    }

}

fetchPrices();

cron.schedule("* * * * *", fetchPrices)