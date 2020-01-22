const express = require("express");
const cookieParser = require('cookie-parser')
const app = express();
const PORT = 8080; // default port 8080

function generateRandomString() {
  const length = 6;
  return Math.round((Math.pow(36, length + 1) - Math.random() * Math.pow(36, length))).toString(36).slice(1);
}

function isRegistered(email) {
  for (let user in users) {
    if (users[user]['email'] === email) return true;
  }
  return false;
}

app.set("view engine", "ejs");
app.use(cookieParser());

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  let templateVars = { userID: req.cookies["userID"], userDatabase: users, urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/hello", (req, res) => {
  let templateVars = { greeting: 'Hello World!' };
  res.render("hello_world", templateVars);
});

app.get("/registration", (req, res) => {
  let templateVars = { userID: req.cookies["userID"], userDatabase: users };
  res.render("register", templateVars);
});

app.get("/login", (req, res) => {
  let templateVars = { userID: req.cookies["userID"], userDatabase: users };
  res.render("login", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { userDatabase: users, userID: req.cookies["userID"], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post("/register", (req, res) => {
  if (req.body.email === "" || req.body.password === "") {
    res.status(400);
    res.redirect("/registration");
  } else if (isRegistered(req.body.email)) {
    res.status(400);
    res.redirect("/registration");
  } else {
    let uID = generateRandomString();
    users[uID] = {
      id: uID,
      email: req.body.email,
      password: req.body.password
    }
    res.cookie('userID', uID);
    res.redirect("/urls/");
  }
}) 

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls/");
}) 

app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.newLongURL;
  res.redirect("/urls/");
});

app.post("/urls", (req, res) => {
  let uniqueID = generateRandomString();
  urlDatabase[uniqueID] = req.body['longURL'];
  res.redirect("/urls/" + uniqueID);
});

app.post("/login", (req, res) => {
  if (!isRegistered(req.body.email)) {
    res.status(403)
    res.redirect("/login");
  } else {
    let ID = '';
    for (userIds in users) {
      if (users[userIds]['email'] === req.body.email) {
        ID = userIds;
      }
    }

    if (users[ID]['password'] !== req.body.password) {
      res.status(403)
      res.redirect("/login");
    } else {
      res.cookie('userID', ID);
      res.redirect("/urls");
    }
  }
})

app.post("/logout", (req, res) => {
  res.clearCookie('userID');
  res.redirect("/urls");
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});