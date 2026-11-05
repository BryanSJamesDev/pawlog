import bcrypt from 'bcrypt';

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