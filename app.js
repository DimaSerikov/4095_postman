const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const path = require('path');

require('dotenv').config();

const app = express();

const port = process.env.PORT || 3002;
const hostname = process.env.HOSTNAME;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));


let history = [];

app.post('/send-request', async (req, res) => {
  const { url, method, headers, body } = req.body;

  try {
    const response = await axios({
      url,
      method,
      headers,
      data: body,
      maxRedirects: 0,
      validateStatus: null,
    });

    const result = {
      statusCode: response.status,
      contentType: response.headers['content-type'],
      data: response.data,
      headers: response.headers,
    };
    
    history.push({ url, method, headers, body });

    res.json(result);
  } catch (error) {
    if (error.response) {
      res.json({
        statusCode: error.response.status,
        headers: error.response.headers,
        data: error.response.data,
      });
    } else {
      res.status(500).json({ error: 'Request failed' });
    }
  }
});

app.get('/history', (req, res) => {
  res.json(history);
});

// Listen
app.listen(port, hostname, () => console.log(`Server is running on port http://${hostname}:${port}`));