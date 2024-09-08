const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema({
    id: { type: String },
    activitydates: [{ type: Date }] 
});

const Activity = mongoose.model("Activity", activitySchema); 
module.exports = Activity; 







