const router = require('express').Router();
const { Wagon, WagonType, WagonModel } = require('../models');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

router.get('/', isAuthenticated, async (req, res) => {
    try {
        const wagons = await Wagon.findAll({
            include: [WagonType, WagonModel]
        });
        res.json(wagons);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const wagon = await Wagon.findByPk(req.params.id, {
            include: [WagonType, WagonModel]
        });
        if (!wagon) return res.status(404).json({ error: 'Вагон не найден' });
        res.json(wagon);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { wagonTypeId, modelId, productionDate } = req.body;
        const wagon = await Wagon.create({ wagonTypeId, modelId, productionDate });
        res.status(201).json(wagon);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.put('/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const wagon = await Wagon.findByPk(req.params.id);
        if (!wagon) return res.status(404).json({ error: 'Вагон не найден' });
        await wagon.update(req.body);
        res.json(wagon);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const wagon = await Wagon.findByPk(req.params.id);
        if (!wagon) return res.status(404).json({ error: 'Вагон не найден' });
        // Проверка на связанные записи обслуживания
        await wagon.destroy();
        res.json({ message: 'Вагон удалён' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;