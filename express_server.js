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
const findUserByEmail = email => {
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

// Deletes a URL
const deleteURL = shortURL => {
  delete urlDatabase[shortURL];
};

// Home -> redirect to /urls
app.get('/', (req, res) => {
  console.log(urlDatabase);
  res.redirect('/urls');
});

// Show all long/short URLs saved
app.get('/urls', (req, res) => {
  const email = findEmailByUserId(req.cookies.user_id);
  const templateVars = { 
    urls: urlDatabase,
    email,
  };
  res.render('urls_index', templateVars);
});

// Create a new short URL
app.post('/urls', (req, res) => {
  const shortURL = generateRandomID();
  let longURL = req.body.longURL;
  insertURL(longURL, shortURL);
  res.redirect(`/urls/${shortURL}`);
});

// Updates the longURL for a given shortURL
app.post('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  insertURL(longURL, shortURL);
  res.redirect(`/urls/${shortURL}`);
});

// Deletes an existing short URL
app.post('/urls/:shortURL/delete', (req, res) => {
  const shortURL = req.params.shortURL;
  deleteURL(shortURL);
  res.redirect('/urls');
});

// Show short URL creation page
app.get('/urls/new', (req, res) => {
  const email = findEmailByUserId(req.cookies.user_id);
  const templateVars = {
    email,
  };
  res.render('urls_new', templateVars);
});

// Show details on an existing short URL
app.get('/urls/:shortURL', (req, res) => {
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
  const email = req.body.email;
  const userId = findUserByEmail(email);
  if (userId) {
    res.cookie('user_id', userId);
    return res.redirect('/urls');
  }
  // user doesn't exist
  res.send('No user exists');
});

// Log out user
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
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
  if (findUserByEmail(email)) {
    return res.status(400).send('User already exists!');
  }
  
  // user doesn't already exist - register them
  const userId = generateRandomID();
  userDatabase[userId] = {
    id: userId,
    email,
    password
  };
  res.cookie('user_id', userId);
  res.redirect('/urls');
  console.log('Registered a new user. Users:');
  console.log(userDatabase);
});

// Run the server
app.listen(PORT, () => {
  console.log(`TinyApp server listening on http://localhost:${PORT}`);
});
