console.log("JAI SHREE RAM / JAI BAJARANG BALI JI");

require("dotenv").config();
const express = require("express");
const app = express();
const port = 3000;

app.use(express.json());

const databaseConnection = require("./config/connection");
databaseConnection();

const cors = require("cors");


app.use(
    cors({
      origin: [
        "https://spikeui.vercel.app/",  // Production domain
        "http://localhost:3000/",       // Local development for your Express API
        "http://localhost:5173",        // Local development for your frontend
      ],
    })
  );

// User Routes
const userRoutes = require("./routes/user.routes");
app.use("/api/user", userRoutes);

// Bot Routes
const botRoutes = require("./routes/bot.routes");
app.use("/api/bot", botRoutes);

app.listen(port, () => console.log(`Server is listening on port ${port}!`));
