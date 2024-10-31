/**
 * @file Configuración del middleware de sesión para la aplicación.
 * @requires express-session
 * @requires dotenv
 */

const session = require("express-session"); // Middleware para manejar sesiones en Express
const dotenv = require("dotenv"); // Módulo para manejar variables de entorno

dotenv.config(); // Carga las variables de entorno desde el archivo .env

/**
 * Clave secreta utilizada para firmar la sesión.
 * @type {string}
 */
const SECRET_KEY = process.env.JWT_SECRET; // Se obtiene la clave secreta del archivo .env

/**
 * Middleware de sesión configurado para la aplicación.
 * @type {import('express-session').SessionOptions}
 */
const sessionMiddleware = session({
    secret: SECRET_KEY, // Clave secreta para firmar la sesión
    resave: false, // No volver a guardar la sesión si no ha habido cambios
    saveUninitialized: false, // No guardar sesiones no inicializadas
    cookie: { 
        secure: false, // Indica si la cookie debe ser solo transmitida por HTTPS (debería ser true en producción)
        maxAge: 1800000 // Duración de la cookie en milisegundos (30 minutos)
    }
});

/**
 * Exporta el middleware de sesión para su uso en otras partes de la aplicación.
 * @type {import('express-session').Session}
 */
module.exports = sessionMiddleware; // Exporta el middleware configurado