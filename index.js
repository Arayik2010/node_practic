import express from "express";
import path from "path";
import cors from "cors";
import fs from "fs";

const app = express();
app.use(cors());

app.use(express.json());

app.use((req, res, next) => {
  console.log(req.url);
  next();
});
// let userData = [
//   { id: 1, name: "karen", age: 30 },
//   { id: 2, name: "hrach", age: 45 },
// ];

app.get("/user", (req, res) => {
  fs.promises
  .readFile(path.resolve("data.json"))
  .then((userData) => res.send(userData));
});

app.post("/user", (req, res) => {
  // userData.push(req.body);
  // res.send(userData);
 
  fs.readFile('data.json','utf8',(err,data)=>{
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
