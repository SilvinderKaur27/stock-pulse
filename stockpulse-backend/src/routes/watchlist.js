const express = require("express");
const axios = require("axios");
const pool = require("../db");
const auth = require("../middleware/auth");
const redis = require("../redis");
const router = express.Router();

router.post("/", auth, async (req, res) => {
    try {
        const { stock_ticker } = req.body;
        console.log(req.user);

        const existingStock = await pool.query(
            `SELECT * FROM stock_metadata
             WHERE ticker = $1`,
            [stock_ticker]
        );

        if (existingStock.rows.length === 0) {

            const response = await axios.get(
                "https://www.alphavantage.co/query",
                {
                    params: {
                        function: "SYMBOL_SEARCH",
                        keywords: stock_ticker,
                        apikey: process.env.ALPHA_VANTAGE_API_KEY
                    }
                }
            );

            const stock = response.data.bestMatches[0];

            if (!stock) {
                return res.status(404).json({
                    message: "Stock not found"
                });
            }

            await pool.query(
                `INSERT INTO stock_metadata
                (ticker, company_name, last_updated)
                VALUES ($1, $2, NOW())`,
                [
                    stock["1. symbol"],
                    stock["2. name"]
                ]
            );
        }

        await pool.query(
            `INSERT INTO watchlist(user_id, stock_ticker)
            VALUES($1, $2)`,
            [req.user.id, stock_ticker]
        )

        res.status(201).json({
            message: "Stock added to watchlist"
        })
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
})

router.delete("/:ticker", auth, async (req, res) => {
    try {
        const { ticker } = req.params;
        await pool.query(
            `DELETE FROM watchlist
            WHERE user_id = $1
            AND stock_ticker = $2`,
            [req.user.id, ticker]
        );

        res.json({
            message: "Stock removed"
        })
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
})

router.get("/", auth, async (req, res) => {

    try {

        const result = await pool.query(
            `SELECT stock_ticker
        FROM watchlist
        WHERE user_id = $1`,
            [req.user.id]
        );

        const watchlist = await Promise.all(
            result.rows.map(async (stock) => {
                const cached = await redis.get(
                    `price:${stock.stock_ticker}`
                );

                if (!cached) {
                    return null;
                }


                return JSON.parse(cached);

            })
        )

        res.json(watchlist.filter(Boolean));

    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
})

module.exports = router;