const router = require('express').Router();
const { MaintenanceRequest, Transport, Locomotive, Wagon, Employee, LocomotiveModel, WagonModel, WagonType } = require('../models');
const { isAuthenticated, isManagerOrAdmin, isAdmin } = require('../middleware/auth');

// Вспомогательная функция для получения информации о ТС (тип, модель)
async function enrichTransport(transportId) {
    const transport = await Transport.findByPk(transportId);
    if (!transport) return null;
    const loco = await Locomotive.findByPk(transportId, { include: [LocomotiveModel] });
    if (loco) {
        return {
            id: transport.id,
            productionDate: transport.productionDate,
            type: 'locomotive',
            model: loco.LocomotiveModel ? loco.LocomotiveModel.name : null
        };
    }
    const wagon = await Wagon.findByPk(transportId, { include: [WagonModel, WagonType] });
    if (wagon) {
        return {
            id: transport.id,
            productionDate: transport.productionDate,
            type: 'wagon',
            model: wagon.WagonModel ? wagon.WagonModel.name : null,
            wagonType: wagon.WagonType ? wagon.WagonType.name : null
        };
    }
    return { id: transport.id, productionDate: transport.productionDate, type: 'unknown' };
}

// GET /api/maintenance-requests
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const where = req.user.roleName === 'Администрация' ? {} : { managerId: req.user.id };
        const requests = await MaintenanceRequest.findAll({
            where,
            include: [
                { model: Employee, attributes: ['id', 'lastName', 'firstName'] },
                { model: Transport, attributes: ['id', 'productionDate'] }
            ],
            order: [['createdAt', 'DESC']]
        });
        const enriched = await Promise.all(requests.map(async (req) => {
            const transportInfo = await enrichTransport(req.transportId);
            return { ...req.toJSON(), transportInfo };
        }));
        res.json(enriched);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/maintenance-requests/:id
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const request = await MaintenanceRequest.findByPk(req.params.id, {
            include: [
                { model: Employee, attributes: ['id', 'lastName', 'firstName'] },
                { model: Transport, attributes: ['id', 'productionDate'] }
            ]
        });
        if (!request) return res.status(404).json({ error: 'Заявка не найдена' });
        if (req.user.roleName !== 'Администрация' && request.managerId !== req.user.id) {
            return res.status(403).json({ error: 'Доступ запрещён' });
        }
        const transportInfo = await enrichTransport(request.transportId);
        res.json({ ...request.toJSON(), transportInfo });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/maintenance-requests/for-transport/:transportId
router.get('/for-transport/:transportId', isAuthenticated, async (req, res) => {
    try {
        const { transportId } = req.params;
        const requests = await MaintenanceRequest.findAll({
            where: {
                transportId: transportId,
                status: 'В ожидании'
            },
            attributes: ['id', 'desiredDate', 'description']
        });
        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/maintenance-requests
router.post('/', isAuthenticated, isManagerOrAdmin, async (req, res) => {
    try {
        const { transportId, desiredDate, description } = req.body;
        const transport = await Transport.findByPk(transportId);
        if (!transport) return res.status(404).json({ error: 'Транспортное средство не найдено' });
        const request = await MaintenanceRequest.create({
            managerId: req.user.id,
            transportId,
            desiredDate,
            description,
            status: 'В ожидании'
        });
        res.status(201).json(request);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT /api/maintenance-requests/:id (только администратор)
router.put('/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const request = await MaintenanceRequest.findByPk(req.params.id);
        if (!request) return res.status(404).json({ error: 'Заявка не найдена' });
        const allowedUpdates = ['status', 'completionDate', 'desiredDate', 'description'];
        const updateData = {};
        for (const field of allowedUpdates) {
            if (req.body[field] !== undefined) updateData[field] = req.body[field];
        }
        await request.update(updateData);
        res.json(request);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE /api/maintenance-requests/:id
router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const request = await MaintenanceRequest.findByPk(req.params.id);
        if (!request) return res.status(404).json({ error: 'Заявка не найдена' });
        await request.destroy();
        res.json({ message: 'Заявка удалена' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;