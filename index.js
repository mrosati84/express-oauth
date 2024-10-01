const express = require("express");
const oauth2orize = require("oauth2orize");
const passport = require("passport");
const OAuth2Strategy = require("passport-oauth2-client-password").Strategy;
const BearerStrategy = require("passport-http-bearer").Strategy;
const bodyParser = require("body-parser");
const crypto = require("crypto");

require("dotenv").config();

const app = express();
const server = oauth2orize.createServer();

// In-memory storage for demo purposes. Use a database in production.
const clients = [
  { id: process.env["CLIENT_ID"], secret: process.env["CLIENT_SECRET"] },
];
const tokens = {};

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(passport.initialize());

// OAuth2 server configuration
server.exchange(
  oauth2orize.exchange.clientCredentials((client, scope, done) => {
    if (
      client.id !== process.env["CLIENT_ID"] ||
      client.secret !== process.env["CLIENT_SECRET"]
    ) {
      return done(null, false);
    }
    const token = crypto.randomBytes(32).toString("hex");
    tokens[token] = { client: client.id, scope: scope };
    done(null, token);
  })
);

// Passport configuration
passport.use(
  new OAuth2Strategy((clientId, clientSecret, done) => {
    const client = clients.find(
      (c) => c.id === clientId && c.secret === clientSecret
    );
    if (!client) {
      return done(null, false);
    }
    return done(null, client);
  })
);

// Add Bearer strategy configuration
passport.use(
  new BearerStrategy((token, done) => {
    if (!tokens[token]) {
      return done(null, false);
    }
    const client = clients.find((c) => c.id === tokens[token].client);
    if (!client) {
      return done(null, false);
    }
    return done(null, client, { scope: tokens[token].scope });
  })
);

// Token endpoint
app.post(
  "/oauth/token",
  passport.authenticate(["oauth2-client-password"], { session: false }),
  server.token(),
  server.errorHandler()
);

// Protected endpoint
app.get(
  "/api/protected",
  passport.authenticate("bearer", { session: false }),
  (req, res) => {
    res.json({ message: "This is a protected resource" });
  }
);

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
