require('dotenv').config();
const express = require('express');
const Model = require('./Model')
const axios = require('axios');
const crypto = require('crypto');

const getUrl = express.Router();
getUrl.use(express.json());

getUrl.get('/check', (req, res) => {
    res.status(200).send({"Status": "Good 200 ok"});
})

getUrl.get('/update', async (req, res) => {

    const db = await Model.find({});
    const access_token = db[0].access_token;
    const refresh_token = db[0].refresh_token;

    try {
        const response = await axios.post('https://api.penpencil.co/v3/oauth/refresh-token', { "refresh_token": refresh_token, "client_id": "system-admin" }, {
            headers: {
                'Authorization': `Bearer ${access_token}`,
                "randomId": "ae9e92ac-b162-4089-9830-1236bddf9761"
            }
        });

        await Model.findByIdAndUpdate(db[0]._id, {
            "access_token": response.data.data.access_token,
            "refresh_token": response.data.data.refresh_token
        });

        res.status(200).send({ msg: "Updated Successfully" })
    } catch (error) {
        console.log("Token Update: ", error.message);
        res.status(403).send(err.message);
    }

})

getUrl.get('/:videoId/hls/:quality/main.m3u8', async (req, res) => {

    try {
        const { videoId, quality } = req.params;

        const db = await Model.find({});
        const access_token = db[0].access_token;

        const mainUrl = `https://d1d34p8vz63oiq.cloudfront.net/${videoId}/hls/${quality}/main.m3u8`
        const policyEncrypted = await axios.post('https://api.penpencil.co/v3/files/send-analytics-data', { 'url': `${mainUrl}` }, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 24_6 like Mac OS X) AppleWebKit/605.5.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1',
                'Content-Type': 'application/json',
                'client-type': 'WEB',
                'Authorization': `Bearer ${access_token}`,
            }
        });

        const keyUrl = `https://sec1.pw.live/${videoId}/hls/enc.key`

        const policyEncryptedKey = await axios.post('https://api.penpencil.co/v3/files/send-analytics-data', { 'url': `${keyUrl}` }, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 24_6 like Mac OS X) AppleWebKit/605.5.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1',
                'Content-Type': 'application/json',
                'client-type': 'WEB',
                'Authorization': `Bearer ${access_token}`,
            }
        });


        const getDecryptCookie = (cookie) => {
            const key = Buffer.from('pw3c199c2911cb437a907b1k0907c17n', 'utf8');
            const iv = Buffer.from('5184781c32kkc4e8', 'utf8');
            const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

            let decryptedCookie = decipher.update(cookie, 'base64', 'utf8');
            decryptedCookie += decipher.final('utf8');
            return decryptedCookie;
        };

        function getDecryption(decyptRes) {
            const parts = decyptRes.data.data.split('&');
            let decryptedResponse = '';
            parts.forEach((part) => {
                const [name, value] = part.split('=');
                const decryptedValue = getDecryptCookie(value);
                decryptedResponse += `${name}=${decryptedValue}&`;
            });
            return decryptedResponse = decryptedResponse.slice(0, -1);
        }
        
        // let decryptedResponse = '';
        // parts.forEach((part) => {
        //     const [name, value] = part.split('=');
        //     const decryptedValue = getDecryptCookie(value);
        //     decryptedResponse += `${name}=${decryptedValue}&`;
        // });
        // decryptedResponse = decryptedResponse.slice(0, -1);

        const decryptedResponse = getDecryption(policyEncrypted);

        const policy_Url = mainUrl + decryptedResponse;

        const main_data = await axios.get(policy_Url);

        res.setHeader('Content-Type', 'text/plain');

        const pattern = /(\d{3,4}\.ts)/g;
        const replacement = `${mainUrl.replace('/main.m3u8', '')}/$1${decryptedResponse}`;
        const newText = main_data.data.replace(pattern, replacement).replace(/URI="[^"]*"/, `URI="${keyUrl+getDecryption(policyEncryptedKey)}"`)

        res.set({ 'Content-Type': 'application/x-mpegURL', 'Content-Disposition': 'attachment; filename="main.m3u8"' });

        res.status(200).send(newText);

    } catch (error) {
        console.log(error.message);
        res.status(403).send({ msg: error.message })
    }
})

module.exports = getUrl;
