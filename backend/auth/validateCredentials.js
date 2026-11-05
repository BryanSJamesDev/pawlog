
/**
 * Validates and sanitizes username and password credentials.
 * 
 * @param {string} username - The username input.
 * @param {string} password - The password input.
 * @returns {Object} An object containing the cleaned username and raw password.
 * @throws {Error} If any validation check fails.
 */
export function validateCredentials(username, password) {
    // Validate and sanitize username
    if (typeof username !== 'string') {
        throw new Error('Username must be a string.');
    }

    const cleanUsername = username.trim().toLowerCase();
    const usernameRegex = /^[a-z0-9_]{3,30}$/;
    if (!usernameRegex.test(cleanUsername)) {
        throw new Error('Username must be 3-30 characters: letters, numbers, or underscores.');
    }

    // Validate password
    if (typeof password !== 'string') {
        throw new Error('Password must be a string.');
    }

    if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
        throw new Error('Password must be 8-72 characters (shorter if it uses emoji or accents).');
    }

    // Return the sanitized credentials object
    return {
        username: cleanUsername,
        password
    };
}