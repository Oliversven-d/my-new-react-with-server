const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const https = require('https'); // Import the HTTPS module
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 1000;

app.use(bodyParser.json());

mongoose.connect('mongodb://localhost:27017/stock_portfolio', {
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => console.log('Connected to MongoDB'));

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  portfolio: [{
    symbol: String,
    quantity: Number
  }]
});
const User = mongoose.model('User', userSchema);

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, 'secret', (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

app.use(express.static(path.join(__dirname, '..', 'build')));

app.get('/', async (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'build', 'index.html'));
});


app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ username, password: hashedPassword });
    res.status(201).json({ message: 'User registered successfully'});
  } catch (error) {
    console.error('Error registering user', error);
    res.status(500).json({ message: 'Internal server error'});
  }
});
  
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password'});
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid username or password'});
    }
    const token = jwt.sign({ username }, 'secret', { expiresIn: '1h' });
    res.status(200).json({ token });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Internal server error'});
  }
});

app.post('/api/addstock', authenticateToken, async (req, res) => {
  try {
    const { symbol, quantity } = req.body;
    const user = await User.findOne({ username: 'User not found'});
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const existingStockIndex = user.portfolio.findIndex(stock => stock.symbol === symbol);
    if (existingStockIndex !== -1) {
      user.portfolio[existingStockIndex].qunatity += quantity;
    } else {
      user.portfolio.push({ symbol,quantity });
    }
    await user.save();
    res.status(200).json({ message: 'Stock added successfully'});
  } catch (error) {
    console.error('Error adding stock', error);
    res.status(500).json({ message: 'Internal server error'});
  }
});

app.listen(PORT, () => console.log('Server running on port ${PORT}'));



