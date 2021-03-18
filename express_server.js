const express = require('express');
const bodyParser = require('body-parser');
// const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const morgan = require('morgan');
const bcrypt = require('bcrypt');
const app = express();
const PORT = 8080;

app.use(bodyParser.urlencoded({ extended: true }));
// app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: ['j094jf', '40j3g0'],
}));
app.use(morgan('short'));
app.set('view engine', 'ejs');

// clear invalid cookies (ie. where request contains a cookie but no such user exists in our db)
const clearInvalidCookies = (req, res, next) => {
  if (req.session.user_id) {
    if (!findEmailByUserId(req.session.user_id)) {
      req.session.user_id = null;
    }
  }
  next();
};
app.use(clearInvalidCookies);

/*******************
  DATABASES / STORAGE
********************/
const urlDatabase = {};
// Example url entry:
// "9sm5xK": {
//   longURL: "http://www.google.com",
//   userId: "cI7qNM",
// }

const userDatabase = {};
// Example user entry:
//  cI7qNM: { 
//   id: 'cI7qNM', 
//   email: 'email@example.com', 
//   password: '$2b$10$glTZIV2BVdSfEVxWJNDJdefGVMJLxmZGQoSjjb1xVS2y1V1vRWwGu' 
// }

/*******************
  HELPER FUNCTIONS
********************/
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
const insertURL = (longURL, shortURL, userId) => {
  // if http:// isn't in given URL, add it
  // TODO: make this more robust
  if (longURL.search(/https*:\/\//) === -1) {
    longURL = 'http://' + longURL;
  }
  urlDatabase[shortURL] = { longURL, userId };
};

// Deletes a URL
const deleteURL = shortURL => {
  delete urlDatabase[shortURL];
};

// Get userId by email
// Returns id if found, undefined otherwise
const findUserByEmail = (email, database) => {
  for (let userId in database) {
    if (database[userId].email === email) {
      return database[userId];
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
  const id = generateRandomID();
  userDatabase[id] = {
    id,
    email,
    password: bcrypt.hashSync(password, 10),
  };
  return id;
};

// checks is user has cookie, and if it's valid
// redirects to /login if not
const isLoggedIn = () => {
  return (req, res, next) => {
    if (!req.session.user_id || !userDatabase[req.session.user_id]) {
      return res.redirect('/login');
    }
    next();
  };
};

// Checks to see if the user owns the URL they're trying to edit/delete
// redirects to /urls if not
const userOwnsURL = () => {
  return (req, res, next) => {
    if (urlDatabase[req.params.shortURL].userId === req.session.user_id) {
      // user owns this url -> continue
      next();
    } else {
      // user does not own this url -> go back to /urls
      res.redirect('/urls');
    }
  };
};

// Returns all URLs owned by a given user
const urlsForUser = userId => {
  const result = {};
  for (let urlId in urlDatabase) {
    if (urlDatabase[urlId].userId === userId) {
      result[urlId] = urlDatabase[urlId];
    }
  }
  return result;
};

/*******************
  ROUTES
********************/
// Home -> redirect to /urls
app.get('/', (req, res) => {
  res.redirect('/urls');
});

// Show all long/short URLs saved
app.get('/urls', isLoggedIn(), (req, res) => {
  const userId = req.session.user_id;
  const email = findEmailByUserId(userId);
  const templateVars = {
    urls: urlsForUser(userId),
    email,
  };
  res.render('urls_index', templateVars);
});

// Create a new shortURL
app.post('/urls', isLoggedIn(), (req, res) => {
  const shortURL = generateRandomID();
  const longURL = req.body.longURL;
  insertURL(longURL, shortURL, req.session.user_id);
  res.redirect(`/urls/${shortURL}`);
});

// Show short URL creation page
app.get('/urls/new', isLoggedIn(), (req, res) => {
  const email = findEmailByUserId(req.session.user_id);
  const templateVars = {
    email,
  };
  res.render('urls_new', templateVars);
});

// Show details on an existing shortURL
app.get('/urls/:shortURL',
  isLoggedIn(),
  userOwnsURL(),
  (req, res) => {
    const email = findEmailByUserId(req.session.user_id);
    const templateVars = {
      longURL: urlDatabase[req.params.shortURL].longURL,
      shortURL: req.params.shortURL,
      email,
    };
    res.render('urls_show', templateVars);
  });

// Updates the longURL for a given shortURL
app.post('/urls/:shortURL',
  isLoggedIn(),
  userOwnsURL(),
  (req, res) => {
    const shortURL = req.params.shortURL;
    const longURL = req.body.longURL;
    insertURL(longURL, shortURL, req.session.user_id);
    res.redirect(`/urls/${shortURL}`);
  });

// Deletes an existing short URL
app.post('/urls/:shortURL/delete',
  isLoggedIn(),
  userOwnsURL(),
  (req, res) => {
    const shortURL = req.params.shortURL;
    deleteURL(shortURL);
    res.redirect('/urls');
  });

// Given short URL, redirect to long URL
app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

// Show login page 
app.get('/login', (req, res) => {
  res.render('login');
});

// Log in user
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = findUserByEmail(email, userDatabase);
  // check if users exists
  if (user.id) {
    // users exists, check if password is correct
    if (bcrypt.compareSync(password, userDatabase[user.id].password)) {
      // user authenticated!
      req.session.user_id = user.id;
      return res.redirect('/urls');
    }
    // wrong password!
    return res.status(401).send('Password is incorrect!');
  }
  // user doesn't exist
  return res.status(403).send('That user doesn\'t exist!');
});

// Log out user
app.post('/logout', isLoggedIn(), (req, res) => {
  req.session.user_id = null;
  res.redirect('/login');
});

// Show user registration page
app.get('/register', (req, res) => {
  if (req.session.user_id) {
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
  if (findUserByEmail(email, userDatabase)) {
    return res.status(400).send('User already exists!');
  }

  // user doesn't already exist - register them
  const userId = registerNewUser({ email, password });
  req.session.user_id = userId;
  res.redirect('/urls');
  console.log('Registered a new user. Users:');
  console.log(userDatabase);
});

// Run the server
app.listen(PORT, () => {
  console.log(`TinyApp server listening on http://localhost:${PORT}`);
});
