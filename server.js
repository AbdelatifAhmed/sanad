const connectDB = require("./src/config/db.js");
const express = require("express");
const dotenv = require("dotenv");
const routes = require("./src/routes");
dotenv.config();
const app = express();

app.use(express.json());
app.use("/api", routes);
connectDB();

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(
    `Sanad Backend running in ${process.env.NODE_ENV} mode on port ${PORT}`,
  );
});
