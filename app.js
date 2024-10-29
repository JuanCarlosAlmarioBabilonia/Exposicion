// server.js
const express = require('express');
const passport = require('passport');
const database = require("./server/database/connect");
const sessionMiddleware = require("./server/middleware/sessionConfig");
const authRoutes = require('./server/routes/userRouter');
const index = require("./server/routes/indexRouter")
const {join} = require("path")
require('dotenv').config(); // Importa y configura dotenv al inicio

// Conectar a la base de datos
database.getInstance();
require("./src/js/passportConfig"); // Configuración de Passport

const app = express();

app.use("/css", express.static(join(__dirname, "/src/css")))
app.use("/js", express.static(join(__dirname, "/src/js")))
app.use("/storage", express.static(join(__dirname, "/src/storage")))

// Middlewares
app.use(express.json());
app.use(sessionMiddleware); // Middleware para sesiones, usa SESSION_SECRET desde .env
app.use(passport.initialize());
app.use(passport.session());

// Rutas de autenticación
app.use(authRoutes);

// Ruta de inicio
app.use("/", index)

// Ruta de dashboard, protegida para usuarios autenticados
app.get('/dashboard', (req, res) => {
    if (req.isAuthenticated()) {
        res.send('Bienvenido al Dashboard');
    } else {
        res.redirect('/auth/google');
    }
});

const port = process.env.EXPRESS_PORT;
const host = process.env.EXPRESS_HOST_NAME;

app.listen(port, host, () => {
    console.log(`${process.env.EXPRESS_PROTOCOL}${host}:${port}`);
});

