const bcrypt = require('bcrypt');
const prisma = require('../server/prisma');

const authenticate = async (email, password) => {
    try {
        if (!email || !password) return null;
        
        // 1. Check environment variable override
        if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD_HASH) {
            if (email.toLowerCase().trim() === process.env.ADMIN_EMAIL.toLowerCase().trim()) {
                const valid = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
                if (valid) {
                    return {
                        email,
                        role: 'super_admin',
                    };
                }
            }
        }

        // 2. Check Database users with super_admin role
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() }
        });
        if (user && user.role === 'super_admin') {
            const valid = await bcrypt.compare(password, user.passwordHash);
            if (valid) {
                return {
                    email: user.email,
                    role: 'super_admin',
                };
            }
        }
    } catch (err) {
        console.error('AdminJS authentication error:', err);
    }
    return null;
};

module.exports = {
    authenticate
};