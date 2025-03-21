const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Import routes
const cricbuzzRoutes = require('./routes/cricbuzzRoutes');

// Middleware
app.use(cors());
app.use(express.json());

// Home route
app.get('/', (req, res) => {
    res.send('API is running');
});

// Use routes
app.use('/api/cricbuzz', cricbuzzRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;