const router = require('express').Router();
const { Transport, Locomotive, LocomotiveModel, Wagon, WagonModel, WagonType } = require('../models');
const { isAuthenticated } = require('../middleware/auth');

// GET /api/transport – список всех ТС
router.get('/', isAuthenticated, async (req, res) => {
    try {
        // Получаем все транспортные средства
        const transports = await Transport.findAll({
            attributes: ['id', 'productionDate'],
            order: [['id', 'ASC']]
        });

        const result = [];

        for (const ts of transports) {
            // Пытаемся найти локомотив
            const locomotive = await Locomotive.findOne({
                where: { transportId: ts.id },
                include: [{ model: LocomotiveModel, attributes: ['name'] }]
            });
            if (locomotive) {
                result.push({
                    id: ts.id,
                    type: 'locomotive',
                    modelName: locomotive.LocomotiveModel ? locomotive.LocomotiveModel.name : null,
                    productionDate: ts.productionDate,
                    // дополнительные поля для удобства
                    modelId: locomotive.modelId
                });
                continue;
            }

            // Ищем вагон
            const wagon = await Wagon.findOne({
                where: { transportId: ts.id },
                include: [
                    { model: WagonModel, attributes: ['name'] },
                    { model: WagonType, attributes: ['name'] }
                ]
            });
            if (wagon) {
                result.push({
                    id: ts.id,
                    type: 'wagon',
                    modelName: wagon.WagonModel ? wagon.WagonModel.name : null,
                    wagonType: wagon.WagonType ? wagon.WagonType.name : null,
                    productionDate: ts.productionDate,
                    modelId: wagon.modelId,
                    wagonTypeId: wagon.wagonTypeId
                });
                continue;
            }

            // Если не найден ни локомотив, ни вагон – теоретически такого быть не должно
            result.push({
                id: ts.id,
                type: 'unknown',
                productionDate: ts.productionDate
            });
        }

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/transport/:id – получить одно ТС по ID
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const ts = await Transport.findByPk(req.params.id, {
            attributes: ['id', 'productionDate']
        });
        if (!ts) return res.status(404).json({ error: 'Транспортное средство не найдено' });

        let result = { id: ts.id, productionDate: ts.productionDate };

        const locomotive = await Locomotive.findOne({
            where: { transportId: ts.id },
            include: [{ model: LocomotiveModel, attributes: ['name'] }]
        });
        if (locomotive) {
            result.type = 'locomotive';
            result.modelName = locomotive.LocomotiveModel ? locomotive.LocomotiveModel.name : null;
            result.modelId = locomotive.modelId;
            return res.json(result);
        }

        const wagon = await Wagon.findOne({
            where: { transportId: ts.id },
            include: [
                { model: WagonModel, attributes: ['name'] },
                { model: WagonType, attributes: ['name'] }
            ]
        });
        if (wagon) {
            result.type = 'wagon';
            result.modelName = wagon.WagonModel ? wagon.WagonModel.name : null;
            result.wagonType = wagon.WagonType ? wagon.WagonType.name : null;
            result.modelId = wagon.modelId;
            result.wagonTypeId = wagon.wagonTypeId;
            return res.json(result);
        }

        result.type = 'unknown';
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;