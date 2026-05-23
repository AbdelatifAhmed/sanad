const  connectDB = require ( './src/config/db.js')
const express = require('express')
const dotenv = require('dotenv');

dotenv.config();
const app = express();

app.use(express.json());

connectDB();

app.use('/api/family', require('./src/routes/family'));
app.use('/api/companion', require('./src/routes/companion'));
app.use('/api/bookings', require('./src/routes/booking'));
app.use('/api/ai', require('./src/routes/aiChat'));

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(` Sanad Backend running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
