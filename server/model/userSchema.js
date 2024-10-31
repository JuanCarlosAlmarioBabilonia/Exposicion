/**
 * @file Modelo de usuario para la aplicación, utilizando Mongoose.
 * @requires mongoose
 */

const mongoose = require('mongoose'); // Importa Mongoose para manejar la base de datos MongoDB

/**
 * Esquema de usuario para la colección "users".
 * @type {mongoose.Schema}
 */
const userSchema = new mongoose.Schema({
    providerId: { type: String, required: true, unique: true },  // ID único del proveedor (ej. Google, Discord, Facebook)
    name: { type: String }, // Nombre del usuario
    email: { type: String },  // Correo electrónico del usuario (no es único por sí mismo)
    profilePicture: { type: String }, // URL de la imagen de perfil del usuario
    provider: { type: String, required: true },  // Proveedor de autenticación (google, discord, facebook)
    createdAt: { type: Date, default: Date.now }, // Fecha de creación del registro
    lastLogin: { type: Date, default: Date.now } // Fecha del último inicio de sesión
}, {
    collection: "users", // Nombre de la colección en la base de datos
    versionKey: false // Desactiva el campo __v que Mongoose agrega por defecto
});

/**
 * Exporta el modelo de usuario basado en el esquema definido.
 * @type {mongoose.Model}
 */
module.exports = mongoose.model('User', userSchema); // Exporta el modelo 'User' para su uso en otras partes de la aplicación