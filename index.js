const express = require ("express");
const {path} = require  ("path");
const cors = require ("cors");
const {fs} = require ("fs");
const { connectToDb, getDb } =  require ('./db')
const {ObjectId} = require('mongodb');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("index.html"));
app.use(express.urlencoded({extended:true}))

app.use((req, res, next) => {
  console.log(req.url);
  next();
});

let db

connectToDb((err) => {
    if (!err) {
        app.listen(process.env.USER_DATA, (err) => {
            err ? console.log(err) : console.log(`Listening port ${process.env.USER_DATA}`)
        });
        db = getDb()
    }else {
        console.log(`Connection error: ${err}`)

    }
})

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



app.get('/user', (req,res) => {
  const userItems = [];

  db
  .collection('user')
  .find()
  .forEach((user) => userItems.push(user))
  .then(() => {
      res.status(200).json(userItems)
  })
 .catch(() => {
  res.status(500).json('someting wrong')
 })
})

app.get('/user/:id', (req,res) => {

  db
  .collection('user')
  .findOne({_id: new ObjectId(req.params.id)})
  .then((doc) => {
      res.status(200).json(doc)
  })
 .catch(() => {
  res.status(500).json('someting wrong')
 })
})

app.delete('/user/:id', (req,res) => {
 
  db
  .collection('user')
  .deleteOne({_id: new ObjectId(req.params.id)})
  .then((result) => {
      res.status(200).json(result)
  })
 .catch(() => {
  res.status(500).json('someting wrong')
 })
})

// app.get("/user", (req, res) => {
//   const {name} = req.query
//   fs.promises
//   fs.readFile("data.json", "utf8", (err, data) => {
//     if (err) {
//       console.error(err);
//       return res.status(500).send("server error");
//     }
//     let jsonData = JSON.parse(data);
//     const result = jsonData.filter((item) => {
//       if(name !== undefined && item.name.search(new RegExp(name, 'i')) === -1) {
//          return false
//       }
//       return true
//     })
//     res.send(result)
//   });
// });

// app.get("/user/:id", (req, res) => {
//   const { id } = req.params

//   fs.readFile("data.json", "utf8", (err, data) => {
//     if (err) {
//       console.error(err);
//       return res.status(500).send("server error");
//     }
//     let jsonData = JSON.parse(data);
//     jsonData = jsonData.find((item)=> +item.id === +id)
//     res.send(jsonData);
//   });
// });

// app.delete("/user/:id", (req, res) => {
//   const { id } = req.params

//   fs.readFile("data.json", "utf8", (err, data) => {
//     if (err) {
//       console.error(err);
//       return res.status(500).send("server error");
//     }
//     let jsonData = JSON.parse(data);
//     jsonData = jsonData.filter((item)=> +item.id !== +id)
//     fs.promises.writeFile(path.resolve("data.json"), JSON.stringify(jsonData));
//     res.send(jsonData);
//   });
// });




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

// app.listen(process.env.USER_DATA);
