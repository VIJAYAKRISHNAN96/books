const express = require("express");
const path = require('path');
const bodyparser = require('body-parser');
require("dotenv").config();
const mongoose = require("mongoose");
const PORT = process.env.PORT || 4000


//    const adminController = require("./controllers/adminController");
const adminRouter = require("./routes/adminRouter");
const userRouter = require("./routes/userRouter");
const session = require("express-session");

const app= express();

 app.set("view engine","ejs")

 mongoose.connect(process.env.MONGO_URL).then(() => console.log('MongoDB connected successfully'))
 .catch(err => console.error('MongoDB connection error:', err));
 
app.use(express.json());
app.use(express.urlencoded({extended:true}));

 app.set("views",[
    path.join(__dirname,"views/admin"),
    path.join(__dirname,"views/user"),
    path.join(__dirname,"views/partials")
 ])
 app.use(express.static(path.join(__dirname,"public")));

  
  app.use(
   session({
     secret: 'secret',
     resave: false,
     saveUninitialized: true,
    //  store: MongoStore.create({ mongoUrl: process.env.MONGO_URL }),
     cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 },
   })
 );
 app.use(express.json());
 


 app.use((req, res, next) => {
  console.log('Session on every request:', req.session);
   res.locals.user = req.session.user || null;
   next();
 });

app.use("/",userRouter);
app.use("/admin",adminRouter);


app.listen(PORT , ()=>{
   console.log("http://localhost:"+ process.env.PORT ," server running");
})



