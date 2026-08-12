const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

const generateToken = (userId, role, baseId) => {
    return jwt.sign({ userId, role, baseId }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

const login = async (req, res, next) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            res.status(400);
            throw new Error('Please provide username and password');
        }

        const user = await prisma.user.findUnique({
            where: { username },
            include: { _count: { select: { auditLogs: true } } } // just some random include if needed, actually let's include 2fa
        });

        if (user && (await bcrypt.compare(password, user.passwordHash))) {
            const tfa = await prisma.twoFactorAuth.findUnique({ where: { userId: user.id } });

            if (tfa && tfa.isEnabled) {
                // Generate a temporary verification token
                const tempToken = jwt.sign({ tempAuthId: user.id }, process.env.JWT_SECRET, { expiresIn: '5m' });
                return res.json({ requires2FA: true, tempToken });
            }

            await prisma.auditLog.create({
                data: { userId: user.id, action: 'LOGIN_SUCCESS', details: `User ${user.username} logged in` }
            });

            res.json({
                userId: user.id,
                role: user.role,
                baseId: user.baseId,
                token: generateToken(user.id, user.role, user.baseId)
            });
        } else {
            if (user) {
                await prisma.auditLog.create({
                    data: { userId: user.id, action: 'LOGIN_FAILED', details: `Invalid password attempt for ${user.username}` }
                });
            }
            res.status(401);
            throw new Error('Invalid username or password');
        }
    } catch (err) {
        next(err);
    }
};

const verifyLogin2FA = async (req, res, next) => {
    try {
        const { tempToken, code } = req.body;
        if (!tempToken || !code) return res.status(400).json({ error: 'Missing token or 2FA code' });

        const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
        if (!decoded || !decoded.tempAuthId) return res.status(401).json({ error: 'Invalid or expired temporary token' });

        const user = await prisma.user.findUnique({ where: { id: decoded.tempAuthId } });
        const tfa = await prisma.twoFactorAuth.findUnique({ where: { userId: user.id } });

        const speakeasy = require('speakeasy');
        const isValid = speakeasy.totp.verify({
            secret: tfa.secret,
            encoding: 'base32',
            token: code,
            window: 1
        });

        if (isValid) {
            await prisma.auditLog.create({
                data: { userId: user.id, action: 'LOGIN_SUCCESS', details: `User ${user.username} logged in with 2FA` }
            });
            res.json({
                userId: user.id,
                role: user.role,
                baseId: user.baseId,
                token: generateToken(user.id, user.role, user.baseId)
            });
        } else {
            await prisma.auditLog.create({
                data: { userId: user.id, action: '2FA_FAILED', details: `Failed 2FA entry during login` }
            });
            res.status(401).json({ error: 'Invalid 2FA code' });
        }
    } catch (e) { next(e); }
};

const getMe = async (req, res, next) => {
    try {
        res.json(req.user);
    } catch (err) {
        next(err);
    }
};

module.exports = { login, getMe, verifyLogin2FA };
