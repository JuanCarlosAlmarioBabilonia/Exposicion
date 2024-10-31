/**
 * @file Rutas de autenticación para la aplicación.
 * @requires express
 * @requires passport
 */

const express = require('express'); // Framework web para Node.js
const passport = require('passport'); // Middleware de autenticación
const router = express.Router(); // Crea un nuevo enrutador

/**
 * Ruta para iniciar la autenticación con Google.
 * @name GET /auth/google
 * @function
 */
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] })); 

/**
 * Ruta de callback para Google después de la autenticación.
 * Redirige a /dashboard si la autenticación es exitosa, o a /login si falla.
 * @name GET /auth/google/callback
 * @function
 */
router.get('/auth/google/callback', passport.authenticate('google', {
    successRedirect: '/dashboard',  // Página después de iniciar sesión
    failureRedirect: '/login' // Página en caso de fallo en la autenticación
}));

/**
 * Ruta para iniciar la autenticación con Discord.
 * @name GET /auth/discord
 * @function
 */
router.get('/auth/discord', passport.authenticate('discord', { scope: ['identify', 'email'] })); 

/**
 * Ruta de callback para Discord después de la autenticación.
 * Redirige a /dashboard si la autenticación es exitosa, o a /login si falla.
 * @name GET /auth/discord/callback
 * @function
 */
router.get('/auth/discord/callback', passport.authenticate('discord', {
    successRedirect: '/dashboard', // Página después de iniciar sesión
    failureRedirect: '/login' // Página en caso de fallo en la autenticación
}));

/**
 * Ruta para iniciar la autenticación con Facebook.
 * @name GET /auth/facebook
 * @function
 */
router.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'] })); 

/**
 * Ruta de callback para Facebook después de la autenticación.
 * Redirige a /dashboard si la autenticación es exitosa, o a /login si falla.
 * @name GET /auth/facebook/callback
 * @function
 */
router.get('/auth/facebook/callback', passport.authenticate('facebook', {
    successRedirect: '/dashboard', // Página después de iniciar sesión
    failureRedirect: '/login' // Página en caso de fallo en la autenticación
}));

module.exports = router; // Exporta el enrutador para su uso en otras partes de la aplicación