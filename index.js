const express = require('express');
const app = express();

const session = require('express-session');
const dotenv = require('dotenv').config();
const PORT = process.env.PORT || 3000;
const authInvestorRouter = require('./routes/investorAuthRoute');
const { notFound, errorHandler } = require('./middlewares/errorHandler');
const bodyParser = require('body-parser');
const cors = require('cors');
const { connectToDatabase } = require('./config/database');
const { superBaseConnect } = require('./config/supabse');

connectToDatabase();
superBaseConnect();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


app.get('/', (req, res) => {
  res.json({
    msg: 'Hello from HSE Server',
    status: 'ok',
  });
});

app.use('/api', authInvestorRouter);

app.use(notFound);
app.use(errorHandler);
app.listen(PORT, () => {
  console.log(`hse server is running at Port ${PORT}`);
});
