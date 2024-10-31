/**
 * @file Archivo principal de la aplicación Express que maneja la autenticación mediante diferentes proveedores.
 * @requires dotenv
 * @requires express
 * @requires passport
 * @requires passport-google-oauth20
 * @requires passport-discord
 * @requires passport-facebook
 * @requires ./server/database/connect
 * @requires ./server/middleware/sessionConfig
 * @requires ./server/routes/userRouter
 * @requires ./server/routes/indexRouter
 * @requires ./server/model/userSchema
 * @requires path
 */

require('dotenv').config(); // Carga las variables de entorno desde .env

const express = require('express'); // Framework web para Node.js
const passport = require('passport'); // Middleware de autenticación
const database = require("./server/database/connect"); // Conexión a la base de datos
const sessionMiddleware = require("./server/middleware/sessionConfig"); // Middleware para manejar sesiones
const GoogleStrategy = require('passport-google-oauth20').Strategy; // Estrategia de autenticación de Google
const DiscordStrategy = require('passport-discord').Strategy; // Estrategia de autenticación de Discord
const FacebookStrategy = require('passport-facebook').Strategy; // Estrategia de autenticación de Facebook
const authRoutes = require('./server/routes/userRouter'); // Rutas de autenticación
const index = require("./server/routes/indexRouter"); // Ruta principal
const User = require("./server/model/userSchema"); // Modelo de usuario
const cors = require("cors")
const { join } = require("path"); // Módulo para manejar rutas

/**
 * Instancia principal de la aplicación Express.
 * @type {import('express').Application}
 */
const app = express();

/**
 * Conexión a la base de datos.
 * @async
 */
database.getInstance(); // Inicializa la conexión a la base de datos

/**
 * Configuración de Passport.
 */
require("./src/js/passportConfig"); // Carga la configuración adicional para Passport

/**
 * Configuración de directorios estáticos para CSS, JS y almacenamiento.
 */
app.use("/css", express.static(join(__dirname, "/src/css")));
app.use("/js", express.static(join(__dirname, "/src/js")));
app.use("/storage", express.static(join(__dirname, "/src/storage")));


const corsOptions = {
  origin: ['https://localhost:5000', "https://exposicion-ashy.vercel.app"], // Permite ambos orígenes
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
};


app.use(cors(corsOptions)); 

/**
 * Configuración de middlewares.
 */
app.use(express.json()); // Middleware para parsear JSON en las solicitudes
app.use(sessionMiddleware); // Middleware para manejar sesiones, usa SESSION_SECRET desde .env
app.use(passport.initialize()); // Inicializa Passport para manejar autenticación
app.use(passport.session()); // Permite el uso de sesiones con Passport

/**
 * Estrategia de Google para autenticación.
 */
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID, // ID del cliente de Google
  clientSecret: process.env.GOOGLE_CLIENT_SECRET, // Secreto del cliente de Google
  callbackURL: "https://exposicion-ashy.vercel.app/auth/google/callback" // URL de callback después de la autenticación
},
async (accessToken, refreshToken, profile, cb) => {
  try {
    console.log("Usuario logueado:", profile); // Loguea el perfil del usuario

    let user = await User.findOne({ email: profile.emails[0].value, provider: 'google' }); // Verifica si el usuario ya existe

    if (user) {
      user.lastLogin = Date.now(); // Actualiza la última vez que el usuario inició sesión
      await user.save(); 
      return cb(null, user); // Devuelve el usuario existente
    }

    user = await User.findOne({ email: profile.emails[0].value }); // Verifica si el correo ya está registrado con otro proveedor
    
    if (user) {
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
      return cb(null, newUser); // Devuelve el nuevo usuario creado con un proveedor diferente
    }

    user = new User({ // Crea un nuevo usuario si no existe con ese correo y proveedor
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

/**
 * Estrategia de Discord para autenticación.
 */
passport.use(new DiscordStrategy({
  clientID: process.env.DISCORD_CLIENT_ID, 
  clientSecret: process.env.DISCORD_CLIENT_SECRET, 
  callbackURL: 'https://exposicion-ashy.vercel.app/auth/discord/callback', 
  scope: ['identify', 'email'] 
}, 
async (accessToken, refreshToken, profile, done) => {
  try {
    console.log("Usuario logueado con Discord:", profile);

    let user = await User.findOne({ email: profile.email, provider: 'discord' }); 

    if (user) {
      user.lastLogin = Date.now(); 
      await user.save();
      return done(null, user); 
    }

    user = await User.findOne({ email: profile.email }); 
    
    if (user) {
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

    user = new User({ // Crea un nuevo usuario si no existe con ese correo y proveedor
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

/**
 * Estrategia de Facebook para autenticación.
 */
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_CLIENT_ID, 
  clientSecret: process.env.FACEBOOK_CLIENT_SECRET, 
  callbackURL: 'https://exposicion-ashy.vercel.app/auth/facebook/callback', 
  profileFields: ['id', 'displayName', 'photos', 'email'] 
},
async (accessToken, refreshToken, profile, cb) => {
  try {
    console.log("Usuario logueado con Facebook:", profile);

    let user = await User.findOne({ email: profile.emails[0].value, provider: 'facebook' }); 

    if (user) {
      user.lastLogin = Date.now(); 
      await user.save();
      return cb(null, user); 
    }

    user = await User.findOne({ email: profile.emails[0].value }); 
    
    if (user) {
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

    user = new User({ // Crea un nuevo usuario si no existe con ese correo y proveedor
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

/**
 * Serialización del usuario para la sesión.
 */
passport.serializeUser((user, done) => {
  done(null, user); // Guarda el usuario en la sesión
});

/**
 * Deserialización del usuario desde la sesión.
 */
passport.deserializeUser((user, done) => {
  done(null, user); // Recupera el usuario desde la sesión
});

/**
 * Configuración de las rutas de autenticación.
 */
app.use(authRoutes); 

/**
 * Ruta principal que redirige a los usuarios no autenticados a Google para iniciar sesión.
 */
app.use("/", index); 

/**
 * Ruta protegida que solo puede ser accedida por usuarios autenticados.
 * @name GET /dashboard
 * @function
 */
// Ruta para servir el dashboard
app.get('/dashboard', (req, res) => {
  if (req.isAuthenticated()) {
    res.sendFile(join(__dirname, 'src/view/dashBoard.html'));
  } else {
    res.redirect('https://exposicion-six.vercel.app');
  }
});


/**
 * Puerto y host para el servidor.
 * @type {number}
 */
const port = process.env.EXPRESS_PORT; 

/**
 * @type {string}
 */
const host = process.env.EXPRESS_HOST_NAME; 

/**
 * Inicia el servidor.
 * @listens {number} port - Puerto en el que escucha el servidor.
 */
app.listen(port, host, () => { 
  console.log(`${process.env.EXPRESS_PROTOCOL}${host}:${port}`); // Mensaje en consola indicando que el servidor está corriendo
});