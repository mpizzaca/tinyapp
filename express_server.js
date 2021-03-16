const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.set('view engine', 'ejs');

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// Generates a random 6-char alphanumeric string
// Used for making our short URLs
const generateRandomString = () => {
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
  const templateVars = { 
    urls: urlDatabase,
    username: req.cookies.username,
  };
  res.render('urls_index', templateVars);
});

// Create a new short URL
app.post('/urls', (req, res) => {
  const shortURL = generateRandomString();
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
  const templateVars = {
    username: req.cookies.username,
  }
  res.render('urls_new', templateVars);
});

// Show details on an existing short URL
app.get('/urls/:shortURL', (req, res) => {
  const templateVars = {
    longURL: urlDatabase[req.params.shortURL],
    shortURL: req.params.shortURL,
    username: req.cookies.username,
  };
  res.render('urls_show', templateVars);
});

// Given short URL, redirect to long URL
app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

// Login user
app.post('/login', (req, res) => {
  const username = req.body.username;
  res.cookie('username', username);
  res.redirect('/urls');
});

// Log out user
app.post('/logout', (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
});

// Run the server
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
