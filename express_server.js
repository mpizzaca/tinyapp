const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const app = express();
const PORT = 8080;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('short'));
app.set('view engine', 'ejs');

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const userDatabase = {};

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

// Inserts/updates a URL
const insertURL = (longURL, shortURL) => {
  // if http:// isn't in given URL, add it
  // TODO: make this more robust
  if (longURL.search(/https*:\/\//) === -1) {
    longURL = 'http://' + longURL;
  }
  urlDatabase[shortURL] = longURL;
};

// Get userId by email
// Returns id if found, undefined otherwise
const findUserIdByEmail = email => {
  for (let userId in userDatabase) {
    if (userDatabase[userId].email === email) {
      return userId;
    }
  }
};

// Get email by userId
// Returns email if found, undefined otherwise
const findEmailByUserId = userId => {
  if (userDatabase[userId]) return userDatabase[userId].email;
};

// Registers a new user in our database
// Returns the newly generated users ID
const registerNewUser = ({ email, password }) => {
  const id = generateRandomID()
  userDatabase[id] = {
    id,
    email,
    password
  };
  return id;
};

// checks is userId is valid
// redirects to /login if not
const authenticateUser = () => {
  return (req, res, next) => {
    if(!req.cookies.user_id || !userDatabase[req.cookies.user_id]) {
      return res.redirect('/login');
    }
    next();
  }
};

// Deletes a URL
const deleteURL = shortURL => {
  delete urlDatabase[shortURL];
};

// Home -> redirect to /urls
app.get('/', (req, res) => {
  res.redirect('/urls');
});

// Show all long/short URLs saved
app.get('/urls', authenticateUser(), (req, res) => {
  const email = findEmailByUserId(req.cookies.user_id);
  const templateVars = { 
    urls: urlDatabase,
    email,
  };
  res.render('urls_index', templateVars);
});

// Create a new short URL
app.post('/urls', authenticateUser(), (req, res) => {
  const shortURL = generateRandomID();
  let longURL = req.body.longURL;
  insertURL(longURL, shortURL);
  res.redirect(`/urls/${shortURL}`);
});

// Updates the longURL for a given shortURL
app.post('/urls/:shortURL', authenticateUser(), (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  insertURL(longURL, shortURL);
  res.redirect(`/urls/${shortURL}`);
});

// Deletes an existing short URL
app.post('/urls/:shortURL/delete', authenticateUser(), (req, res) => {
  const shortURL = req.params.shortURL;
  deleteURL(shortURL);
  res.redirect('/urls');
});

// Show short URL creation page
app.get('/urls/new', authenticateUser(), (req, res) => {
  const email = findEmailByUserId(req.cookies.user_id);
  const templateVars = {
    email,
  };
  res.render('urls_new', templateVars);
});

// Show details on an existing short URL
app.get('/urls/:shortURL', authenticateUser(), (req, res) => {
  const email = findEmailByUserId(req.cookies.user_id);
  const templateVars = {
    longURL: urlDatabase[req.params.shortURL],
    shortURL: req.params.shortURL,
    email,
  };
  res.render('urls_show', templateVars);
});

// Given short URL, redirect to long URL
app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

// Show login page
app.get('/login', (req, res) => {
  res.render('login');
});

// Log in user
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const userId = findUserIdByEmail(email);
  // check if users exists
  if (userId) {
    // users exists, check if password is correct
    if (password === userDatabase[userId].password) {
      // user authenticated!
      res.cookie('user_id', userId);
      return res.redirect('/urls');
    }
    // wrong password!
    return res.status(401).send('Password is incorrect!');
  }
  // user doesn't exist
  return res.status(403).send('That user doesn\'t exist!');
});

// Log out user
app.post('/logout', authenticateUser(), (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/login');
});

// Show user registration page
app.get('/register', (req, res) => {
  if (req.cookies.user_id) {
    // user is already registered
    // TODO: display an 'already registered!' error
    return res.redirect('/urls');
  }
  res.render('register');
});

// Register a new user
app.post('/register', (req, res) => {
  const { email, password } = req.body;
  // check if email or password are blank
  if (!email || !password) {
    return res.status(400).send('Email and password cannot be blank!');
  }
  // check if user already exists
  if (findUserIdByEmail(email)) {
    return res.status(400).send('User already exists!');
  }
  
  // user doesn't already exist - register them
  const userId = registerNewUser({ email, password });
  res.cookie('user_id', userId);
  res.redirect('/urls');
  console.log('Registered a new user. Users:');
  console.log(userDatabase);
});

// Run the server
app.listen(PORT, () => {
  console.log(`TinyApp server listening on http://localhost:${PORT}`);
});
