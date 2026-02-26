const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID || 'MISSING_CLIENT_ID',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'MISSING_CLIENT_SECRET',
            callbackURL: '/api/auth/google/callback',
            proxy: true,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Check if user already exists based on Google ID
                let user = await User.findOne({ googleId: profile.id });

                if (user) {
                    return done(null, user);
                }

                // If not found by googleId, check if email exists
                const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
                if (email) {
                    user = await User.findOne({ email });
                    if (user) {
                        // Link google ID to existing email account
                        user.googleId = profile.id;
                        // Avoid overwriting avatar if they have one already, but add if blank
                        if (!user.avatar && profile.photos && profile.photos[0]) {
                            user.avatar = profile.photos[0].value;
                        }
                        await user.save();
                        return done(null, user);
                    }
                }

                // Create a completely new user
                const newUser = await User.create({
                    googleId: profile.id,
                    name: profile.displayName,
                    email: email,
                    avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : '',
                });

                return done(null, newUser);
            } catch (error) {
                console.error('Google OAuth Error:', error);
                return done(error, false);
            }
        }
    )
);

module.exports = passport;
