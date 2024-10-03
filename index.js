const express = require("express");
const oauth2orize = require("oauth2orize");
const passport = require("passport");
const OAuth2Strategy = require("passport-oauth2-client-password").Strategy;
const BearerStrategy = require("passport-http-bearer").Strategy;
const bodyParser = require("body-parser");
const crypto = require("crypto");

require("dotenv").config();

const PORT = process.env.PORT || 3000;

console.log(`DEBUG: Starting server with PORT: ${PORT}`);

const app = express();
const server = oauth2orize.createServer();

// In-memory storage for demo purposes. Use a database in production.
const clients = [
  { id: process.env["CLIENT_ID"], secret: process.env["CLIENT_SECRET"] },
];
const tokens = {};

console.log(`DEBUG: Loaded ${clients.length} client(s)`);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(passport.initialize());

console.log("DEBUG: Middleware setup complete");

// OAuth2 server configuration
server.exchange(
  oauth2orize.exchange.clientCredentials((client, scope, done) => {
    console.log(`DEBUG: Client credentials exchange attempted for client ID: ${client.id}`);
    if (
      client.id !== process.env["CLIENT_ID"] ||
      client.secret !== process.env["CLIENT_SECRET"]
    ) {
      console.log(`DEBUG: Client authentication failed for client ID: ${client.id}`);
      return done(null, false);
    }
    const token = crypto.randomBytes(32).toString("hex");
    tokens[token] = { client: client.id, scope: scope };
    console.log(`DEBUG: Token generated for client ID: ${client.id}`);
    done(null, token);
  })
);

console.log("DEBUG: OAuth2 server exchange configured");

// Passport configuration
passport.use(
  new OAuth2Strategy((clientId, clientSecret, done) => {
    console.log(`DEBUG: OAuth2 strategy authentication attempted for client ID: ${clientId}`);
    const client = clients.find(
      (c) => c.id === clientId && c.secret === clientSecret
    );
    if (!client) {
      console.log(`DEBUG: OAuth2 strategy authentication failed for client ID: ${clientId}`);
      return done(null, false);
    }
    console.log(`DEBUG: OAuth2 strategy authentication successful for client ID: ${clientId}`);
    return done(null, client);
  })
);

console.log("DEBUG: Passport OAuth2 strategy configured");

// Add Bearer strategy configuration
passport.use(
  new BearerStrategy((token, done) => {
    console.log(`DEBUG: Bearer strategy authentication attempted with token: ${token.substring(0, 6)}...`);
    if (!tokens[token]) {
      console.log(`DEBUG: Bearer strategy authentication failed: token not found`);
      return done(null, false);
    }
    const client = clients.find((c) => c.id === tokens[token].client);
    if (!client) {
      console.log(`DEBUG: Bearer strategy authentication failed: client not found for token`);
      return done(null, false);
    }
    console.log(`DEBUG: Bearer strategy authentication successful for client ID: ${client.id}`);
    return done(null, client, { scope: tokens[token].scope });
  })
);

console.log("DEBUG: Passport Bearer strategy configured");

// Token endpoint
app.post(
  "/oauth/token",
  (req, res, next) => {
    console.log("DEBUG: Token request received");
    console.log("BODY: ", req.body);
    console.log("HEADER: ", req.headers);
    console.log("QUERY: ", req.query);
    next();
  },
  passport.authenticate(["oauth2-client-password"], { session: false }),
  (req, res, next) => {
    console.log("DEBUG: Client authenticated successfully");
    next();
  },
  server.token(),
  server.errorHandler(),
  (req, res) => {
    console.log("DEBUG: Token issued successfully");
  }
);

console.log("DEBUG: Token endpoint configured");

// Protected endpoint
app.get(
  "/api/protected",
  (req, res, next) => {
    console.log("DEBUG: Protected resource request received");
    next();
  },
  passport.authenticate("bearer", { session: false }),
  (req, res) => {
    console.log("DEBUG: Access to protected resource granted");
    res.json({ message: "This is a protected resource" });
  }
);

console.log("DEBUG: Protected endpoint configured");

app.listen(PORT, () => {
  console.log(`DEBUG: Server is running on port ${PORT}`);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('DEBUG: Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('DEBUG: Uncaught Exception:', error);
});
