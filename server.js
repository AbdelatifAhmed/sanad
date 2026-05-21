const connectDB = require('./src/config/db.js');
const express = require('express');
const dotenv = require('dotenv');
const { register, login } = require('./src/controllers/authController');

dotenv.config();
const app = express();

app.use(express.json());

app.post('/api/auth/register', register);
app.post('/api/auth/login', login);

connectDB();

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Sanad Backend running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
