const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const { User } = require('../models');

// JWT Strategy Configuration
passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
}, async (payload, done) => {
  try {
    const user = await User.findByPk(payload.id);
    if (user) {
      return done(null, user);
    }
    return done(null, false);
  } catch (error) {
    return done(error, false);
  }
}));

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.BACKEND_URL}/api/auth/google/callback`,
  passReqToCallback: true // Pass the request to the callback
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    console.log('Google OAuth Profile:', profile);
    console.log('Request query params:', req.query);
    
    // Get role from state parameter or default to student
    const role = req.query.state || 'student';
    console.log('OAuth Role:', role);
    
    // Check if user already exists
    let user = await User.findOne({
      where: { email: profile.emails[0].value }
    });

    if (user) {
      // User exists, update profile info and verify role
      if (role === 'teacher' && user.role !== 'teacher') {
        return done(new Error('This Google account is not registered as a teacher'), null);
      }
      
      user.google_id = profile.id;
      user.foto_profil_url = profile.photos[0]?.value || user.foto_profil_url;
      user.last_login = new Date();
      await user.save();
      
      return done(null, user);
    } else {
      // Create new user - only students can register via Google
      if (role === 'teacher') {
        return done(new Error('Teachers cannot register via Google OAuth. Please contact admin.'), null);
      }
        user = await User.create({
        google_id: profile.id,
        nama_lengkap: profile.displayName,
        email: profile.emails[0].value,
        role: 'student', // Only students can use Google OAuth registration
        foto_profil_url: profile.photos[0]?.value,
        status: 'active',
        last_login: new Date(),
        kelas: 5, // Default kelas for Google OAuth students
        nama_sekolah: 'Google OAuth User' // Default school name
      });

      return done(null, user);
    }
  } catch (error) {
    console.error('Google OAuth Error:', error);
    return done(error, null);
  }
}));

// Serialize/deserialize (required for session, but we're using JWT)
passport.serializeUser((user, done) => {
  done(null, user.id_user);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;