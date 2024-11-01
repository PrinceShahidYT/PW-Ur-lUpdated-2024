const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
    access_token: { type: String },
    refresh_token: { type: String },
    main_url: { type: String }
});

const Model = mongoose.model("Admin", policySchema);

module.exports = Model;
