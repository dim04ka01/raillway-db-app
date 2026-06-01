const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Attachment, MaintenanceRequest, MaintenanceRecord } = require('../models');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// Настройка хранилища
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, unique + ext);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 МБ
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Только изображения'), false);
    }
});

// POST /api/uploads - загрузка одного файла
router.post('/', isAuthenticated, upload.single('file'), async (req, res) => {
    try {
        const { entityType, entityId } = req.body;
        if (!entityType || !entityId) {
            return res.status(400).json({ error: 'Не указан тип или ID сущности' });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'Файл не загружен' });
        }

        // Проверка существования сущности
        let entity;
        if (entityType === 'MaintenanceRequest') {
            entity = await MaintenanceRequest.findByPk(entityId);
        } else if (entityType === 'MaintenanceRecord') {
            entity = await MaintenanceRecord.findByPk(entityId);
        } else {
            return res.status(400).json({ error: 'Некорректный тип сущности' });
        }
        if (!entity) return res.status(404).json({ error: 'Сущность не найдена' });

        const attachment = await Attachment.create({
            entityType,
            entityId,
            fileName: req.file.filename,
            filePath: req.file.path,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size
        });
        res.status(201).json({
            id: attachment.id,
            fileName: req.file.filename,
            originalName: req.file.originalname,
            filePath: `/uploads/${req.file.filename}`
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/uploads/:entityType/:entityId - список файлов для сущности
router.get('/:entityType/:entityId', isAuthenticated, async (req, res) => {
    try {
        const { entityType, entityId } = req.params;
        const attachments = await Attachment.findAll({
            where: { entityType, entityId },
            order: [['Дата_создания', 'DESC']]
        });
        res.json(attachments.map(a => ({
            id: a.id,
            fileName: a.fileName,
            originalName: a.originalName,
            filePath: `/uploads/${a.fileName}`,
            size: a.size,
            createdAt: a.createdAt
        })));
    } catch (err) {
        console.error('Ошибка в GET /uploads:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/uploads/:id - удаление файла (только админ)
router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const attachment = await Attachment.findByPk(req.params.id);
        if (!attachment) return res.status(404).json({ error: 'Файл не найден' });
        // Удаляем физический файл
        fs.unlink(attachment.filePath, (err) => { if (err) console.error(err); });
        await attachment.destroy();
        res.json({ message: 'Файл удалён' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;