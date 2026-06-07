const router = require('express').Router();
const { WagonModel, Wagon } = require('../models');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

router.get('/', isAuthenticated, async (req, res) => {
    try {
        const models = await WagonModel.findAll();
        res.json(models);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const model = await WagonModel.findByPk(req.params.id);
        if (!model) return res.status(404).json({ error: 'Модель не найдена' });
        res.json(model);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { name, tareWeight, designSpeed, seatingCapacity } = req.body;
        const model = await WagonModel.create({
            name,
            tareWeight,
            designSpeed,
            seatingCapacity
        });
        res.status(201).json(model);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.put('/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const model = await WagonModel.findByPk(req.params.id);
        if (!model) return res.status(404).json({ error: 'Модель не найдена' });
        await model.update(req.body);
        res.json(model);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const model = await WagonModel.findByPk(req.params.id);
        if (!model) return res.status(404).json({ error: 'Модель не найдена' });
        const count = await Wagon.count({ where: { modelId: model.id } });
        if (count > 0) {
            return res.status(400).json({ error: 'Есть вагоны этой модели, сначала удалите их' });
        }
        await model.destroy();
        res.json({ message: 'Модель удалена' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;