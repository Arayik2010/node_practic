const express = require("express");
const { path } = require("path");
const cors = require("cors");
const { fs } = require("fs");
const { connectToDb, getDb } = require("./db");
const { ObjectId } = require("mongodb");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const passport = require("passport");
const passportLocal = require("passport-local");

const app = express();
app.use(
  cors({
    origin: "http://localhost:3000", // Allow requests from localhost:3000
    credentials: true, // Allow cookies and session sharing
  })
);
app.use(express.json());
app.use(express.static("index.html"));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 60 * 1000,
      httpOnly: true,
      secure: false,
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new passportLocal.Strategy(
    {
      usernameField: "email",
    },
    async (email, password, done) => {
      fs.readFile("user.data.json", "utf8", (err, data) => {
        if (err) {
          console.error(err);
          return res.status(500).send("server error");
        }
        let users = JSON.parse(data);
        const user = users.find((user) => user.email === email);

        if (user === undefined) {
          return done(null, null, { message: "Incorrect email" });
        }
        if (bcrypt.compare(password, user.password)) {
          return done(null, user);
        }
        done(null, null, { message: "Incorrect password" });
      });
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  fs.readFile("user.data.json", "utf8", (err, data) => {
    if (err) return done(err);

    let users = JSON.parse(data);
    const user = users.find((user) => user.id === id);
    done(null, user || false);
  });
});

let db;

connectToDb((err) => {
  if (!err) {
    app.listen(process.env.USER_DATA, (err) => {
      err
        ? console.log(err)
        : console.log(`Listening port ${process.env.USER_DATA}`);
    });
    db = getDb();
  } else {
    console.log(`Connection error: ${err}`);
  }
});

const users = [];

app.get("/user", (req, res) => {
  const userItems = [];

  db.collection("user")
    .find()
    .forEach((user) => userItems.push(user))
    .then(() => {
      res.status(200).json(userItems);
    })
    .catch(() => {
      res.status(500).json("someting wrong");
    });
});

app.get("/user/:id", (req, res) => {
  db.collection("user")
    .findOne({ _id: new ObjectId(req.params.id) })
    .then((doc) => {
      res.status(200).json(doc);
    })
    .catch(() => {
      res.status(500).json("someting wrong");
    });
});

app.delete("/user/:id", (req, res) => {
  db.collection("user")
    .deleteOne({ _id: new ObjectId(req.params.id) })
    .then((result) => {
      res.status(200).json(result);
    })
    .catch(() => {
      res.status(500).json("someting wrong");
    });
});

app.post("/user", (req, res) => {
  db.collection("user")
    .insertOne(req.body)
    .then((result) => {
      res.status(200).json(result);
    })
    .catch(() => {
      res.status(500).json("someting wrong");
    });
});

app.patch("/user/:id", (req, res) => {
  db.collection("user")
    .updateOne({ _id: new ObjectId(req.params.id) }, { $set: req.body })
    .then((result) => {
      res.status(200).json(result);
    })
    .catch(() => {
      res.status(500).json("someting wrong");
    });
});

app.get("/userName", (req, res) => {
  const userItems = [];
  const { name } = req.query;
  console.log(name);

  db.collection("user")
    .find({ name: new RegExp(name, "i") })
    .forEach((user) => userItems.push(user))
    .then(() => {
      res.status(200).json(userItems);
    })
    .catch(() => {
      res.status(500).json("someting wrong");
    });
});

app.post("/register", async (req, res) => {
  try {
    console.log(req.body);
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existingUser = await db.collection("userId").findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Hash the password
    const hashedPwd = await bcrypt.hash(password, 10);

    // Insert into MongoDB
    await db.collection("userId").insertOne({
      name,
      email,
      password: hashedPwd,
      createdAt: new Date(),
    });

    res.status(201).json({ message: "User registered" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if all fields are provided
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Find user in MongoDB
    const user = await db.collection("userId").findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.SESSION_SECRET,
      { expiresIn: "10m" }
    );

    // Set cookie with token
    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // Set to true in production (HTTPS required)
      sameSite: "Lax",
      maxAge: 10 * 60 * 1000, // 10 minutes
    });

    res.json({
      message: "Login successful",
      user: { id: user._id, email: user.email },
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

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

// app.put("/user/:id", (req, res) => {

//   fs.readFile("data.json", "utf8", (err, data) => {
//     if (err) {
//       console.error(err);
//       return res.status(500).send("server error");
//     }
//     console.log(req.body)
//     let jsonData = JSON.parse(data);
//     fs.promises.writeFile(path.resolve("data.json"), JSON.stringify(jsonData.map((userItem)=>{
//       if(+userItem.id === +req.params.id) {
//         userItem = req.body
//       }
//       return userItem

//     })));
//     res.send(jsonData);
//   });
// });

// app.post("/user", (req, res) => {
//   fs.readFile("data.json", "utf8", (err, data) => {
//     if (err) {
//       console.error(err);
//       return res.status(500).send("server error");
//     }
//     let jsonData = JSON.parse(data);
//     jsonData.push(req.body);
//     fs.promises.writeFile(path.resolve("data.json"), JSON.stringify(jsonData));
//     res.send(jsonData);
//   });
// });
// app.get("/text", (req, res) => {
//   res.sendFile(path.resolve("index.html"));
// });

app.get("/paragraph", (req, res) => {
  res.send("loream ispuns");
});

app.post("/login", (req, res) => {
  console.log(req.body.name);
  res.send("oll is ok");
});

// app.listen(process.env.USER_DATA);
