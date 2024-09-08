const mongoose=require("mongoose");

const notesSchema = new mongoose.Schema({
     email:{type:String},
    title:{type:String},
    course:{type:String},
    description:{type:String},
    file_url:{type:String},
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 }
});

const Note = mongoose.model("Note",notesSchema)
module.exports=Note;