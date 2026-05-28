const router = require('express').Router();
const { Transport, Wagon, WagonType, WagonModel } = require('../models');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

router.get('/', isAuthenticated, async (req, res) => {
    try {
        const wagons = await Wagon.findAll({
            include: [
                { model: Transport, attributes: ['id', 'productionDate'] },
                { model: WagonType },
                { model: WagonModel }
            ]
        });
        const result = wagons.map(w => ({
            id: w.transportId,
            wagonTypeId: w.wagonTypeId,
            modelId: w.modelId,
            productionDate: w.Transport ? w.Transport.productionDate : null,
            WagonType: w.WagonType,
            WagonModel: w.WagonModel
        }));
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const wagon = await Wagon.findByPk(req.params.id, {
            include: [
                { model: Transport, attributes: ['id', 'productionDate'] },
                { model: WagonType },
                { model: WagonModel }
            ]
        });
        if (!wagon) return res.status(404).json({ error: 'Вагон не найден' });
        const result = {
            id: wagon.transportId,
            wagonTypeId: wagon.wagonTypeId,
            modelId: wagon.modelId,
            productionDate: wagon.Transport ? wagon.Transport.productionDate : null,
            WagonType: wagon.WagonType,
            WagonModel: wagon.WagonModel
        };
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { id, wagonTypeId, modelId, productionDate } = req.body;
        if (!id) return res.status(400).json({ error: 'Необходимо указать ID транспортного средства' });

        const existing = await Transport.findByPk(id);
        if (existing) return res.status(409).json({ error: 'Транспортное средство с таким ID уже существует' });

        const transport = await Transport.create({ id, productionDate });
        const wagon = await Wagon.create({
            transportId: transport.id,
            wagonTypeId,
            modelId
        });
        res.status(201).json({
            id: wagon.transportId,
            wagonTypeId: wagon.wagonTypeId,
            modelId: wagon.modelId,
            productionDate: transport.productionDate
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.put('/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { wagonTypeId, modelId, productionDate } = req.body;
        const wagon = await Wagon.findByPk(req.params.id);
        if (!wagon) return res.status(404).json({ error: 'Вагон не найден' });
        if (wagonTypeId !== undefined) wagon.wagonTypeId = wagonTypeId;
        if (modelId !== undefined) wagon.modelId = modelId;
        await wagon.save();

        const transport = await Transport.findByPk(wagon.transportId);
        if (transport && productionDate !== undefined) {
            transport.productionDate = productionDate;
            await transport.save();
        }
        res.json({ id: wagon.transportId, wagonTypeId: wagon.wagonTypeId, modelId: wagon.modelId, productionDate: transport?.productionDate });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const wagon = await Wagon.findByPk(req.params.id);
        if (!wagon) return res.status(404).json({ error: 'Вагон не найден' });
        await Transport.destroy({ where: { id: wagon.transportId } });
        res.json({ message: 'Вагон удалён' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;