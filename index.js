const express = require('express')
const app = express()
const port = 3000
app.use(express.json())

//?User Routes
const userRoutes = require("./routes/user.routes")
app.use("/api/user", userRoutes)

//?bot Routes
const botRoutes = require("./routes/bot.routes")
app.use("/api/bot", botRoutes)


app.listen(port, () => console.log(`Example app listening on port ${port}!`))