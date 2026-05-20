const express = require('express');
const app = express();

// Middleware
app.use(express.json());

// Routes
app.get('/users', (req, res) => {
  res.json({ users: [] });
});

app.post('/users', (req, res) => {
  const { name, email } = req.body;
  res.status(201).json({ id: 1, name, email });
});

app.put('/users/:id', (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;
  res.json({ id, name, email });
});

app.delete('/users/:id', (req, res) => {
  res.status(204).send();
});

// Start server
app.listen(3000, () => {
  console.log('Server running on port 3000');
});
