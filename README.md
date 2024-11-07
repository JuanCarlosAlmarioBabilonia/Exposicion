### Instalaciones necesarias

```
npm install i
```

### Ejecutar desde consola el proyecto

```
npm run dev
```

## Ojo
Si se va a realizar la prueba desde local, tener en cuenta esto:

```javascript
const isProduction = true;
```

y cambiarlo a false, para que ahora deje realizarle la autenticación de google desde el local, ya que estará en development y no en production

## Ojo

- A la hora de querer iniciar sesión con un correo **example@gmail.com**, el usuario de este correo debe crear una sesion en [Facebook Developers](https://developers.facebook.com/)

- Luego debe mandar una solicitud de amistad de Facebook al perfil principal del uso el cual es: **Geidy Babilonia Barrios**

- El perfil de uso principal debe aceptarla; luego dirigirse a Roles de la aplicación, luego a roles y por ultimo a añadir persona

- Se busca al usuario a añadir, y se le asigna un rol de administrador

- Luego de esto el usuario solicitado debe aceptar la asignación del rol y finalmente el usuario también queda como administrador y ya puede iniciar sesión con Facebook desde el login

### Componentes Principales

**1. app.js**

```javascript
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
  origin: ['https://localhost:5000', "https://exposicion-pi.vercel.app"], // Permite ambos orígenes
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
  callbackURL: "https://exposicion-pi.vercel.app/auth/google/callback" // URL de callback después de la autenticación
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
  callbackURL: 'https://exposicion-pi.vercel.app/auth/discord/callback', 
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
  callbackURL: 'https://exposicion-pi.vercel.app/auth/facebook/callback', 
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
  console.log("Usuario autenticado:", req.isAuthenticated());
  if (req.isAuthenticated()) {
      res.sendFile(join(__dirname, 'src/view/dashBoard.html'));
  } else {
    console.log("esta mal")
    res.redirect('https://exposicion-pi.vercel.app');
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
```

**2. sessionConfig.js**

```javascript
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
```

**3. userSchema.js**

```javascript
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
```

**4. userRouter.js**

```javascript
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
```

**5. .env**

```javascript
MONGO_PROTOCOL="mongodb://"
MONGO_USER="prueba"
MONGO_PSW="prueba123"
MONGO_HOST="junction.proxy.rlwy.net"
MONGO_PORT="21942"
MONGO_DB_NAME="Exposicion"



EXPRESS_PROTOCOL="http://"
EXPRESS_HOST_NAME="localhost"
EXPRESS_PORT=5000
EXPRESS_STATIC="/src"
JWT_SECRET = MIIDCzCCAfMCAQAwgY4xCzAJBgNVBAYTAkNPMRIwEAYDVQQIDAlTYW50YW5kZXIx
FDASBgNVBAcMC0J1Y2FyYW1hbmdhMRQwEgYDVQQKDAtDYW1wdXNsYW5kczEUMBIG
A1UECwwLQ2FtcHVzbGFuZHMxKTAnBgkqhkiG9w0BCQEWGmFsbWFyaW9iYWJpbG9u
aWFAZ21haWwuY29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAt9Cj
H2nEnMdSO3N7/XJAOXgwz9peDlvhlIWSg5NNrZnPZP0RZdcKWuL6vbCb7DjEtVgW
CeOZPVtHpQX76sI7LWkPVR/f5fkztOOqtvlQn6lBgFKc0K1mnXwURjRRrsQ6nf30
w3CbDjIDxfgsKlOzjnERo8cGZemAzYpejX2xDXBp4xIV8mU2QuaQRvYEmaH3hy76
kLQ/5i90xij6rWRzxe2tp9LR/cO6wqXOVQwXZXAYpjzK4PrGgPVZAt3O/qz8JRPx
UZNu/nS7HSAfboLXEz5LwfrAlg3Ca1MPjFk8yGd/ZseSkf8CujJnY4gMy0VwvZDu
XLlY4CnT6pvfd7WWBwIDAQABoDcwGQYJKoZIhvcNAQkHMQwMCjEwOTc0OTU1OTkw
GgYJKoZIhvcNAQkCMQ0MC0NhbXB1c2xhbmRzMA0GCSqGSIb3DQEBCwUAA4IBAQA/
orEgKaRd5TNn64drqvCfLbaYWx23rDBUOsvdvJk+SAfIWE9MgoLK8LusE4yuH2/h
j7ugqqi0kSDQSoQM8rXScvUc+xNZ4j3CidVbDeoC2hNcsvb19+k9cKhC3UaF+S9R
Imj8P8sLRA+vqnx0jG8jssk7ECo7GgpAT459SLtBIeRcfRfsIa0yuAI+06MVn2Nw
NXOcCZwvwfSiVRkXb6hWGhWNg8hObiLyA9Mu/kjGCXAg82dGOvfuTwN983y+ZAPl
23pdtbInSfmDDt3DjgV+GRHpyK8tSEuJb/wYGCkQJa9tChr2zX7wgHny/TWrRIEK
I6AJ5jiSvUlFZJbnsoQJ


GOOGLE_CLIENT_ID=194067899727-j937706faocfeasrotaqovqg2ik0eq83.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

DISCORD_CLIENT_ID=1301749833824079933
DISCORD_CLIENT_SECRET=XbPKwoK2eUw3Gmf5iURkegs7YkDs6Lg_

FACEBOOK_CLIENT_ID=562559446158707
FACEBOOK_CLIENT_SECRET=40ae2501f1caf8f563ff4da4d7873eda
```


# Proceso de Autenticación OAuth2 con Facebook

Esta guía te llevará a través del proceso de creación de una cuenta de desarrollador en Facebook y la configuración de una nueva aplicación.

## 1. Crear una Cuenta de Desarrollador en Facebook

- **Visitar Facebook Developers**: Dirígete a [Facebook Developers](https://developers.facebook.com/).
  
- **Registro**: Si no posees una cuenta de desarrollador, regístrate. Es posible que debas aceptar los términos de servicio y completar un formulario. Asegúrate de tener un número de teléfono móvil para la verificación.

## 2. Crear una Nueva Aplicación

- En el panel de control de desarrolladores, haz clic en **"Mis aplicaciones"** en la parte superior derecha.

- Haz clic en el botón **"Crear aplicación"**.

- Selecciona el tipo de aplicación que deseas crear (por ejemplo, **"Para consumidores"**).

- Completa el formulario de creación de la aplicación:
  - **Nombre de la aplicación**: Escribe un nombre único.
  - **Correo electrónico de contacto**: Proporciona una dirección de correo válida.
  - **Propósito de la aplicación**: Selecciona un propósito para la aplicación.

- Haz clic en **"Crear aplicación"**.

## 3. Obtener el App ID y el App Secret

- Una vez creada la aplicación, serás redirigido al panel de control de tu nueva aplicación.

- El **App ID** aparecerá en la parte superior de la página.

- Para obtener el **App Secret**, haz clic en el botón **"Mostrar"**. Es posible que debas verificar tu identidad ingresando la contraseña de tu cuenta de Facebook.

- Guarda el **App ID** y el **App Secret** en un lugar seguro, ya que los necesitarás para configurar tu aplicación.

## 4. Configurar la Aplicación para Usar OAuth

- En el panel de tu aplicación, ve a **"Configuración"** en el menú lateral y selecciona **"Básico"**.

- Aquí puedes agregar la URL de tu sitio web y configurar las URLs de redirección (callback).
  - **URL de redirección**: Por ejemplo, `http://localhost:5000/auth/facebook/callback`.

- Haz clic en **"Guardar cambios"** al final de la página.

## 5. Habilitar el Producto "Inicio de Sesión con Facebook"

- En el menú lateral, busca la sección **"Agregar producto"**.

- Busca **"Inicio de sesión con Facebook"** y haz clic en **"Configurar"**.

- En la configuración del producto, asegúrate de que tu aplicación esté en modo **"Desarrollo"** durante la fase de pruebas. Cuando estés listo para el lanzamiento, cambia a **"Producción"**.


# Proceso de Autenticación OAuth2 con Google

Este documento detalla los pasos necesarios para configurar la autenticación OAuth2 utilizando Google.

## 1. Crear un Proyecto en Google Cloud

- **Visitar Google Cloud Console**: Dirígete a [Google Cloud Console](https://console.cloud.google.com/).

- **Iniciar sesión**: Accede con tu cuenta de Google.

- **Crear un nuevo proyecto**:
  - Haz clic en el menú desplegable en la parte superior izquierda donde dice "Seleccionar un proyecto".
  - Haz clic en "Nuevo proyecto".
  - Completa el formulario de creación del proyecto:
    - **Nombre del proyecto**: Escribe un nombre único para tu proyecto.
  - Haz clic en "Crear".

## 2. Habilitar la API de Google

- Con el proyecto creado, asegúrate de que esté seleccionado en la parte superior.

- En el menú lateral, ve a **"API y servicios"** y selecciona **"Biblioteca"**.

- Busca **"Google+ API"** o **"Google People API"** (dependiendo de tus necesidades) y haz clic en **"Habilitar"**.

## 3. Configurar la Pantalla de Consentimiento OAuth

- En el menú lateral, selecciona **"Pantalla de consentimiento OAuth"**.

- Completa el formulario con la información requerida:
  - **Tipo de usuario**: Selecciona entre Interno o Externo según tus necesidades.
  - **Nombre de la aplicación**: Escribe un nombre que se mostrará a los usuarios.
  - **Dirección de correo electrónico**: Proporciona una dirección de correo válida.
  - **Logo de la aplicación (opcional)**: Puedes subir un logo si lo deseas.
  - **Dominios de servicio (opcional)**: Agrega dominios si es necesario.

- Haz clic en **"Guardar y continuar"** para finalizar.

## 4. Crear Credenciales OAuth 2.0

- En el menú lateral, selecciona **"Credenciales"**.

- Haz clic en **"Crear credenciales"** y selecciona **"ID de cliente de OAuth"**.

- Selecciona **"Aplicación web"** como tipo de aplicación.

- Completa el formulario de creación de credenciales:
  - **Nombre**: Escribe un nombre descriptivo para las credenciales.
  - **URLs de redirección autorizadas**: Agrega la URL de redirección donde Google enviará la respuesta después de la autenticación (por ejemplo, `http://localhost:5000/auth/google/callback`).
  - **URLs de orígenes autorizados (opcional)**: Puedes agregar la URL de tu sitio web si es necesario.

- Haz clic en **"Crear"**.

- Una vez creadas las credenciales, toma nota del **Client ID** y el **Client Secret**. Los necesitarás para configurar tu aplicación.

## 5. Configurar la Autenticación en tu Aplicación

- Utiliza las bibliotecas de cliente de Google disponibles para tu lenguaje de programación (por ejemplo, `google-auth-library` para Node.js) para implementar el flujo de autenticación OAuth2.

- Configura tu aplicación para que utilice el **Client ID** y el **Client Secret** obtenidos en el paso anterior.


# Proceso de Autenticación OAuth2 con Discord

Este documento detalla los pasos necesarios para configurar la autenticación OAuth2 utilizando Discord.

## 1. Crear una Aplicación en Discord

- **Visitar el Portal de Desarrolladores de Discord**: Dirígete a [Discord Developer Portal](https://discord.com/developers/applications).

- **Iniciar sesión**: Accede con tu cuenta de Discord.

- **Crear una nueva aplicación**:
  - Haz clic en el botón **"New Application"** en la parte superior derecha.
  - Ingresa un nombre para tu aplicación y haz clic en **"Create"**.

## 2. Obtener el Client ID y el Client Secret

- Una vez creada la aplicación, serás redirigido al panel de control de la aplicación.

- En la pestaña **"General Information"**, encontrarás el **Client ID** y el **Client Secret**. Haz clic en el botón **"Copy"** para copiar cada uno. Guarda estos valores, ya que los necesitarás para configurar tu aplicación.

## 3. Configurar la Aplicación para Usar OAuth2

- En el menú lateral, selecciona la pestaña **"OAuth2"**.

- En la sección **"Redirects"**:
  - Agrega la URL de redirección donde Discord enviará la respuesta después de la autenticación (por ejemplo, `http://localhost:5000/auth/discord/callback`).
  - Haz clic en **"Add"**.

- En la sección **"Scopes"**:
  - Selecciona los scopes que deseas utilizar (por ejemplo, `identify` para acceder a la información básica del usuario).

- En la sección **"OAuth2 URL Generator"**:
  - Selecciona los scopes y permissions que necesites.
  - Copia la URL generada en la parte inferior; la utilizarás para iniciar el flujo de autenticación.

## 4. Implementar la Autenticación en tu Aplicación

- Utiliza las bibliotecas de cliente disponibles para tu lenguaje de programación para implementar el flujo de autenticación OAuth2 (por ejemplo, `discord.js` para Node.js).

- Configura tu aplicación para que utilice el **Client ID** y el **Client Secret** obtenidos en el paso 2.

- Redirige a los usuarios a la URL generada en el paso 3 para iniciar el proceso de autenticación.

- Maneja el callback en tu servidor para procesar la respuesta de Discord y obtener el access token.


# Rutas de Autenticación

Este documento detalla las rutas de autenticación implementadas para Google, Discord y Facebook en la aplicación.

## Rutas de Autenticación para Google

- **GET /auth/google**: Inicia el proceso de autenticación con Google.
  - `passport.authenticate('google', { scope: ['profile', 'email'] })` activa la estrategia de Google y especifica que se soliciten permisos para acceder al perfil y al correo electrónico del usuario.

- **GET /auth/google/callback**: Esta es la ruta de redirección de Google después de que el usuario autoriza o rechaza el acceso.
  - `passport.authenticate` maneja la respuesta:
    - **successRedirect**: `/dashboard`: Redirige a la página de dashboard en caso de éxito.
    - **failureRedirect**: `/login`: Redirige a la página de login si la autenticación falla.

## Rutas de Autenticación para Discord

- **GET /auth/discord**: Inicia la autenticación con Discord.
  - Similar a Google, el scope incluye `identify` (para obtener el perfil) y `email`.

- **GET /auth/discord/callback**: Ruta de redirección después de la autenticación en Discord.
  - `passport.authenticate` maneja la respuesta y redirige a:
    - **successRedirect**: `/dashboard` si la autenticación es exitosa.
    - **failureRedirect**: `/login` si falla.

## Rutas de Autenticación para Facebook

- **GET /auth/facebook**: Inicia la autenticación con Facebook.
  - El scope solicita permiso para el correo electrónico.

- **GET /auth/facebook/callback**: Ruta de redirección tras autenticación en Facebook.
  - Redirige según el resultado:
    - **successRedirect**: `/dashboard`.
    - **failureRedirect**: `/login`.







