const router = require('express').Router();
const { MaintenanceRecord, Transport, Locomotive, Wagon, Employee } = require('../models');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// Вспомогательная функция для определения типа транспорта (локомотив/вагон)
async function getTransportType(transportId) {
    const loco = await Locomotive.findByPk(transportId);
    if (loco) return 'locomotive';
    const wagon = await Wagon.findByPk(transportId);
    if (wagon) return 'wagon';
    return null;
}

// GET /api/maintenance – список всех записей (с сортировкой по дате, сначала новые)
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const records = await MaintenanceRecord.findAll({
            include: [
                { model: Transport, attributes: ['id', 'productionDate'] },
                { model: Employee, attributes: ['id', 'lastName', 'firstName'] }
            ],
            order: [['date', 'DESC']]
        });
        // Добавляем тип транспорта для каждой записи
        const enriched = await Promise.all(records.map(async (record) => {
            const type = await getTransportType(record.transportId);
            return {
                ...record.toJSON(),
                transportType: type
            };
        }));
        res.json(enriched);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/maintenance/:id – получить одну запись
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const record = await MaintenanceRecord.findByPk(req.params.id, {
            include: [
                { model: Transport, attributes: ['id', 'productionDate'] },
                { model: Employee, attributes: ['id', 'lastName', 'firstName'] }
            ]
        });
        if (!record) return res.status(404).json({ error: 'Запись не найдена' });
        const type = await getTransportType(record.transportId);
        res.json({ ...record.toJSON(), transportType: type });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/maintenance – создание записи
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const { transportId, date, description, requestId } = req.body;
        const transport = await Transport.findByPk(transportId);
        if (!transport) return res.status(404).json({ error: 'Транспортное средство не найдено' });

        // Если указана заявка, проверяем её
        if (requestId) {
            const request = await MaintenanceRequest.findByPk(requestId);
            if (!request) return res.status(404).json({ error: 'Заявка не найдена' });
            if (request.transportId !== transportId) {
                return res.status(400).json({ error: 'Заявка не относится к данному транспортному средству' });
            }
            if (request.status !== 'В ожидании') {
                return res.status(400).json({ error: 'Заявка уже выполнена или неактивна' });
            }
        }

        const record = await MaintenanceRecord.create({
            employeeId: req.user.id,
            transportId,
            date,
            description,
            requestId: requestId || null
        });

        // Если заявка была указана – обновляем её
        if (requestId) {
            const request = await MaintenanceRequest.findByPk(requestId);
            await request.update({
                status: 'Выполнена',
                completionDate: date
            });
        }

        res.status(201).json(record);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT /api/maintenance/:id – обновить запись (только администратор)
router.put('/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const record = await MaintenanceRecord.findByPk(req.params.id);
        if (!record) return res.status(404).json({ error: 'Запись не найдена' });
        await record.update(req.body);
        res.json(record);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE /api/maintenance/:id – удалить запись (только администратор)
router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const record = await MaintenanceRecord.findByPk(req.params.id);
        if (!record) return res.status(404).json({ error: 'Запись не найдена' });
        await record.destroy();
        res.json({ message: 'Запись удалена' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;