const express = require('express');
let books = require("../booksdb.js"); // Import the books data
let isValid = require("./auth_users.js").isValid; // Import isValid helper
let users = require("./auth_users.js").users; // Import users array (for registration)
const public_users = express.Router(); // Create a router for public (unauthenticated) users

// Helper function to get books data using a CALLBACK
// It takes a 'callback' function as an argument.
// When the data is ready (or an error occurs), it "calls back" that function.
const getBooksDataWithCallback = (callback) => {
    // Simulate an asynchronous operation (e.g., fetching from a database)
    setTimeout(() => {
        if (books) {
            // If successful, call the callback with null for error and the data
            callback(null, books);
        } else {
            // If an error, call the callback with the error object
            callback(new Error("No books data available for callback."));
        }
    }, 50); // Simulate a small delay (50 milliseconds)
};


// Helper function to simulate asynchronous data fetching for a book by ISBN (using Promise for consistency with other parts)
const getBookByIsbn = (isbn) => {
    return new Promise((resolve, reject) => {
        const book = books[isbn];
        if (book) {
            resolve(book);
        } else {
            reject(new Error(`Book with ISBN ${isbn} not found.`));
        }
    });
};

// Helper function to simulate asynchronous data fetching for books by author (using Promise)
const getBooksByAuthor = (author) => {
    return new Promise((resolve, reject) => {
        const matchingBooks = Object.values(books).filter(book => book.author === author);
        if (matchingBooks.length > 0) {
            resolve(matchingBooks);
        } else {
            reject(new Error(`No books found by author: ${author}.`));
        }
    });
};

// Helper function to simulate asynchronous data fetching for books by title (using Promise)
const getBooksByTitle = (title) => {
    return new Promise((resolve, reject) => {
        const matchingBooks = Object.values(books).filter(book => book.title.toLowerCase().includes(title.toLowerCase()));
        if (matchingBooks.length > 0) {
            resolve(matchingBooks);
        } else {
            reject(new Error(`No books found with title containing: ${title}.`));
        }
    });
};

// Route for new user registration
public_users.post("/register", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  // Check if both username and password are provided
  if (username && password) {
    // Use the isValid helper function to check if username is already taken
    if (!isValid(username)) { // isValid returns true if username already exists
      users.push({ "username": username, "password": password }); // Add new user
      return res.status(200).json({ message: "User successfully registered. Now you can login." });
    } else {
      return res.status(409).json({ message: "Username already exists!" }); // Conflict
    }
  }
  return res.status(400).json({ message: "Unable to register. Username and password are required." });
});

// Get the book list available in the shop - USING ASYNC CALLBACK FUNCTION
public_users.get('/', function (req, res) {
  // Call our new helper function with a callback
  getBooksDataWithCallback((error, allBooks) => {
    if (error) {
      // If there was an error, send a 500 response
      return res.status(500).json({ message: error.message || "Error fetching book list via callback." });
    } else {
      // If successful, send the books data as JSON
      return res.status(200).json(allBooks);
    }
  });
});

// Get book details based on ISBN (Async/Await)
public_users.get('/isbn/:isbn', async function (req, res) {
  const isbn = req.params.isbn;
  try {
    const bookDetails = await getBookByIsbn(isbn); // Wait for the promise to resolve
    return res.status(200).json(bookDetails);
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
});

// Get book details based on author (Async/Await)
public_users.get('/author/:author', async function (req, res) {
  const author = req.params.author;
  try {
    const matchingBooks = await getBooksByAuthor(author); // Wait for the promise to resolve
    return res.status(200).json(matchingBooks);
  }
  catch (error) {
    return res.status(404).json({ message: error.message });
  }
});

// Get all books based on title (Async/Await)
public_users.get('/title/:title', async function (req, res) {
  const title = req.params.title;
  try {
    const matchingBooks = await getBooksByTitle(title); // Wait for the promise to resolve
    return res.status(200).json(matchingBooks);
  }
  catch (error) {
    return res.status(404).json({ message: error.message });
  }
});

// Get book reviews for a specific ISBN
public_users.get('/review/:isbn', function (req, res) {
  const isbn = req.params.isbn;
  const book = books[isbn];

  if (book) {
    // Check if the book has any reviews
    if (Object.keys(book.reviews).length > 0) {
      return res.status(200).json(book.reviews);
    } else {
      return res.status(404).json({ message: `No reviews found for ISBN ${isbn}.` });
    }
  } else {
    return res.status(404).json({ message: `Book with ISBN ${isbn} not found.` });
  }
});

module.exports.general = public_users;
