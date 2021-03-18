// Get user by email
// Returns user object if found, undefined otherwise
const getUserByEmail = (email, database) => {
  for (let userId in database) {
    if (database[userId].email === email) {
      return database[userId];
    }
  }
};

// Get email by userId
// Returns email if found, undefined otherwise
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
  console.log('Added new URL. Database:');
  console.log(database);
};

// Deletes a URL
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


module.exports = { getUserByEmail, getUserById, addUrlToDatabase, deleteUrlFromDatabase, incrementUrlVisits, urlsForUser };