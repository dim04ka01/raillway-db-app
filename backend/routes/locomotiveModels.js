const router = require('express').Router();
const { LocomotiveModel, Locomotive } = require('../models');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// Получить все модели
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const models = await LocomotiveModel.findAll();
        res.json(models);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Получить одну модель по id
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const model = await LocomotiveModel.findByPk(req.params.id);
        if (!model) return res.status(404).json({ error: 'Модель не найдена' });
        res.json(model);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Создать модель (только admin)
router.post('/', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { name, tractionForce, speed, couplingWeight, serviceWeight } = req.body;
        const model = await LocomotiveModel.create({
            name,
            tractionForce,
            speed,
            couplingWeight,
            serviceWeight
        });
        res.status(201).json(model);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Обновить модель (только admin)
router.put('/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const model = await LocomotiveModel.findByPk(req.params.id);
        if (!model) return res.status(404).json({ error: 'Модель не найдена' });
        await model.update(req.body);
        res.json(model);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Удалить модель (только admin)
router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const model = await LocomotiveModel.findByPk(req.params.id);
        if (!model) return res.status(404).json({ error: 'Модель не найдена' });
        const count = await Locomotive.count({ where: { modelId: model.id } });
        if (count > 0) {
            return res.status(400).json({ error: 'Есть локомотивы этой модели, сначала удалите их' });
        }
        await model.destroy();
        res.json({ message: 'Модель удалена' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;