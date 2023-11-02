import express from "express";
import path from "path";
import cors from "cors";
import session from "express-session";
import fs from "fs";
import passport from "passport";
import passportLocal from "passport-local"

const app = express();
app.use(cors());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}))
app.use(passport.initialize());
app.use(passport.session());
passport.use(new passportLocal.Strategy({
  usernameField: "email"
},(email,password,done) =>{
  const userPass = users.find((user) => user.email === email);

  if(userPass === undefined){
    return done(null,null, {message: "Incorrect email"})
  }

  if(userPass.password === password) {
    return done(null,userPass);
  }

  done(null,null,{message: "Incorrect password"})
}));

passport.serializeUser((user, done) =>{
   done(null, user.id);
});

passport.deserializeUser((id, done)=>{
  done(null, users.find((user) => user.id === id))
})



app.use(express.json());
app.use(express.static("index.html"));
app.use(express.urlencoded({extended:true}))

app.use((req, res, next) => {
  console.log(req.url);
  next();
});
const users = []


app.post("/register",(req,res) =>{
    const {name,email,password} = req.body

    users.push({id:`${Date.now()}_${Math.random()}`,name,email,password})
    console.log(users)
    res.send('hello')
})

// app.post("/login", passport.authenticate("local",{
//   successRedirect:  res.redirect('/posts/user'),
//   failureRedirect: '/'
// }))

app.get("/user", (req, res) => {

  const {name} = req.query
  fs.promises
  fs.readFile("data.json", "utf8", (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).send("server error");
    }
    let jsonData = JSON.parse(data);
    const result = jsonData.filter((item) => {
      if(name !== undefined && item.name.search(new RegExp(name, 'i')) === -1) {
         return false
      }
      return true
    })
    res.send(result)
  });
});

app.get("/user/:id", (req, res) => {
  const { id } = req.params

  fs.readFile("data.json", "utf8", (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).send("server error");
    }
    let jsonData = JSON.parse(data);
    jsonData = jsonData.find((item)=> +item.id === +id)
    res.send(jsonData);
  });
});
app.delete("/user/:id", (req, res) => {
  const { id } = req.params

  fs.readFile("data.json", "utf8", (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).send("server error");
    }
    let jsonData = JSON.parse(data);
    jsonData = jsonData.filter((item)=> +item.id !== +id)
    fs.promises.writeFile(path.resolve("data.json"), JSON.stringify(jsonData));
    res.send(jsonData);
  });
});

app.put("/user/:id", (req, res) => {

  fs.readFile("data.json", "utf8", (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).send("server error");
    }
    console.log(req.body)
    let jsonData = JSON.parse(data);
    fs.promises.writeFile(path.resolve("data.json"), JSON.stringify(jsonData.map((userItem)=>{
      if(+userItem.id === +req.params.id) {
        userItem = req.body
      }
      return userItem
      
    })));
    res.send(jsonData);
  });
});

app.post("/user", (req, res) => {
  fs.readFile("data.json", "utf8", (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).send("server error");
    }
    let jsonData = JSON.parse(data);
    jsonData.push(req.body);
    fs.promises.writeFile(path.resolve("data.json"), JSON.stringify(jsonData));
    res.send(jsonData);
  });
});
app.get("/text", (req, res) => {
  res.sendFile(path.resolve("index.html"));
});

app.get("/paragraph", (req, res) => {
  res.send("loream ispuns");
});

app.post("/login", (req, res) => {
  console.log(req.body.name);
  res.send("oll is ok");
});

app.listen(process.env.My_APP_PORT);
