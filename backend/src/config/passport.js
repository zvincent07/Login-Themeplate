const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const Role = require('../models/Role');

// Only initialize Google OAuth if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
      },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists with this Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // Update last login
          user.lastLogin = new Date();
          await user.save({ validateBeforeSave: false });
          return done(null, user);
        }

        // Check if user exists with this email
        user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          // Link Google account to existing user
          user.googleId = profile.id;
          user.provider = 'google';
          user.avatar = profile.photos[0]?.value;
          user.isEmailVerified = true;
          user.lastLogin = new Date();
          await user.save();
          return done(null, user);
        }

        // Create new user (only 'user' role can sign up via OAuth)
        const userRole = await Role.findOne({ name: 'user' });

        if (!userRole) {
          return done(new Error('User role not found. Please seed the database.'), null);
        }

        user = await User.create({
          googleId: profile.id,
          email: profile.emails[0].value,
          firstName: profile.name?.givenName || '',
          lastName: profile.name?.familyName || '',
          role: userRole._id,
          roleName: 'user',
          provider: 'google',
          avatar: profile.photos[0]?.value,
          isEmailVerified: true,
          lastLogin: new Date(),
        });

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
    )
  );
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
