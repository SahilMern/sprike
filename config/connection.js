const mongoose = require("mongoose");

const databaseConnection = async() => {
    const dbConnection = await mongoose.connect("mongodb://localhost:27017/spike",{})

}

module.exports = databaseConnection