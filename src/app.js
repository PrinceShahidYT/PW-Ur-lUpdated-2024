require('dotenv').config();
const express = require('express');
const getUrl = require('./getUrl')


const app = express();
const PORT = process.env.PORT || 7860


app.use('/', getUrl);

app.listen(PORT, () => {
    console.log(`Working on Port: ${PORT}`);
    
})

module.exports = app;