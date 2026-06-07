const router = require('express').Router();
const { WagonType, Wagon } = require('../models');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

router.get('/', isAuthenticated, async (req, res) => {
    try {
        const types = await WagonType.findAll();
        res.json(types);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const type = await WagonType.findByPk(req.params.id);
        if (!type) return res.status(404).json({ error: 'Тип не найден' });
        res.json(type);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { name } = req.body;
        const type = await WagonType.create({ name });
        res.status(201).json(type);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.put('/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const type = await WagonType.findByPk(req.params.id);
        if (!type) return res.status(404).json({ error: 'Тип не найден' });
        await type.update(req.body);
        res.json(type);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const type = await WagonType.findByPk(req.params.id);
        if (!type) return res.status(404).json({ error: 'Тип не найден' });
        const count = await Wagon.count({ where: { wagonTypeId: type.id } });
        if (count > 0) {
            return res.status(400).json({ error: 'Есть вагоны этого типа, сначала удалите их' });
        }
        await type.destroy();
        res.json({ message: 'Тип удалён' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;