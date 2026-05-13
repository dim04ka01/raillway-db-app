const router = require('express').Router();
const ExcelJS = require('exceljs');
const { Op } = require('sequelize');
const {
    Employee, Brigade, Position, Department,
    Locomotive, LocomotiveModel,
    Wagon, WagonType, WagonModel,
    LocomotiveMaintenanceRecord, WagonMaintenanceRecord
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
                    { model: Brigade, include: [Department] }, // Вложенный include
                    Position
                ],
                order: [['id', 'ASC']]
            });
            headers = ['ID', 'Фамилия', 'Имя', 'Отчество', 'Должность', 'Бригада', 'Отдел', 'Телефон', 'Email'];
            rows = employees.map(emp => [
                emp.id,
                emp.lastName,
                emp.firstName,
                emp.middleName || '',
                emp.Position?.name || '',
                emp.Brigade?.name || '',
                emp.Brigade?.Department?.name || '', // Доступ к отделу через бригаду
                emp.phone || '',
                emp.email || ''
            ]);
            title = 'Сотрудники';
        }
        else if (reportType === 'rollingStock') {
            const locomotives = await Locomotive.findAll({ include: [LocomotiveModel] });
            const wagons = await Wagon.findAll({ include: [WagonType, WagonModel] });
            headers = ['Тип', 'ID', 'Модель', 'Тип/Модель', 'Дата производства'];
            rows = [];
            locomotives.forEach(loco => {
                rows.push(['Локомотив', loco.id, loco.LocomotiveModel?.name || '', '', loco.productionDate || '']);
            });
            wagons.forEach(wagon => {
                rows.push(['Вагон', wagon.id, wagon.WagonModel?.name || '', wagon.WagonType?.name || '', wagon.productionDate || '']);
            });
            title = 'Подвижной состав';
        }
        else if (reportType === 'maintenance') {
            const locoRecords = await LocomotiveMaintenanceRecord.findAll({
                where: dateFilter,
                include: [Locomotive, Employee],
                order: [['date', 'DESC']]
            });
            const wagonRecords = await WagonMaintenanceRecord.findAll({
                where: dateFilter,
                include: [Wagon, Employee],
                order: [['date', 'DESC']]
            });
            headers = ['Тип техники', 'ID техники', 'Дата', 'Сотрудник', 'Описание'];
            rows = [];
            locoRecords.forEach(rec => {
                rows.push([
                    'Локомотив',
                    rec.locomotiveId,
                    rec.date,
                    rec.Employee ? `${rec.Employee.lastName} ${rec.Employee.firstName}` : `ID ${rec.employeeId}`,
                    rec.description || ''
                ]);
            });
            wagonRecords.forEach(rec => {
                rows.push([
                    'Вагон',
                    rec.wagonId,
                    rec.date,
                    rec.Employee ? `${rec.Employee.lastName} ${rec.Employee.firstName}` : `ID ${rec.employeeId}`,
                    rec.description || ''
                ]);
            });
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