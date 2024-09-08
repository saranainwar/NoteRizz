const mongoose=require("mongoose");

const testSchema = new mongoose.Schema({
     id:{type:String},
    score:{type:Number},
    test:{type:Number},
    question:{type:Number}
});

const Test = mongoose.model("Test",testSchema)
module.exports=Test;


