const mongoose = require("mongoose")
const teacherSchema = mongoose.Schema(
    {
    email:{type:String,required:true},
    password:{type:String,required:true}
   }
)

const Teacher = mongoose.model("Teacher",teacherSchema);

 module.exports=Teacher;