const mongoose=require("mongoose");

const DownloadSchema = new mongoose.Schema({
    fileName: String,
    downloadUrl: String,
    userId: String, 
    timestamp: { type: Date, default: Date.now }
});

const Download = mongoose.model("Download", DownloadSchema)
module.exports=Download;