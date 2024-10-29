const session = require("express-session")
const dotenv = require("dotenv")

dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET;

const sessionMiddleware = session({
    secret: SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: true,
        maxAge: 1800000 // 30 minutos
    }
});

module.exports = sessionMiddleware;