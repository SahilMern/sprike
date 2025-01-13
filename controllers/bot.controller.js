// const mainBot = require("../logic");
const sellCode = require("../bot/sell");

const startbot = async(req, res) => {
    try {

        sellCode()
        return res.status(200).json({
            message:"Bot start data"
        })
    } catch (error) {
        console.log(error);
    }
}
const stopbot = async(req, res) => {
    try {
        return res.status(200).json({
            message:"Bot Stop data"
        })
    } catch (error) {
        console.log(error);
    }
}


module.exports = {startbot, stopbot}