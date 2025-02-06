const express = require("express");
const jwt = require("jsonwebtoken");
const { body } = require("express-validator");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const SECRET_KEY = "my_secret_key"; 

//store users and scores
let users = []; 
let scores = [];

// Middleware for authenticating JWT tokens
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader? authHeader.split(" ")[1]:"null";

  if (!token) return res.status(401).json({ message: "Unauthorized" });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(401).json({ message: "Unauthorized" });
    req.user = user;
    next();
  });
};

// Register User
app.post(
    "/signup",(req, res) => {
      const { userHandle, password } = req.body;
      
      if (
        typeof userHandle === "string" &&
        typeof password === "string" &&
        userHandle.length >= 6 &&
        password.length >= 6
      ) {
        users.push({ userHandle, password });
        return res.status(201).send("User registered successfully");
      }
      
      return res.status(400).send("Invalid request body");
    }
);

// Login User
app.post("/login", (req, res) => {
  const { userHandle, password } = req.body;

  if (
    typeof userHandle !== "string" ||
    typeof password !== "string" ||
    userHandle.length < 6 ||
    password.length < 6
  ) {
    return res.status(400).send("Invalid request body");
  }

  if (!userHandle||!password) {
    return res.status(400).send("Invalid request body");
  }

  const allowedFields = ["userHandle", "password"];
  const invalidFields = Object.keys(req.body).filter(field => !allowedFields.includes(field));
  if (invalidFields.length > 0) {
    return res.status(400).json({ message: "Invalid fields in request body" });
  }

  const isUser = users.find((user) => user.userHandle === userHandle && user.password === password);
    
  if (isUser) {
    const token = jwt.sign({ userHandle: isUser.userHandle },SECRET_KEY);
    return res.status(200).json({ jsonWebToken: token });
      
  }
  
  res.status(401).json({ message: "Incorrect username or password" });
    
});

app.post("/high-scores", authenticateToken, (req, res) => {
  const { level, userHandle, score, timestamp } = req.body;

  if (!level || !userHandle || !score || !timestamp) {
    return res.status(400).json({ message: "Invalid request body" });
  }

  scores.push({ level, userHandle, score, timestamp });
  res.status(201).json({ message: "High score posted successfully" });
});
// Get High Scores
// app.get("/high-scores", (req, res) => {
//     const topScores = scores.sort((a, b) => b.score - a.score).slice(0, 10);
//     res.json(topScores);
// });
app.get("/high-scores", (req, res) => {
  const { level, page = 1 } = req.query;
  if (!level) {
    return res.status(400).json({ message: "Level is required" });
  }

  const filteredScores = scores
    .filter((score) => score.level === level)
    .sort((a, b) => b.score - a.score);

  const pageSize = 20;
  const paginatedScores = filteredScores.slice((page - 1) * pageSize, page * pageSize);

  res.status(200).json(paginatedScores);
});


// Start server
let serverInstance = null;
module.exports = {
    start: function () {
        serverInstance = app.listen(port, () => {
            console.log(`Server running at http://localhost:${port}`);
        });
    },
    close: function () {
        serverInstance.close();
    },
};
