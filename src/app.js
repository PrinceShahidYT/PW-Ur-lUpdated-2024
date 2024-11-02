require('dotenv').config();
const express = require('express');
const getUrl = require('./getUrl')


const app = express();
const PORT = process.env.PORT || 7860


app.use('/', getUrl);

mongoose.connect(process.env.MONGODB_URL).then(() => {
    try {
        app.listen(PORT, () => {
            console.log(`Server Connected on Port: ${PORT}`);
        });
    } catch (error) {
        console.log(`Can't connect to the server: ${error.message}`);
    }
}).catch((error) => {
    console.log("Mongoose Connection Error: " + error.message);
});

module.exports = app;
