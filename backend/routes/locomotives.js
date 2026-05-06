const router = require('express').Router();
const { Locomotive, LocomotiveModel } = require('../models');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

router.get('/', isAuthenticated, async (req, res) => {
    try {
        const locomotives = await Locomotive.findAll({
            include: LocomotiveModel
        });
        res.json(locomotives);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const locomotive = await Locomotive.findByPk(req.params.id, {
            include: LocomotiveModel
        });
        if (!locomotive) return res.status(404).json({ error: 'Локомотив не найден' });
        res.json(locomotive);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { modelId, productionDate } = req.body;
        const locomotive = await Locomotive.create({ modelId, productionDate });
        res.status(201).json(locomotive);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.put('/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const locomotive = await Locomotive.findByPk(req.params.id);
        if (!locomotive) return res.status(404).json({ error: 'Локомотив не найден' });
        await locomotive.update(req.body);
        res.json(locomotive);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const locomotive = await Locomotive.findByPk(req.params.id);
        if (!locomotive) return res.status(404).json({ error: 'Локомотив не найден' });
        await locomotive.destroy();
        res.json({ message: 'Локомотив удалён' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;