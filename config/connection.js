const mongoose = require("mongoose");

const databaseConnection = async () => {
  try {
    const dbConnection = await mongoose.connect(process.env.database);

    console.log("MongoDB connected successfully!");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};

module.exports = databaseConnection;
