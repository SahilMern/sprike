// const mainBot = require("../logic");
const sellCode = require("../bot/sell");
let botStatus = require("../bot/BotStatus");

const startbot = async (req, res) => {
  try {
    botStatus.status = true;
    sellCode();
    return res.status(200).json({
      message: "Bot start data",
    });
  } catch (error) {
    console.log(error);
  }
};
const stopbot = async (req, res) => {
  try {
    botStatus.status = false;
    return res.status(200).json({
      message: "Bot Stop data",
    });
  } catch (error) {
    console.log(error);
  }
};

const statusBot = async (req, res) => {
  try {
    botStatus;
    return res.status(200).json({
      message: "Bot Status",
      botStatus,
    });
  } catch (error) {
    console.log(error, "error");
  }
};

module.exports = { startbot, stopbot, statusBot };
