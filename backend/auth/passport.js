import bcrypt from 'bcrypt';
import { Strategy as LocalStrategy } from 'passport-local';
import { ObjectId } from 'mongodb';

/**
 * Verifies a user's credentials against the database users collection.
 *
 * @param {Object} users - The MongoDB users collection.
 * @param {string} username - The username input.
 * @param {string} password - The password input.
 * @returns {Promise<Object|null>} The user object without passwordHash if valid, otherwise null.
 */
export async function verifyUser(users, username, password) {
  // Check if username and password are provided as non-empty strings
  if (
    typeof username !== 'string' ||
    typeof password !== 'string' ||
    !username.trim() ||
    !password
  ) {
    return null;
  }

  // Find the user in the database (case-insensitive username lookup)
  const user = await users.findOne({ username: username.trim().toLowerCase() });
  if (!user) {
    return null;
  }

  // Safety check: ensure passwordHash exists and is a string
  if (typeof user.passwordHash !== 'string') {
    return null;
  }

  // Compare the typed password with the stored bcrypt hash
  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    return null;
  }

  // Return the user object safely without leaking the password hash (avoids ESLint unused variable warning)
  const safeUser = { ...user };
  delete safeUser.passwordHash;
  return safeUser;
}

/**
 * Configures Passport strategy, serialization, and deserialization.
 *
 * @param {Object} passport - The Passport library instance.
 * @param {Function} getDB - Function to retrieve the database connection.
 */

export function configurePassport(passport, getDB) {
  // Configure Local Strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const db = await getDB();
        const user = await verifyUser(
          db.collection('users'),
          username,
          password,
        );
        if (!user) {
          return done(null, false, { message: 'Invalid username or password' });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  // Serialize user ID into the login cookie
  passport.serializeUser((user, done) => {
    done(null, user._id.toString());
  });

  // Deserialize user from the stored ID on next requests
  passport.deserializeUser(async (id, done) => {
    try {
      if (!ObjectId.isValid(id)) {
        return done(null, false);
      }
      const db = await getDB();
      const user = await db
        .collection('users')
        .findOne(
          { _id: new ObjectId(id) },
          { projection: { passwordHash: 0 } },
        );
      done(null, user || false);
    } catch (error) {
      done(error);
    }
  });
}
