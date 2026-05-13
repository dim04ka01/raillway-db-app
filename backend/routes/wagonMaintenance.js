const router = require('express').Router();
const { WagonMaintenanceRecord, Wagon, Employee } = require('../models');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

router.get('/', isAuthenticated, async (req, res) => {
    try {
        const records = await WagonMaintenanceRecord.findAll({
            include: [
                { model: Wagon, attributes: ['id'] },
                { model: Employee, attributes: ['id', 'lastName', 'firstName'] }
            ]
        });
        res.json(records);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const record = await WagonMaintenanceRecord.findByPk(req.params.id, {
            include: [Wagon, Employee]
        });
        if (!record) return res.status(404).json({ error: 'Запись не найдена' });
        res.json(record);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', isAuthenticated, async (req, res) => {
    try {
        const { wagonId, date, description } = req.body;
        const employeeId = req.user.id;
        const record = await WagonMaintenanceRecord.create({
            employeeId,
            wagonId,
            date,
            description
        });
        res.status(201).json(record);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.put('/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const record = await WagonMaintenanceRecord.findByPk(req.params.id);
        if (!record) return res.status(404).json({ error: 'Запись не найдена' });
        await record.update(req.body);
        res.json(record);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const record = await WagonMaintenanceRecord.findByPk(req.params.id);
        if (!record) return res.status(404).json({ error: 'Запись не найдена' });
        await record.destroy();
        res.json({ message: 'Запись удалена' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;