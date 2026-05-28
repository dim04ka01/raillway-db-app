const router = require('express').Router();
const ExcelJS = require('exceljs');
const { Op } = require('sequelize');
const {
    Employee, Brigade, Position, Department,
    Transport, Locomotive, LocomotiveModel,
    Wagon, WagonType, WagonModel,
    MaintenanceRecord
} = require('../models');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

router.post('/generate', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { reportType, periodStart, periodEnd, departmentId } = req.body;
        let headers = [];
        let rows = [];
        let title = '';

        // Фильтр по дате для обслуживания
        const dateFilter = {};
        if (periodStart && periodEnd) {
            dateFilter.date = { [Op.between]: [periodStart, periodEnd] };
        } else if (periodStart) {
            dateFilter.date = { [Op.gte]: periodStart };
        } else if (periodEnd) {
            dateFilter.date = { [Op.lte]: periodEnd };
        }

        if (reportType === 'employees') {
            const where = {};
            if (departmentId) {
                const brigades = await Brigade.findAll({ where: { departmentId }, attributes: ['id'] });
                const brigadeIds = brigades.map(b => b.id);
                where.brigadeId = brigadeIds;
            }
            const employees = await Employee.findAll({
                where,
                include: [
                    { model: Brigade, include: [Department] },
                    Position
                ],
                order: [['id', 'ASC']]
            });
            headers = ['ID', 'Фамилия', 'Имя', 'Отчество', 'Должность', 'Бригада', 'Отдел', 'Телефон', 'Email'];
            rows = employees.map(emp => [
                emp.id, emp.lastName, emp.firstName, emp.middleName || '',
                emp.Position?.name || '', emp.Brigade?.name || '', emp.Brigade?.Department?.name || '',
                emp.phone || '', emp.email || ''
            ]);
            title = 'Сотрудники';
        }
        else if (reportType === 'rollingStock') {
            // Объединяем локомотивы и вагоны через Transport
            const transports = await Transport.findAll({
                include: [
                    { model: Locomotive, include: [LocomotiveModel] },
                    { model: Wagon, include: [WagonType, WagonModel] }
                ]
            });
            headers = ['Тип', 'ID', 'Модель', 'Тип/Модель', 'Дата производства'];
            rows = [];
            transports.forEach(ts => {
                if (ts.Locomotive) {
                    rows.push(['Локомотив', ts.id, ts.Locomotive.LocomotiveModel?.name || '', '', ts.productionDate || '']);
                } else if (ts.Wagon) {
                    rows.push(['Вагон', ts.id, ts.Wagon.WagonModel?.name || '', ts.Wagon.WagonType?.name || '', ts.productionDate || '']);
                }
            });
            title = 'Подвижной состав';
        }
        else if (reportType === 'maintenance') {
            const records = await MaintenanceRecord.findAll({
                where: dateFilter,
                include: [
                    { model: Transport },
                    { model: Employee, attributes: ['id', 'lastName', 'firstName'] }
                ],
                order: [['date', 'DESC']]
            });
            headers = ['ID ТС', 'Тип', 'Дата', 'Сотрудник', 'Описание'];
            rows = [];
            for (const rec of records) {
                let type = 'Неизвестно';
                const loco = await Locomotive.findByPk(rec.transportId);
                if (loco) type = 'Локомотив';
                else {
                    const wagon = await Wagon.findByPk(rec.transportId);
                    if (wagon) type = 'Вагон';
                }
                rows.push([
                    rec.transportId, type, rec.date,
                    rec.Employee ? `${rec.Employee.lastName} ${rec.Employee.firstName}` : `ID ${rec.employeeId}`,
                    rec.description || ''
                ]);
            }
            title = 'История обслуживания';
        }

        // Генерация Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(title);
        worksheet.columns = headers.map(h => ({ header: h, key: h, width: 20 }));
        rows.forEach(row => {
            const obj = {};
            headers.forEach((h, idx) => { obj[h] = row[idx]; });
            worksheet.addRow(obj);
        });
        const buffer = await workbook.xlsx.writeBuffer();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=report_${reportType}_${Date.now()}.xlsx`);
        res.send(buffer);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;