const router = require('express').Router();
const { BrigadeType, Brigade } = require('../models');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

router.get('/', isAuthenticated, async (req, res) => {
    try {
        const types = await BrigadeType.findAll();
        res.json(types);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const type = await BrigadeType.findByPk(req.params.id);
        if (!type) return res.status(404).json({ error: 'Тип бригады не найден' });
        res.json(type);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { name } = req.body;
        const type = await BrigadeType.create({ name });
        res.status(201).json(type);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.put('/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const type = await BrigadeType.findByPk(req.params.id);
        if (!type) return res.status(404).json({ error: 'Тип бригады не найден' });
        await type.update(req.body);
        res.json(type);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const type = await BrigadeType.findByPk(req.params.id);
        if (!type) return res.status(404).json({ error: 'Тип бригады не найден' });
        const count = await Brigade.count({ where: { brigadeTypeId: type.id } });
        if (count > 0) {
            return res.status(400).json({ error: 'Есть бригады этого типа, сначала удалите их' });
        }
        await type.destroy();
        res.json({ message: 'Тип бригады удалён' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;