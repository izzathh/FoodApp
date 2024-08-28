const jwt = require("jsonwebtoken");

const authenticationToken = (req, res, next) => {
    // const token = req.cookies['auth_token'];
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    console.log('token:', token);
    if (!token) return res.sendStatus(401);
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.log('err:', err);
            const options = {
                httpOnly: false,
                path: '/',
                sameSite: 'Lax',
                secure: false
            }
            res.clearCookie('auth_token', options)
            return res.sendStatus(403);
        }
        req.user = user;
        next();
    });
};

module.exports = { authenticationToken }