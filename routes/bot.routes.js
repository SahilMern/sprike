const express = require("express");
const { startbot, stopbot, statusBot, setPrice,  getPrices, updatePrice } = require("../controllers/bot.controller");
const router = express.Router()

router.post("/startbot", startbot)
router.post("/stopbot", stopbot)
router.get("/statusBot", statusBot)

router.post("/setPrice", setPrice)
router.get("/getPrices", getPrices)
router.put('/updateprice/:id', updatePrice);

module.exports = router;