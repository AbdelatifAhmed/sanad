
const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./src/config/db.js");
const routes = require("./src/routes");
const AppError = require("./src/utiles/AppError");

dotenv.config();
const app = express();

app.use(express.json());
app.use("/api", routes);

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(AppError.globalErrorHandler);

connectDB();

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(
    `Sanad Backend running in ${process.env.NODE_ENV} mode on port ${PORT}`,
  );
});


