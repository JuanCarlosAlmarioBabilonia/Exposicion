// passport-config.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const DiscordStrategy = require('passport-discord').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../../server/model/userSchema'); // Asegúrate de que el modelo esté en la misma ruta

// Serialización y deserialización de usuario
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id);
    done(null, user);
});

// Estrategia de Google
passport.use(new GoogleStrategy({
    clientID: 'GOOGLE_CLIENT_ID',
    clientSecret: 'GOOGLE_CLIENT_SECRET',
    callbackURL: '/auth/google/callback'
}, async (token, tokenSecret, profile, done) => {
    try {
        let user = await User.findOne({ providerId: profile.id, provider: 'google' });

        if (!user) {
            user = await User.create({
                providerId: profile.id,
                name: profile.displayName,
                email: profile.emails[0].value,
                profilePicture: profile.photos[0].value,
                provider: 'google'
            });
        } else {
            user.lastLogin = new Date();
            await user.save();
        }

        done(null, user);
    } catch (error) {
        done(error, null);
    }
}));

// Estrategias de Discord y Facebook (se agregan de forma similar)
passport.use(new DiscordStrategy({
    clientID: 'DISCORD_CLIENT_ID',
    clientSecret: 'DISCORD_CLIENT_SECRET',
    callbackURL: '/auth/discord/callback'
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ providerId: profile.id, provider: 'discord' });

        if (!user) {
            user = await User.create({
                providerId: profile.id,
                name: profile.username,
                provider: 'discord',
                profilePicture: profile.avatar ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png` : null
            });
        } else {
            user.lastLogin = new Date();
            await user.save();
        }

        done(null, user);
    } catch (error) {
        done(error, null);
    }
}));

// Estrategia de Facebook
passport.use(new FacebookStrategy({
    clientID: 'FACEBOOK_CLIENT_ID',
    clientSecret: 'FACEBOOK_CLIENT_SECRET',
    callbackURL: '/auth/facebook/callback',
    profileFields: ['id', 'displayName', 'photos', 'email']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ providerId: profile.id, provider: 'facebook' });

        if (!user) {
            user = await User.create({
                providerId: profile.id,
                name: profile.displayName,
                email: profile.emails[0].value,
                provider: 'facebook',
                profilePicture: profile.photos[0].value
            });
        } else {
            user.lastLogin = new Date();
            await user.save();
        }

        done(null, user);
    } catch (error) {
        done(error, null);
    }
}));
