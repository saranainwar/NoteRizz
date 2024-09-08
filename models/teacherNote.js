const mongoose=require("mongoose");

const teacherNoteSchema = new mongoose.Schema({
     div:{type:String},
    title:{type:String},
    course:{type:String},
    description:{type:String},
    file_url:{type:String}
});

const tnote = mongoose.model("Tnote",teacherNoteSchema)
module.exports=tnote;











