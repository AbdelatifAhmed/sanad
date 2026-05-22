const connectDB = require('./src/config/db.js');
const express = require('express');
const dotenv = require('dotenv');
const familyRoutes = require('./src/Routes/family.routes');
const companionRoutes = require('./src/Routes/companion.routes');
const bookingRoutes = require('./src/Routes/booking.routes');

dotenv.config();
const app = express();

connectDB();

app.use(express.json());
app.use('/api/family', familyRoutes);
app.use('/api/companion', companionRoutes);
app.use('/api/bookings', bookingRoutes);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(` Sanad Backend running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
