const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const multer = require("multer");
const bcrypt= require("bcrypt")
const session = require("express-session")
const User = require("./models/UserModel.js");
const Student = require("./models/StudentProfile.js");
const Note = require("./models/notes.js");
const Test = require("./models/test.js");
const Download = require("./models/download.js");
const Activity = require("./models/activity.js");
const Teacher = require("./models/teacherModel.js");
const app = express();
const axios = require("axios")
const tnote=require("./models/teacherNote.js")
const nodemailer = require('nodemailer');

app.use(express.urlencoded({ extended: true }));

app.use(session({secret:'not a good secret'}))
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

mongoose.connect('mongodb://localhost:27017/noteRizz');
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error'));
db.once('open', function () {
    console.log('open');
});


app.use(express.static('public'));
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

async function sendNotification(emails, fileUrl,course,title,description)
{
   
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'maureen.miranda.22@spit.ac.in',
            pass: 'osfx olty rohu wwpx'
        }
    });

    let mailOptions = {
        from: 'maureen.miranda.22@spit.ac.in',
        to: emails,
        subject: `${title}`,
        text: `A new file "${title}" has been uploaded for the course "${course}".\n\nDescription: ${description}\n\nKindly check on the NoteRizz website.`
    };
    

    let info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
}
const upload = multer({ storage: storage });

app.get("/", (req, res) => {
    res.render("index.ejs");
});

app.get("/studentlogin", (req, res) => {

    res.render("studentlogin.ejs");
});
//faculty page
app.get("/facultyLogin", (req, res) => {

    res.render("facultyLogin.ejs");
});

app.post("/facultyLogin",async(req,res)=>
{
    const{password,email}=req.body;
    const teacher = await Teacher.findOne({ email: email });
    const result = await bcrypt.compare(password,teacher.password)

    if(result)
    {
        req.session.user_id=teacher._id;
        res.redirect("/studentsForFac")
    }
    else
    {
        res.redirect("/facultyLogin")
    }

})
app.get("/studentsForFac",async(req,res)=>{
   
    const student = await Student.find({});
    res.render("studentsForFac.ejs",{student})
})

app.get("/searchstudent",async(req,res)=>
{
    try {
        const query = req.query.query; 
        const student = await Student.find({FirstName:query});
        res.render("studentsForFac.ejs", {student});
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
})


app.post("/studentlogin",async(req,res)=>
{
    const current = new Date(); 
    const{password,email}=req.body;
    const user = await User.findOne({ email: email });
    const result = await bcrypt.compare(password,user.password)
    req.session.user_id=user._id
    if(result)
    {
        
        let act = await Activity.findOne({ id: req.session.user_id });

    if (!act) {
        
        act = new Activity({ id: req.session.user_id, activitydates: [current] });
    } else {
        
        act.activitydates.push(current);
    }

    await act.save();
        res.redirect("/studentPerf")
    }
    else
    {
        res.redirect("/studentlogin")
    }


})
app.get("/register", async (req, res) => {
    

    res.render("register.ejs");
});

app.get("/teacher",(req,res)=>{
    res.render("teacher.ejs")
})
app.post("/teacher",async(req,res)=>{
    const {email,password,verification}=req.body
    const hash=await bcrypt.hash(password,12)
    const ver="SPIT@TEACHERs";
    if(verification===ver)
    {
    
    const newteacher = new Teacher({
        email,
        password:hash
    })
    await newteacher.save();
    req.session.user_id=newteacher._id;
    res.redirect("studentsForFac")
}
else
{
    res.send("PUT IN THE CORRECT VERIFICATION KEY . GO BACK TO TRY AGAIN")
}

})
app.post("/register",async(req,res)=>{
    const {email,password}=req.body
    const hash=await bcrypt.hash(password,12)
    const newuser = new User({
        email,
        password:hash
    })
    await newuser.save();
    req.session.user_id=newuser._id;
    res.redirect("user")
})
function extractDate(timestamp) {
    
    const date = new Date(timestamp);
    const day = date.getDate();
    
    return day;
}


 

app.get("/studentPerf", async (req, res) => {
    try {
        const t = await Test.findOne({ id: req.session.user_id });
        let act = await Activity.findOne({ id: req.session.user_id });
        if (t) {
            if(act){
            const activitydates = act.activitydates;
            const activitydate=activitydates.map(extractDate);
            console.log(activitydate)
            res.render("studentPerf.ejs", { t ,activitydate});
            }
            else
            {
               const activitydate=[];
            
            res.render("studentPerf.ejs", { t ,activitydate});}
        } else {
            const activitydate=[];
            const defaultTestData = { test: 0, question: 0, score: 0 };
            res.render("studentPerf.ejs", { t: defaultTestData ,activitydate});
        }
    } catch (error) {
        console.error("Error in /studentPerf route:", error);
        res.status(500).send("Internal Server Error");
    }})


    


app.get("/check",(req,res)=>{
    res.render("calendercheck.ejs")
})

app.get("/notesupload", (req, res) => {
    res.render("notesupload.ejs");
});

app.get("/notifications", (req, res) => {
    res.render("notifications.ejs");
});


app.get("/typography", async (req, res) => {
    try {
        
        
        const x = await User.findOne({_id: req.session.user_id});
        const email = x.email;
        const notes = await Note.find({email:email});
        const newStudent=await Student.findOne({Email_address:email});
        const bookmark = await Download.find({userId:req.session.user_id});
       
        if (newStudent) {
            console.log(newStudent._id);
            res.render("typography.ejs", { newStudent: newStudent,notes:notes,bookmark:bookmark});
        } else {
            res.render("user.ejs");
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }

});

app.get("/testres",(req,res)=>
{
    res.render("testres.ejs")
})

app.get("/user", (req, res) => {

    res.render("user.ejs");
});

app.get("/typography/:Email_address", async (req, res) => {
    try {
    const Email_address = req.params.Email_address;
    const x = await User.findOne({email:Email_address});
        
        const notes = await Note.find({email:Email_address});
        const newStudent=await Student.findOne({Email_address:Email_address});
        const bookmark = await Download.find({userId:x._id});
        if (newStudent) {
            res.render("typography.ejs", { newStudent:newStudent,notes:notes,bookmark:bookmark});
        } else {
            res.render("typography.ejs", { newStudent: null });
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.post("/user", upload.single('profilePicture'), async (req, res) => {
    const newStudent = new Student({
        ...req.body,
        profilePicture: req.file ? '/uploads/' + req.file.filename : null
    });
    newStudent.id=req.session.user_id;
    try {
        await newStudent.save();
        res.redirect("/studentPerf");
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});


app.get("/search", async (req, res) => {
    try {
        const query = req.query.query; 
        const found = await Note.find({course:query});
        res.render("notesDown.ejs", {found});
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.get("/notesDown", async(req, res) => {
    const found = await Note.find({}); 
    res.render("notesDown.ejs", {found});
});
app.post("/notesUpload", upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            throw new Error('No file uploaded');
        }

        const { email, title, course, description } = req.body;
        const file_url = '/uploads/' + req.file.filename;
        const note = new Note({
            email,
            title,
            course,
            description,
            file_url
        });
        await note.save();
        res.redirect("/notesDown");
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});


app.post("/download",(req,res)=>{
    console.log(req.body)
  const download=new Download({downloadUrl:req.body.file_url,userId:req.session.user_id,fileName:req.body.fileName})
    download.save();
    res.redirect("/studentPerf")
})

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

app.get("/logout",(req,res)=>{
    req.session.user_id = null;
    res.render("index.ejs")
})



app.get("/test",async(req,res)=>{
    try {
        const x = await axios.get("https://opentdb.com/api.php?amount=10");
        const data = x.data.results;
        res.render("test.ejs", { data: data, message: "" });
    } catch (error) {
        console.error("Error:", error.message);
        res.render("test.ejs", { data: [], message: "" });
    }
})

app.post('/test', async(req, res) => {
    let submittedAnswers = req.body;
    console.log('Submitted Answers:', submittedAnswers);
    
 
    let selectedAnswers = [];
    let correctAnswers = [];
    let questions = [];
    let wrongAnswers = [];
    for (let key in submittedAnswers) {
        if (key.startsWith('answer')) {
            selectedAnswers.push(submittedAnswers[key]);
        } else if (key.startsWith('correctAnswer')) {
            correctAnswers.push(submittedAnswers[key]);
        } else if (key.startsWith('question')) {
            questions.push(submittedAnswers[key]);
        }
    }
    
    console.log('Selected Answers:', selectedAnswers);
    console.log('Correct Answers:', correctAnswers);
    console.log('Questions:', questions);
    
    let quest=0;
    let score = 0;
    for (let i = 0; i < selectedAnswers.length; i++) {
        if (selectedAnswers[i] === correctAnswers[i]) {
            score++;
        } else {
            wrongAnswers.push({
                question: questions[i],
                correctAnswer: correctAnswers[i],
                selectedAnswer: selectedAnswers[i]
            });
        }
        quest++;
    }
    const t = await Test.findOne({id:req.session.user_id})
    if(!t)
    {
        const newtest = new Test({id:req.session.user_id,score:score,test:1,question:quest})
        newtest.save();

    }
    else
    {
        t.score=t.score+score;
        t.question=t.question+quest;
        t.test=t.test+1;
        t.save();
    }
    
    console.log('Score:', score);
    console.log('Wrong Answers:', wrongAnswers);

    res.render("result.ejs", { score: score, wrongAnswers: wrongAnswers });
});



app.post("/divscore",async(req,res)=>
{
    const{branch,div}=req.body;
    const u = await Student.find({Course:branch,Division:div})
console.log(u)
const t=[]
for(let i of u)
{
const temp=await Test.findOne({id:i.id});
console.log(temp)
t.push(temp);
}
    console.log(t)
let x=[];
for(let s of u )
{
    for(let k of t)
    {
        if(k){
        if(s.id===k.id)
        {
x.push({name:s.FirstName,uid:s.Uid,nq:k.question,score:k.score})
        }
    }
    }
}

    res.render("branch.ejs",{x});
        });

   app.get("/selection",(req,res)=>{
    res.render("selection.ejs");
   })


   app.get("/branch",(req,res)=>{
    res.render("branch.ejs");
   })
   app.get("/teacherUpload",(req,res)=>{
    res.render("teacherUpload.ejs")
   })
  
  
app.post("/teacherUpload", upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            throw new Error('No file uploaded');
        }

        const { div, title, course, description } = req.body;
        const file_url = '/uploads/' + req.file.filename;
        const notes = new tnote({
            div,
            title,
            course,
            description,
            file_url
        });
        await notes.save();
        const emailcands= await Student.find({Course:course,Division:div})
      const email=emailcands.map(emailcand=>emailcand.Email_address)
      console.log(email)
      await sendNotification(email,file_url,course,title,description);
        res.redirect("/teacherUpload");
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});
app.get("/teachernotes",async(req,res)=>{
    
    const notes=await tnote.find({})

    res.render("teachernotes.ejs",{notes})
})
app.post("/like", async (req, res) => {
    try {
        const { file_url } = req.body;
        const note = await Note.findOne({ file_url: file_url });
        note.likes = note.likes + 1;
        await note.save();
        const found = await Note.find({});
        res.render("notesDown.ejs", { found });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.post("/dislike", async (req, res) => {
    try {
        const { file_url } = req.body;
        const note = await Note.findOne({ file_url: file_url });
        note.dislikes = note.dislikes + 1;
        await note.save();
        const found = await Note.find({});
        res.render("notesDown.ejs", { found });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
});
