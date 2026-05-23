const  connectDB = require ( './src/config/db.js')
const express = require('express')
const dotenv = require('dotenv');

dotenv.config();
const app = express();

connectDB();

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(` Sanad Backend running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
