const express = require("express");
const axios = require("axios");

const router = express.Router();

router.get("/search", async (req, res) => {
    const { q } = req.query;
    const response = await axios.get(
        "https://www.alphavantage.co/query",
        {
            params: {
                function: "SYMBOL_SEARCH",
                keywords: q,
                apikey: process.env.ALPHA_VANTAGE_API_KEY

            }
        }
    )

    res.json(response.data.bestMatches);

})

router.get("/:ticker", async (req, res) => {
    try {
        const { ticker } = req.params;

        const response = await axios.get("https://www.alphavantage.co/query",
            {
                params: {
                    function: "GLOBAL_QUOTE",
                    symbol: ticker,
                    apikey: process.env.ALPHA_VANTAGE_API_KEY
                }
            }
        )

        const quote = response.data["Global Quote"];

        if (!quote || Object.keys(quote).length === 0) {
            return res.status(404).json({
                message: "Stock not found"
            })
        }

        res.json(quote);

    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
})

module.exports = router;