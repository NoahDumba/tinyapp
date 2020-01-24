const express = require("express");
const bcrypt = require('bcrypt');
const { getUserByEmail } = require('./helpers');
const cookieParser = require('cookie-session');
const methodOverride = require('method-override');
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(cookieParser({
  name: 'userID',
  keys: ['a-very-super-secret-key-shhhh-dont-tell-anyone']
}));
// override with POST having ?_method=DELETE
app.use(methodOverride('_method'));

const generateRandomString = function() {
  const length = 6;
  return Math.round((Math.pow(36, length + 1) - Math.random() * Math.pow(36, length))).toString(36).slice(1);
};

const isRegistered = function(email) {
  for (let user in users) {
    if (users[user]['email'] === email) return true;
  }
  return false;
};

const isLoggedIn = function(idCookie) {
  for (let element in users) {
    if (users[element]['id'] === idCookie) {
      return true;
    }
  }
  return false;
};

const userUrls = function(id) {
  let manta = [];
  for (let url in urlDatabase) {
    if (urlDatabase[url]['userID'] === id) {
      manta[urlDatabase[url]['shortURL']] = urlDatabase[url];
    }
  }
  return manta;
};

// function getUserByEmail(email, database) {
//   for (let user in database) {
//     if (database[user]['email'] === email) return database[user];
//   }
// }

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10)
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk", 10)
  }
};

const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", shortURL: "b2xVn2", userID: "userRandomID"},
  "9sm5xK": { longURL: "http://www.google.com", shortURL: "9sm5xK", userID: "userRandomID"}
};

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.get("/", (req, res) => {
  if (!req.session["userID"] || !isLoggedIn(req.session["userID"])) {
    res.redirect('/login');
  } else {
    res.redirect('/urls');
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  let templateVars = { userID: req.session["userID"], userDatabase: users, urls: userUrls(req.session["userID"]) };
  res.render("urls_index", templateVars);
});

app.get("/hello", (req, res) => {
  let templateVars = { greeting: 'Hello World!' };
  res.render("hello_world", templateVars);
});

app.get("/registration", (req, res) => {
  if (req.session["userID"] && isLoggedIn(req.session["userID"])) res.redirect("/urls");
  else {
    let templateVars = { userID: req.session["userID"], userDatabase: users };
    res.render("register", templateVars);
  }
});

app.get("/login", (req, res) => {
  if (isLoggedIn(req.session["userID"])) res.redirect("/urls");
  else {
    let templateVars = { userID: req.session["userID"], userDatabase: users };
    res.render("login", templateVars);
  }
});

app.get("/urls/new", (req, res) => {
  let templateVars = { userID: req.session["userID"], userDatabase: users };

  if (isLoggedIn(req.session["userID"])) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get("/urls/:shortURL", (req, res) => {
  const myURLS = userUrls(req.session['userID']);
  let urlExists = false;
  for (let url in urlDatabase) {
    if (urlDatabase[url]['shortURL'] === req.params.shortURL) urlExists = true;
  }
  if (!urlExists) res.send("This URL does not exist");
  else {
    let templateVars = { userDatabase: users, userID: req.session["userID"], urls: myURLS, shortURL: urlDatabase[req.params.shortURL]["shortURL"], longURL: urlDatabase[req.params.shortURL]["longURL"] };
    res.render("urls_show", templateVars);
  }
});

app.get("/u/:shortURL", (req, res) => {
  let urlExists = false;
  for (let url in urlDatabase) {
    if (urlDatabase[url]['shortURL'] === req.params.shortURL) urlExists = true;
  }
  if (!urlExists) res.send("This URL does not exist");
  else {
    const longURL = urlDatabase[req.params.shortURL]["longURL"];
    res.redirect(longURL);
  }
});

app.post("/register", (req, res) => {
  if (req.body.email === "" || req.body.password === "") {
    res.status(400);
    res.send("Some fields missing data");
  } else if (isRegistered(req.body.email)) {
    res.status(400);
    res.send("This email is already registered");
  } else {
    let uID = generateRandomString();
    users[uID] = {
      id: uID,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10)
    };
    req.session.userID = uID;
    res.redirect("/urls/");
  }
});

app.delete("/urls/:shortURL", (req, res) => {
  if (isLoggedIn(req.session["userID"])) {
    delete urlDatabase[req.params.shortURL];
  } else {
    res.send("Oi! That's not your URL to delete!");
  }
  res.redirect("/urls/");
});

app.put("/urls/:shortURL", (req, res) => {
  if (isLoggedIn(req.session["userID"])) {
    urlDatabase[req.params.shortURL]["longURL"] = req.body.newLongURL;
  } else {
    res.send("Oi! That's not your URL to edit!");
  }
  res.redirect("/urls/");
});

app.post("/urls", (req, res) => {
  let uniqueID = generateRandomString();
  urlDatabase[uniqueID] = {
    longURL: req.body.longURL,
    shortURL: uniqueID,
    userID: req.session["userID"]
  };
  res.redirect("/urls/" + uniqueID);
});

app.post("/login", (req, res) => {
  if (!isRegistered(req.body.email)) {
    res.status(403);
    res.send("This email is not registered");
  } else {
    let ID = getUserByEmail(req.body.email, users)['id'];
    // for (userIds in users) {
    //   if (users[userIds]['email'] === req.body.email) {
    //     ID = userIds;
    //   }
    // }

    if (!bcrypt.compareSync(req.body.password, users[ID]['password'])) {
      res.status(403);
      res.send("Incorrect Password");
    } else {
      req.session.userID = ID;
      res.redirect("/urls");
    }
  }
});

app.delete("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});