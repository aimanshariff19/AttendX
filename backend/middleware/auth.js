const jwt = require('jsonwebtoken');

module.exports = function(role) {
    return function(req, res, next) {
        // Get token from cookie
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({ msg: 'No token, authorization denied' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
            req.user = decoded.user;
            
            if (role && req.user.role !== role) {
                return res.status(403).json({ msg: 'Access denied: Insufficient privileges' });
            }

            next();
        } catch (err) {
            res.status(401).json({ msg: 'Token is not valid' });
        }
    }
};
