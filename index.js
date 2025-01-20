console.log("JAI SHREE RAM / JAI BAJARANG BALI JI");
require("dotenv").config({});
const express = require("express");
const app = express();
const port = 3000;
app.use(express.json());
const databaseConnection = require("./config/connection");  // Import the database connection function
databaseConnection()
const cors = require("cors");

app.use(cors());

//TODO:-User Routes
const userRoutes = require("./routes/user.routes");
app.use("/api/user", userRoutes);

//TODO:-bot Routes
const botRoutes = require("./routes/bot.routes");
app.use("/api/bot", botRoutes);

app.listen(port, () => console.log(`Example app listening on port ${port}!`));

// app.get("/", async(req, res) => {
//     return res.status(200).json({
//         message:"Hello"
//     })
// })
