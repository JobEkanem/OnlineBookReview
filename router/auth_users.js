const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("../booksdb.js");

const regd_users = express.Router();

let users = []; // In-memory array to store registered users

// Function to check if the username is valid (not already taken)
const isValid = (username) => {
  // Check if a user with the given username already exists
  let usersWithSameName = users.filter((user) => user.username === username);
  if (usersWithSameName.length > 0) {
    return false; // Username is not valid (already exists)
  }
  return true; // Username is valid
}

// Function to check if username and password match a registered user
const authenticatedUser = (username, password) => {
  // Filter the users array to find a match
  let matchingUsers = users.filter((user) => user.username === username && user.password === password);
  if (matchingUsers.length > 0) {
    return true; // User authenticated
  }
  return false; // Authentication failed
}

// Only registered users can login (Task 7)
regd_users.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Check if username and password are provided
  if (!username || !password) {
    return res.status(404).json({ message: "Error logging in: Username and password are required" });
  }

  // Authenticate the user
  if (authenticatedUser(username, password)) {
    // If authenticated, generate a JWT token
    let accessToken = jwt.sign({ data: password }, "access", { expiresIn: 60 * 60 });

    // Store the token in the session
    req.session.authorization = {
      accessToken,
      username
    }
    return res.status(200).json({ message: "User successfully logged in", token: accessToken });
  } else {
    return res.status(208).json({ message: "Invalid Login. Check username and password" });
  }
});

// Add or modify a book review (Task 8)
regd_users.put("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const review = req.query.review; // Review content from query parameter
  const username = req.session.authorization.username; // Get username from authenticated session

  if (!review) {
    return res.status(400).json({ message: "Review content is required." });
  }

  // Check if the book exists
  if (books[isbn]) {
    // If the book exists, check if the user has already reviewed it
    if (books[isbn].reviews[username]) {
      // User has already reviewed, modify the existing review
      books[isbn].reviews[username] = review;
      return res.status(200).json({ message: `Review for ISBN ${isbn} by ${username} modified successfully.` });
    } else {
      // User has not reviewed, add a new review
      books[isbn].reviews[username] = review;
      return res.status(200).json({ message: `Review for ISBN ${isbn} by ${username} added successfully.` });
    }
  } else {
    return res.status(404).json({ message: `Book with ISBN ${isbn} not found.` });
  }
});

// Delete a book review (Task 9)
regd_users.delete("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const username = req.session.authorization.username; // Get username from authenticated session

  // Check if the book exists
  if (books[isbn]) {
    // Check if the user has a review for this book
    if (books[isbn].reviews[username]) {
      delete books[isbn].reviews[username]; // Delete the review
      return res.status(200).json({ message: `Review for ISBN ${isbn} by ${username} deleted successfully.` });
    } else {
      return res.status(404).json({ message: `No review found for ISBN ${isbn} by user ${username}.` });
    }
  } else {
    return res.status(404).json({ message: `Book with ISBN ${isbn} not found.` });
  }
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;