const AdminJS = require('adminjs');
const AdminJSExpress = require('@adminjs/express');

const { authenticate } = require('./auth.js');
const { resources } = require('./resources.js');

const adminJs = new AdminJS({
    rootPath: '/admin',
    resources,
    branding: {
        companyName: 'Plot Listing Admin',
        withMadeWithLove: false,
    },
});

const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
    adminJs,
    {
        authenticate,
        cookieName: 'adminjs',
        cookiePassword:
            process.env.COOKIE_SECRET || 'super-secret-password-at-least-32-chars-long',
    },
    null,
    {
        secret:
            process.env.COOKIE_SECRET || 'super-secret-session-secret-32-chars-long',
        resave: false,
        saveUninitialized: false,
    }
);

module.exports = {
    adminJs,
    adminRouter
};