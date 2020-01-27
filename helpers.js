const getUserByEmail = function(email, database) {
  for (let user in database) {
    if (database[user]['email'] === email) return database[user];
  }
}

const userUrls = function(id, urlDatabase) {
  let obj = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url]['userID'] === id) {
      obj[urlDatabase[url]['shortURL']] = urlDatabase[url];
    }
  }
  return obj;
};

const isLoggedIn = function(idCookie, users) {
  for (let element in users) {
    if (users[element]['id'] === idCookie) {
      return true;
    }
  }
  return false;
};

const isRegistered = function(email, users) {
  for (let user in users) {
    if (users[user]['email'] === email) return true;
  }
  return false;
};

const generateRandomString = function() {
  const length = 6;
  return Math.round((Math.pow(36, length + 1) - Math.random() * Math.pow(36, length))).toString(36).slice(1);
};

module.exports = { getUserByEmail, userUrls, isLoggedIn, isRegistered, generateRandomString };