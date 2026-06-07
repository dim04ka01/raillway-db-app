const router = require('express').Router();
const { Transport, Locomotive, LocomotiveModel } = require('../models');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// GET /api/locomotives
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const locomotives = await Locomotive.findAll({
            include: [
                { model: Transport, attributes: ['id', 'productionDate'] },
                { model: LocomotiveModel }
            ]
        });
        const result = locomotives.map(l => ({
            id: l.transportId,
            modelId: l.modelId,
            productionDate: l.Transport ? l.Transport.productionDate : null,
            LocomotiveModel: l.LocomotiveModel
        }));
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/locomotives/:id
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const loco = await Locomotive.findByPk(req.params.id, {
            include: [
                { model: Transport, attributes: ['id', 'productionDate'] },
                { model: LocomotiveModel }
            ]
        });
        if (!loco) return res.status(404).json({ error: 'Локомотив не найден' });
        const result = {
            id: loco.transportId,
            modelId: loco.modelId,
            productionDate: loco.Transport ? loco.Transport.productionDate : null,
            LocomotiveModel: loco.LocomotiveModel
        };
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/locomotives – создание с ручным ID
router.post('/', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { id, modelId, productionDate } = req.body;
        if (!id) return res.status(400).json({ error: 'Необходимо указать ID транспортного средства' });

        // Проверка уникальности ID
        const existing = await Transport.findByPk(id);
        if (existing) return res.status(409).json({ error: 'Транспортное средство с таким ID уже существует' });

        // Создаём Transport с указанным ID
        const transport = await Transport.create({ id, productionDate });
        // Создаём Locomotive
        const locomotive = await Locomotive.create({
            transportId: transport.id,
            modelId
        });
        res.status(201).json({
            id: locomotive.transportId,
            modelId: locomotive.modelId,
            productionDate: transport.productionDate
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT /api/locomotives/:id
router.put('/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { modelId, productionDate } = req.body;
        const locomotive = await Locomotive.findByPk(req.params.id);
        if (!locomotive) return res.status(404).json({ error: 'Локомотив не найден' });

        if (modelId !== undefined) locomotive.modelId = modelId;
        await locomotive.save();

        const transport = await Transport.findByPk(locomotive.transportId);
        if (transport && productionDate !== undefined) {
            transport.productionDate = productionDate;
            await transport.save();
        }

        res.json({ id: locomotive.transportId, modelId: locomotive.modelId, productionDate: transport?.productionDate });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE /api/locomotives/:id
router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const locomotive = await Locomotive.findByPk(req.params.id);
        if (!locomotive) return res.status(404).json({ error: 'Локомотив не найден' });
        await Transport.destroy({ where: { id: locomotive.transportId } });
        res.json({ message: 'Локомотив удалён' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;