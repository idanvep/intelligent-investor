const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/health', require('./routes/health'));
app.use('/calculate', require('./routes/calculate'));
app.use('/profiles', require('./routes/profiles'));

module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}