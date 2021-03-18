const bcrypt = require('bcrypt');

/*******************
  HELPER FUNCTIONS
********************/

// Get user by email
// Returns user object if found, undefined otherwise
const getUserByEmail = (email, database) => {
  for (let userId in database) {
    if (database[userId].email === email) {
      return database[userId];
    }
  }
};

// Get user by userId
// Returns user object if found, undefined otherwise
const getUserById = (userId, database) => {
  if (database[userId]) return database[userId];
};

// Inserts/updates a URL
const addUrlToDatabase = (longURL, shortURL, userId, database) => {
  // if http:// isn't in given URL, add it
  // TODO: make this more robust
  if (longURL.search(/https*:\/\//) === -1) {
    longURL = 'http://' + longURL;
  }
  database[shortURL] = {
    longURL,
    userId,
    createdAt: new Date(),
    timesVisited: 0,
  };
};

const deleteUrlFromDatabase = (shortURL, database) => {
  delete database[shortURL];
};

const incrementUrlVisits = (shortURL, database) => {
  database[shortURL].timesVisited += 1;
};

// Returns all URLs owned by a given user
const urlsForUser = (userId, database) => {
  const result = {};
  for (let urlId in database) {
    if (database[urlId].userId === userId) {
      result[urlId] = database[urlId];
    }
  }
  return result;
};

// Generates a random 6-char alphanumeric string
// Used for making our short URLs
const generateRandomID = () => {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvxyz';
  const result = [];
  for (let i = 0; i < 6; i++) {
    result.push(chars[Math.floor(Math.random() * chars.length)]);
  }
  return result.join('');
};

// Registers a new user in our database
// Returns the newly generated users ID
const registerNewUser = ({ email, password }, database) => {
  const id = generateRandomID();
  database[id] = {
    id,
    email,
    password: bcrypt.hashSync(password, 10),
  };
  return id;
};

module.exports = { getUserByEmail, getUserById, addUrlToDatabase, deleteUrlFromDatabase, incrementUrlVisits, urlsForUser, generateRandomID, registerNewUser };
