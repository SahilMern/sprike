const express = require("express");
const { startbot, stopbot } = require("../controllers/bot.controller");
const router = express.Router()

router.post("/startbot", startbot)
router.post("/stopbot", stopbot)


module.exports = router;