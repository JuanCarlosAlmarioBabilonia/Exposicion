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


router.get('/auth/discord/callback', (req, res, next) => {
    passport.authenticate('discord', {
        failureRedirect: 'https://exposicion-six.vercel.app' // Redirige si la autenticación falla
    }, (err, user, info) => {
        if (err) {
            return next(err); // Manejo de errores
        }
        if (!user) {
            return res.redirect('https://exposicion-six.vercel.app'); // Redirige si no hay usuario
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err); // Manejo de errores al iniciar sesión
            }
            return res.redirect('/dashboard'); // Redirige a dashboard si la autenticación es exitosa
        });
    })(req, res, next);
});


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