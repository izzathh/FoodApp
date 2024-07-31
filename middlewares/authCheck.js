const jwt = require("jsonwebtoken");

const authenticationToken = (req, res, next) => {
    const token = req.cookies['auth_token'];
    if (!token) return res.sendStatus(401);
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.log('err:', err);
            return res.sendStatus(403);
        }
        req.user = user;
        next();
    });
};

module.exports = { authenticationToken }