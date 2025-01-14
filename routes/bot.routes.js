const express = require("express");
const { startbot, stopbot, statusBot } = require("../controllers/bot.controller");
const router = express.Router()

router.post("/startbot", startbot)
router.post("/stopbot", stopbot)
router.get("/statusBot", statusBot)



module.exports = router;