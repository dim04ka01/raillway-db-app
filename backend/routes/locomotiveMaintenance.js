const router = require('express').Router();
const { LocomotiveMaintenanceRecord, Locomotive, Employee } = require('../models');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// Получить все записи (для всех авторизованных)
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const records = await LocomotiveMaintenanceRecord.findAll({
            include: [
                { model: Locomotive, attributes: ['id'] },
                { model: Employee, attributes: ['id', 'lastName', 'firstName'] }
            ]
        });
        res.json(records);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Получить одну запись по id
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const record = await LocomotiveMaintenanceRecord.findByPk(req.params.id, {
            include: [Locomotive, Employee]
        });
        if (!record) return res.status(404).json({ error: 'Запись не найдена' });
        res.json(record);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Создать запись (только авторизованный сотрудник)
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const { locomotiveId, date, description } = req.body;
        const employeeId = req.user.id;
        const record = await LocomotiveMaintenanceRecord.create({
            employeeId,
            locomotiveId,
            date,
            description
        });
        res.status(201).json(record);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Обновить запись (только админ)
router.put('/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const record = await LocomotiveMaintenanceRecord.findByPk(req.params.id);
        if (!record) return res.status(404).json({ error: 'Запись не найдена' });
        await record.update(req.body);
        res.json(record);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Удалить запись (только админ)
router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const record = await LocomotiveMaintenanceRecord.findByPk(req.params.id);
        if (!record) return res.status(404).json({ error: 'Запись не найдена' });
        await record.destroy();
        res.json({ message: 'Запись удалена' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;