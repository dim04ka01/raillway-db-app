const router = require('express').Router();
const { Position, Employee } = require('../models');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

router.get('/', isAuthenticated, async (req, res) => {
    try {
        const positions = await Position.findAll();
        res.json(positions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const position = await Position.findByPk(req.params.id);
        if (!position) return res.status(404).json({ error: 'Должность не найдена' });
        res.json(position);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { name } = req.body;
        const position = await Position.create({ name });
        res.status(201).json(position);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.put('/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const position = await Position.findByPk(req.params.id);
        if (!position) return res.status(404).json({ error: 'Должность не найдена' });
        await position.update(req.body);
        res.json(position);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const position = await Position.findByPk(req.params.id);
        if (!position) return res.status(404).json({ error: 'Должность не найдена' });
        const count = await Employee.count({ where: { positionId: position.id } });
        if (count > 0) {
            return res.status(400).json({ error: 'Есть сотрудники с этой должностью, сначала удалите их' });
        }
        await position.destroy();
        res.json({ message: 'Должность удалена' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;