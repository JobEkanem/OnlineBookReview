const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session')
const customer_routes = require('./router/auth_users.js').authenticated;
const genl_routes = require('./router/general.js').general;

const app = express();

app.use(express.json());

// Configure express-session middleware
app.use("/customer", session({
  secret: "fingerprint_customer", // Secret key for signing the session ID cookie
  resave: true, // Forces the session to be saved back to the session store, even if the session was never modified during the request
  saveUninitialized: true // Forces a session that is "uninitialized" to be saved to the store
}))

// Authentication middleware for registered user routes (Task 7 part 2)
app.use("/customer/auth/*", function auth(req, res, next) {
  // Check if a session exists and contains an authorization token
  if (req.session.authorization) {
    let token = req.session.authorization['accessToken']; // Get the JWT token
    // Verify the token
    jwt.verify(token, "access", (err, user) => {
      if (!err) {
        // If token is valid, attach user information to the request object
        req.user = user;
        next(); // Proceed to the next middleware/route handler
      } else {
        // If token is invalid or expired
        return res.status(403).json({ message: "User not authenticated or token expired." });
      }
    });
  } else {
    // If no session or authorization token
    return res.status(403).json({ message: "User not logged in." });
  }
});

const PORT = 5000; // Port number for the server

// Mount the customer-specific (authenticated) routes
app.use("/customer", customer_routes);
// Mount the general (public) routes
app.use("/", genl_routes);

// Start the server
app.listen(PORT, () => console.log("Server is running on port " + PORT));