express=require("express")
app=express()
app.use(express.json())
let cors=require("cors")
app.use(cors())
let jwt=require("jsonwebtoken")
let {MongoClient}=require("mongodb")
//app.use(express.urlencoded({ extended: true }));
let multer=require("multer")

path=require("path")
const nodemailer=require("nodemailer")


app.post("/user/save",async(req,res)=>
{
uri="mongodb://localhost:27017/"
client=new MongoClient(uri)
await client.connect()
let db=client.db("customer")
let usercolllection=db.collection("details")
let email=req.body.email
let password=req.body.password
let name=req.body.name
let dob=req.body.dob
let gender=req.body.gender
let date={email:email,password:password,name:name,dob:dob,gender:gender}
if(await usercolllection.findOne({email:email})===null){
await usercolllection.insertOne(date)
res.json({message:"signup successfully"})}
else
res.json({message:"user already exist"})
})





app.post("/user/login",async(req,res)=>
{
uri="mongodb://localhost:27017/"
client=new MongoClient(uri)
await client.connect()
let db=client.db("customer")
let usercolllection=db.collection("details")
let email=req.body.email
let password=req.body.password

let data=await usercolllection.findOne({email:email})
console.log(data)
if(data==null)
    res.json({message:"invalid user"})
else if(data.password==password){
  let payload={email:email}
  let secretKey="`~!@#$%^&*"
  let options={expiresIn:'200h'}
  let token=jwt.sign(payload,secretKey,options)
res.json({message:"thank you",token:token})
  }
  else
  res.json({message:"invalid password"})})


app.post("/user/sendreq",async(req,res)=>
{
uri="mongodb://localhost:27017/"
client=new MongoClient(uri)
await client.connect()
let db=client.db("customer")
let usercolllection=db.collection("friends")
let token=req.body.token
let payload=jwt.verify(token,"`~!@#$%^&*")
let emails=payload.email
let reci=req.body.rec

const now = new Date();

const day = now.getDate();         
const month = now.getMonth() + 1;   
const year = now.getFullYear();      

const doreq=`${day}-${month}-${year}`
if(reci===emails)
  res.json({"message":"sorry invaild input"})
else if(await usercolllection.findOne({$or:[{$and:[{sender:emails},{receiver:reci}]},{$and:[{sender:reci},{receiver:emails}]},{$and:[{sender:emails},{receiver:emails}]}]})===null)
{await usercolllection.insertOne({receiver:reci,sender:emails,status:"0",doreq:doreq})
 res.json({message:"friend request sent successfully"})}
else
res.json({message:"friend request already sent"})
})

app.post("/user/acceptreq",async(req,res)=>
{

uri="mongodb://localhost:27017/"
client=new MongoClient(uri)
await client.connect()
let db=client.db("customer")
let usercolllection=db.collection("friends")
let token=req.body.token
let payload=jwt.verify(token,"`~!@#$%^&*")
let emailr=payload.email
let sender=req.body.sender
await usercolllection.updateOne({$and:[{sender:sender},{receiver:emailr}]},{$set:{status:"1"}})
res.json({msg:"accepted request"})
})


app.post("/user/rejectreq",async(req,res)=>
{
uri="mongodb://localhost:27017/"
client=new MongoClient(uri)
await client.connect()
let db=client.db("customer")
let usercolllection=db.collection("friends")
let token=req.body.token
let payload=jwt.verify(token,"`~!@#$%^&*")
let emailr=payload.email
let sender=req.body.sender
await usercolllection.updateOne({$and:[{sender:sender},{receiver:emailr}]},{$set:{status:"2"}})
res.json({message:"request rejected"})
})



app.post("/user/pendingreq",async(req,res)=>
{
uri="mongodb://localhost:27017/"
client=new MongoClient(uri)
await client.connect()
let db=client.db("customer")
let usercolllection=db.collection("friends")
let token=req.body.token
let payload=jwt.verify(token,"`~!@#$%^&*")
let emailr=payload.email

let pendingf=await usercolllection.find({$and:[{receiver:emailr},{status:'0'}]},{sender:1,_id:0}).toArray()
res.json({pendingfemail:pendingf})
})


app.post("/user/friendlist",async(req,res)=>
{
uri="mongodb://localhost:27017/"
client=new MongoClient(uri)
await client.connect()
let db=client.db("customer")
let usercolllection=db.collection("friends")
let payload=jwt.verify(token,"`~!@#$%^&*")
let emails=payload.email

let data=await usercolllection.find({$and:[{$or:[{sender:emails},{receiver:emails}]},{status:1}]},{sender:1,receiver:1}).toArray()
let friends=[]
for(let i of data)
{
  if(i.sender===emails)
    friends.push(i.receiver)
  else
  friends.push(i.sender)

}

res.json({friends:friends})
})


app.post("/user/wpost",async(req,res)=>
{
uri="mongodb://localhost:27017/"
client=new MongoClient(uri)
await client.connect()
let db=client.db("customer")
let usercolllection=db.collection("wpost")
let payload=jwt.verify(token,"`~!@#$%^&*")
let emails=payload.email
let message=req.body.message

const day = now.getDate();         
const month = now.getMonth() + 1;   
const year = now.getFullYear();      

const dopost=`${day}-${month}-${year}`


await usercolllection.insertOne({sender:emails,message:message,dopost:dopost})
})

app.post("/user/postvisible",async(req,res)=>
{
uri="mongodb://localhost:27017/"
client=new MongoClient(uri)
await client.connect()
let db=client.db("customer")
let usercolllection=db.collection("friends")
let payload=jwt.verify(token,"`~!@#$%^&*")
let emails=payload.email

let data=await usercolllection.find({$and:[{$or:[{sender:emails},{receiver:emails}]},{status:1}]},{sender:1,receiver:1}).toArray()
let friends=[]
for(let i of data)
{
  if(i.sender===emails)
    friends.push(i.receiver)
  else
  friends.push(i.sender)

}
friends.push(emails)
  


let usercollection=db.collection("wpost")
let detail=await usercollection.find().toArray()
post=[]
for(let i of detail){
  if(friends.includes(i.sender))
   post.push(i.message)

  res.json({post:post})
}})
app.get("/dispall/:page/:limit",(req,res)=>{
  const ramayanNames = [
  "Ram", "Sita", "Lakshman", "Bharat", "Shatrughna", "Hanuman", "Ravan", "Vibhishan",
  "Kumbhkaran", "Dasharath", "Kaushalya", "Kaikeyi", "Sumitra", "Janak", "Urmila",
  "Mandavi", "Shrutakirti", "Jatayu", "Sugriv", "Vali", "Angad", "Jamvant", "Shabari",
  "Ahilya", "Vashishtha", "Vishwamitra", "Indrajit", "Tara", "Trijata", "Luv", "Kush",
  "Sampati", "Sulochana", "Marich", "Subahu", "Sharanya", "Manthara", "Shatanand",
  "Agastya", "Brahma", "Narad", "Shiva", "Parvati"
];
page=req.params.page
limit=req.params.limit
start=(page-1)*limit
end=Math.min(ramayanNames.length,page*limit)
res.json({name:ramayanNames.slice(start,end)})

})


app.use("/uploads",express.static("uploads"))
const storage=multer.diskStorage({destination:(req,file,cb)=>{cb(null,"uploads/")} 
,filename:(req,file,cb)=>{
  cb(null,Date.now()+path.extname(file.originalname))
}})
const fileFilter=(req,file,cb)=>{const allowedtypes=["image/jpeg","image/png"]
  if(allowedtypes.includes(file.mimetype))
    cb(null,true)
  else
  cb(new Error("only .jpeg and .png file are allowed"),false)
}
const MAX_SIZE=2*1024*1024
const upload = multer({ 
  storage, 
  fileFilter, 
  limits: { fileSize: MAX_SIZE } 
});
app.post("/upload",(req,res)=>{
  upload.single("image")(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "File size should not exceed 2MB" });
      }
      return res.status(400).json({ message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ message: "Invalid file type. Only .jpg and .png are allowed." });
    }
    console.log(req.file.filename)
    res.json({ imageUrl: `/uploads/${req.file.filename}` });
    
})})



app.post("/change",async(req,res)=>{
  
uri="mongodb://localhost:27017/"
client=new MongoClient(uri)
await client.connect()
let db=client.db("customer")
let usercolllection=db.collection("details")
let email=req.body.email
let password=req.body.pass
await usercolllection.updateOne({email:email},{$set:{password:password}})
client.close()
})

app.post("/check",async(req,res)=>{
  
uri="mongodb://localhost:27017/"
client=new MongoClient(uri)
await client.connect()
let db=client.db("customer")
let usercolllection=db.collection("details")
let email=req.body.email
if(await usercolllection.findOne({email:email}))
  res.json({message:"matched"})
})



app.post("/sendotp",(req,res)=>{
  let email=req.body.email
  let otp=req.body.otp
  console.log(email)
   transporter=nodemailer.createTransport({
    service:"gmail",
    auth:{
        user:"agshashank0504@gmail.com",
        pass:"wvvz zgrh opok xnjd"

    }
})
let mailoptions={
    from:'"shashank agarwal" <agshashank0504@gmail.com>',
    to:email,
    subject:"OTP VERIFICATION"
    ,text:`YOUR OTP IS ${otp}
    DO NOT SHARE WITH ANYONE`
}
transporter.sendMail(mailoptions,(err,info)=>{
    if(err)
        console.log("error is",err)
    else
    console.log("successful")
})})

app.post("/user/changepass",async(req,res)=>{
  let npassword=req.body.npassword
  let cpassword=req.body.cpassword
  let email=req.body.email
   
uri="mongodb://localhost:27017/"
client=new MongoClient(uri)
await client.connect()
let db=client.db("customer")
let usercolllection=db.collection("details")

  if(npassword===cpassword){
    await usercolllection.updateOne({email:email},{$set:{password:npassword}})
    res.json({message:"updated successfully"})
  }
  else{
    res.json({message:"enter password carefully"})
  }

})


app.listen(8000)

