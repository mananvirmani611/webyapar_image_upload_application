const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');

const app = express();
const port = 3000;

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/image-uploads', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Create a Mongoose model for the Image
const imageSchema = new mongoose.Schema({
  filename: String,
  contentType: String,
  imageBase64: String,
});

const Image = mongoose.model('Image', imageSchema);

// Set up Multer for handling file uploads
const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({ storage: storage });

// Serve HTML form for uploading images
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Handle image upload
app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    // Get file details from the request
    const filename = req.file.originalname;
    const contentType = req.file.mimetype;
    const imageBase64 = req.file.buffer.toString('base64');

    // Create a new Image document
    const newImage = new Image({
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

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
