// server.js
const express = require('express');
const passport = require('passport');
const database = require("./server/database/connect");
const sessionMiddleware = require("./server/middleware/sessionConfig");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const DiscordStrategy = require('passport-discord').Strategy;  
const FacebookStrategy = require('passport-facebook').Strategy;
const authRoutes = require('./server/routes/userRouter');
const index = require("./server/routes/indexRouter");
const User = require("./server/model/userSchema");
const { join } = require("path");

require('dotenv').config(); // Importa y configura dotenv al inicio

// Conectar a la base de datos
database.getInstance();
require("./src/js/passportConfig"); // Configuración de Passport

const app = express();

app.use("/css", express.static(join(__dirname, "/src/css")));
app.use("/js", express.static(join(__dirname, "/src/js")));
app.use("/storage", express.static(join(__dirname, "/src/storage")));

// Middlewares
app.use(express.json());
app.use(sessionMiddleware); // Middleware para sesiones, usa SESSION_SECRET desde .env
app.use(passport.initialize());
app.use(passport.session());

// Estrategia de Google
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:5000/auth/google/callback"
},
async (accessToken, refreshToken, profile, cb) => {
  try {
    console.log("Usuario logueado:", profile);

    // Verificar si el usuario ya existe con el mismo correo y proveedor
    let user = await User.findOne({ email: profile.emails[0].value, provider: 'google' });

    if (user) {
      // Si existe, actualizar la última vez que el usuario inició sesión
      user.lastLogin = Date.now();
      await user.save();
      return cb(null, user);
    }

    // Verificar si el correo ya está registrado con otro proveedor
    user = await User.findOne({ email: profile.emails[0].value });
    
    if (user) {
      // Si existe con otro proveedor, crear un nuevo registro para este proveedor
      const newUser = new User({
        providerId: profile.id,
        name: profile.displayName,
        email: profile.emails[0].value,
        profilePicture: profile.photos[0].value,
        provider: 'google',
        lastLogin: Date.now()
      });

      await newUser.save();
      console.log("Nuevo usuario guardado:", newUser);
      return cb(null, newUser);
    }

    // Crear un nuevo usuario si no existe con ese correo y proveedor
    user = new User({
      providerId: profile.id,
      name: profile.displayName,
      email: profile.emails[0].value,
      profilePicture: profile.photos[0].value,
      provider: 'google',
      lastLogin: Date.now()
    });

    await user.save();
    console.log("Nuevo usuario guardado:", user);
    return cb(null, user);
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    return cb(error);
  }
}));

// Estrategia de Discord
passport.use(new DiscordStrategy({
  clientID: process.env.DISCORD_CLIENT_ID,
  clientSecret: process.env.DISCORD_CLIENT_SECRET,
  callbackURL: 'http://localhost:5000/auth/discord/callback',
  scope: ['identify', 'email']
}, 
async (accessToken, refreshToken, profile, done) => {
  try {
    console.log("Usuario logueado con Discord:", profile);

    // Verificar si el usuario ya existe con el mismo correo y proveedor
    let user = await User.findOne({ email: profile.email, provider: 'discord' });

    if (user) {
      // Si existe, actualizar la última vez que el usuario inició sesión
      user.lastLogin = Date.now();
      await user.save();
      return done(null, user);
    }

    // Verificar si el correo ya está registrado con otro proveedor
    user = await User.findOne({ email: profile.email });
    
    if (user) {
      // Si existe con otro proveedor, crear un nuevo registro para este proveedor
      const newUser = new User({
        providerId: profile.id,
        name: profile.username,
        email: profile.email,
        profilePicture: profile.avatar,
        provider: 'discord',
        lastLogin: Date.now()
      });

      await newUser.save();
      console.log("Nuevo usuario guardado:", newUser);
      return done(null, newUser);
    }

    // Crear nuevo usuario si no existe
    user = new User({
      providerId: profile.id,
      name: profile.username,
      email: profile.email,
      profilePicture: profile.avatar,
      provider: 'discord',
      lastLogin: Date.now()
    });

    await user.save();
    console.log("Nuevo usuario guardado:", user);
    return done(null, user);
  } catch (error) {
    console.error("Error en autenticación con Discord:", error);
    return done(error);
  }
}));

// Estrategia de Facebook
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_CLIENT_ID,
  clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
  callbackURL: 'http://localhost:5000/auth/facebook/callback',
  profileFields: ['id', 'displayName', 'photos', 'email']
},
async (accessToken, refreshToken, profile, cb) => {
  try {
    console.log("Usuario logueado con Facebook:", profile);

    // Verificar si el usuario ya existe con el mismo correo y proveedor
    let user = await User.findOne({ email: profile.emails[0].value, provider: 'facebook' });

    if (user) {
      // Si existe, actualizar la última vez que el usuario inició sesión
      user.lastLogin = Date.now();
      await user.save();
      return cb(null, user);
    }

    // Verificar si el correo ya está registrado con otro proveedor
    user = await User.findOne({ email: profile.emails[0].value });
    
    if (user) {
      // Si existe con otro proveedor, crear un nuevo registro para este proveedor
      const newUser = new User({
        providerId: profile.id,
        name: profile.displayName,
        email: profile.emails[0].value,
        profilePicture: profile.photos[0].value,
        provider: 'facebook',
        lastLogin: Date.now()
      });

      await newUser.save();
      console.log("Nuevo usuario guardado:", newUser);
      return cb(null, newUser);
    }

    // Crear nuevo usuario si no existe
    user = new User({
      providerId: profile.id,
      name: profile.displayName,
      email: profile.emails[0].value,
      profilePicture: profile.photos[0].value,
      provider: 'facebook',
      lastLogin: Date.now()
    });

    await user.save();
    console.log("Nuevo usuario guardado:", user);
    return cb(null, user);
  } catch (error) {
    console.error("Error al procesar el usuario:", error);
    return cb(error);
  }
}));

// Serialización del usuario para la sesión
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Rutas de autenticación
app.use(authRoutes);

// Ruta de inicio
app.use("/", index);

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