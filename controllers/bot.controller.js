const startbot = async(req, res) => {
    try {
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