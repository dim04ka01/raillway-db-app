const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const { Attachment, MaintenanceRequest, MaintenanceRecord } = require('../models');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// Настройка хранилища для постоянных файлов (на диск)
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
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Только изображения'), false);
    }
});

// Отдельный multer для распознавания (в память)
const uploadMemory = multer({ storage: multer.memoryStorage() });

// POST /api/uploads - загрузка одного файла (на диск)
router.post('/', isAuthenticated, upload.single('file'), async (req, res) => {
    try {
        const { entityType, entityId } = req.body;
        if (!entityType || !entityId) {
            return res.status(400).json({ error: 'Не указан тип или ID сущности' });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'Файл не загружен' });
        }

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

// GET /api/uploads/:entityType/:entityId - список файлов
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
        fs.unlink(attachment.filePath, (err) => { if (err) console.error(err); });
        await attachment.destroy();
        res.json({ message: 'Файл удалён' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Распознавание номера (используем uploadMemory)
router.post('/detect-number', uploadMemory.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Файл не загружен' });
        }
        const form = new FormData();
        form.append('image', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype
        });
        const response = await axios.post('http://localhost:5001/predict', form, {
            headers: form.getHeaders()
        });
        res.json({ number: response.data.number });
    } catch (err) {
        console.error('OCR error:', err.message);
        if (err.response) {
            console.error('Response data:', err.response.data);
        }
        res.status(500).json({ error: 'Ошибка распознавания' });
    }
});

module.exports = router;