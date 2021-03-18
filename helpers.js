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

module.exports = { getUserByEmail, getUserById };