const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');

const app = express();

const db = mongoose.connection;


mongoose.connect('mongodb://127.0.0.1:27017/images_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
// mongoose.set("useCreateIndex", true);

// const imageSchema = new mongoose.Schema({
//   name: String,
//   data: Buffer,
//   size: Number,
//   encoding: String,
//   tempFilePath: String,
//   truncated: Boolean,
//   mimetype: String,
//   md5: String,
// });


const imageSchema = new mongoose.Schema({
  email : String,
  filename: String,
  contentType: String,
  imageBase64: String,
});

const Image = mongoose.model('Image', imageSchema);

// Set up Multer for image upload
const storage = multer.memoryStorage(); // Store images in memory as Buffer
const upload = multer({ storage: storage });


// Set up sessions to keep track of logged-in users
app.use(require('express-session')({ secret: 'your-secret-key', resave: true, saveUninitialized: true }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});
// Initialize passport and session support
app.use(passport.initialize());
app.use(passport.session());


app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    // Get file details from the request
    const useremail = req.user && req.user.emails && req.user.emails.length > 0 ? req.user.emails[0].value : 'No email available';
    const filename = req.file.originalname;
    const contentType = req.file.mimetype;
    const imageBase64 = req.file.buffer.toString('base64');

    // Create a new Image document
    const newImage = new Image({
      email : useremail,
      filename: filename,
      contentType: contentType,
      imageBase64: imageBase64,
    });

    // Save the image to the database
    await newImage.save();

    res.send('Image uploaded successfully!');
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).send('Error uploading image');
  }
});


// api AIzaSyAAZt9O45gk_PlLgx8bw5ihHtkcudtiMdc

// Replace these placeholders with your own Google API credentials
const GOOGLE_CLIENT_ID = '217920034716-hs55j4946bskj9vq02invtum7dpcek62.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = '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';
const GOOGLE_CALLBACK_URL = 'http://localhost:3000/auth/google/callback';

// Set up Google OAuth strategy
passport.use(new GoogleStrategy({
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  callbackURL: GOOGLE_CALLBACK_URL,
},
  (token, tokenSecret, profile, done) => {
    // Use the profile information (e.g., profile.id) to check if the user is already in the database
    // If the user exists, call done(null, user)
    // If the user doesn't exist, create a new user in the database and call done(null, newUser)
    return done(null, profile);
  }
));

// Serialize user information to be stored in the session
passport.serializeUser((user, done) => {
  done(null, user);
});

// Deserialize user information from the session
passport.deserializeUser((obj, done) => {
  done(null, obj);
});

// Route for starting the Google OAuth login
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Callback route after Google has authenticated the user
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
      // res.redirect("/homeroute");
      res.sendFile(__dirname + "/index.html");
  }
);

app.get("/homeroute", function(req, res) {
  if(req.isAuthenticated()){
    var useremail = req.user.emails && req.user.emails.length > 0 ? req.user.emails[0].value : 'No email available';
    // res.send(useremail);

    Image.find({email : useremail }).exec()
  .then(users => {
    // console.log('Users:', users[0]);
    // console.log(users[1].email);
    // const image = users[1]
    // res.send(Buffer.from(image.imageBase64, 'base64'));

    res.json({ users });
  })
  .catch(err => {
    console.error('Error:', err);
  })
  .finally(() => {
    // Close the MongoDB connection
  });

    // res.sendFile(__dirname + "/index.html");
  }
  else{
    res.send("not authenticated");
  }
})


app.get('/image/:email', async (req, res) => {
  try {
    const email = req.params.email;

    // Find the user by email
    const user = await User.findOne({ email });

    if (!user || !user.image) {
      return res.status(404).send('User or image not found.');
    }

    // Set the content type based on the stored mime type
    res.contentType(user.image.contentType);

    // Send the image data as the response
    res.send(user.image.data);
  } catch (error) {
    console.error(`Error retrieving image: ${error.message}`);
    return res.status(500).send('Internal Server Error');
  }
});

// Route to check if the user is logged in
app.get('/profile', (req, res) => {
  // If the user is logged in, req.isAuthenticated() will return true
  if (req.isAuthenticated()) {
    res.send(`<h1>Hello, ${req.user.displayName}!</h1><a href="/logout">Logout</a>`);
  } else {
    res.redirect('/');
  }
});

// Route to log out the user
app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

// Home route
app.get('/', (req, res) => {
  // res.send('<h1>Welcome to the home page</h1><a href="/auth/google">Login with Google</a>');
  res.sendFile(__dirname + "/homepage.html");
});

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
