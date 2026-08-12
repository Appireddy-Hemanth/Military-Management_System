
const prisma = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

module.exports = {
    uploadMiddleware: upload.single('file'),

    async uploadDocument(req, res, next) {
        try {
            if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

            const { referenceType, referenceId } = req.body;

            const doc = await prisma.document.create({
                data: {
                    name: req.file.originalname,
                    fileUrl: `/uploads/${req.file.filename}`,
                    fileType: req.file.mimetype,
                    fileSize: req.file.size,
                    referenceType,
                    referenceId: referenceId ? parseInt(referenceId) : null,
                    uploadedById: req.user.id
                }
            });

            await prisma.auditLog.create({
                data: { userId: req.user.id, action: 'DOCUMENT_UPLOADED', details: `Uploaded ${req.file.originalname}` }
            });

            res.status(201).json(doc);
        } catch (e) { next(e); }
    },

    async getDocuments(req, res, next) {
        try {
            const { referenceType, referenceId } = req.query;
            const where = {};
            if (referenceType) where.referenceType = referenceType;
            if (referenceId) where.referenceId = parseInt(referenceId);

            const docs = await prisma.document.findMany({ where, orderBy: { createdAt: 'desc' } });
            res.json(docs);
        } catch (e) { next(e); }
    },

    async deleteDocument(req, res, next) {
        try {
            const { id } = req.params;
            const doc = await prisma.document.findUnique({ where: { id: parseInt(id) } });
            if (!doc) return res.status(404).json({ error: 'Document not found' });

            if (req.user.role !== 'ADMIN' && req.user.id !== doc.uploadedById) {
                return res.status(403).json({ error: 'Unauthorized to delete this document' });
            }

            const filePath = path.join(__dirname, '..', doc.fileUrl);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            await prisma.document.delete({ where: { id: parseInt(id) } });
            res.json({ success: true });
        } catch (e) { next(e); }
    }
};
