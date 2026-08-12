
const prisma = require('../config/db');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

module.exports = {
  async setup2FA(req, res, next) {
    try {
      const secret = speakeasy.generateSecret({ length: 20, name: `M.A.M.S. (${req.user.username})` });

      const imageUrl = await qrcode.toDataURL(secret.otpauth_url);

      const recoveryCodes = Array.from({ length: 5 }, () => Math.random().toString(36).substring(2, 8).toUpperCase());

      await prisma.twoFactorAuth.upsert({
        where: { userId: req.user.id },
        update: { secret: secret.base32, recoveryCodes: JSON.stringify(recoveryCodes), isEnabled: false },
        create: { userId: req.user.id, secret: secret.base32, recoveryCodes: JSON.stringify(recoveryCodes), isEnabled: false }
      });

      res.json({ secret: secret.base32, qrCode: imageUrl, recoveryCodes });
    } catch (e) { next(e); }
  },

  async verify2FA(req, res, next) {
    try {
      const { token } = req.body;
      const tfa = await prisma.twoFactorAuth.findUnique({ where: { userId: req.user.id } });

      if (!tfa) return res.status(400).json({ error: '2FA not setup' });

      // Note: passing token as standard string, default encoding for secret is ascii but speakeasy requires specifying base32
      const isValid = speakeasy.totp.verify({
        secret: tfa.secret,
        encoding: 'base32',
        token: token,
        window: 1 // allows 1 step before/after (30 seconds drift tolerance)
      });

      if (isValid) {
        await prisma.twoFactorAuth.update({
          where: { userId: req.user.id },
          data: { isEnabled: true }
        });

        await prisma.auditLog.create({
          data: { userId: req.user.id, action: '2FA_ENABLED', details: 'User successfully enabled Two-Factor Authentication' }
        });

        res.json({ success: true });
      } else {
        await prisma.auditLog.create({
          data: { userId: req.user.id, action: '2FA_FAILED', details: 'Failed 2FA verification attempt' }
        });
        res.status(401).json({ error: 'Invalid token' });
      }
    } catch (e) { next(e); }
  },

  async disable2FA(req, res, next) {
    try {
      await prisma.twoFactorAuth.update({
        where: { userId: req.user.id },
        data: { isEnabled: false }
      });
      res.json({ success: true });
    } catch (e) { next(e); }
  }
};
