const router = require('express').Router();
const { Employee, Brigade, Position, UserData, Role, Department } = require('../models');
const { isAuthenticated, isAdmin, isManagerOrAdmin } = require('../middleware/auth');

// Получениме списка сотрудников
router.get('/', isAuthenticated, async (req, res) => {
    try {
        let where = {};

        if (req.user.roleName === 'Руководитель отдела') {
            const manager = await Employee.findByPk(req.user.id, {
                include: [{ model: Brigade, include: [Department] }]
            });
            if (manager && manager.Brigade && manager.Brigade.Department) {
                const managerDeptId = manager.Brigade.Department.id;
                const brigadesOfDept = await Brigade.findAll({
                    where: { departmentId: managerDeptId },
                    attributes: ['id']
                });
                const brigadeIds = brigadesOfDept.map(b => b.id);
                where.brigadeId = brigadeIds;
            } else {
                return res.json([]);
            }
        }

        const employees = await Employee.findAll({
            where,
            include: [
                { model: Brigade, include: [Department] },
                Position,
                { model: UserData, include: [Role] }
            ]
        });
        res.json(employees);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Получение одного сотрудника
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const employee = await Employee.findByPk(req.params.id, {
            include: [
                { model: Brigade, include: [Department] },
                Position,
                { model: UserData, include: [Role] }
            ]
        });
        if (!employee) return res.status(404).json({ error: 'Сотрудник не найден' });

        if (req.user.roleName !== 'Администрация' && req.user.roleName !== 'Руководитель отдела') {
            if (parseInt(req.params.id) !== req.user.id) {
                return res.status(403).json({ error: 'Доступ запрещён' });
            }
        }
        if (req.user.roleName === 'Руководитель отдела') {
            const manager = await Employee.findByPk(req.user.id, {
                include: [{ model: Brigade, include: [Department] }]
            });
            if (manager && manager.Brigade && manager.Brigade.Department) {
                const managerDeptId = manager.Brigade.Department.id;
                const employeeDeptId = employee.Brigade?.Department?.id;
                if (employeeDeptId !== managerDeptId) {
                    return res.status(403).json({ error: 'Доступ запрещён' });
                }
            } else {
                return res.status(403).json({ error: 'Доступ запрещён' });
            }
        }

        res.json(employee);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Создание сотрудника
router.post('/', isAuthenticated, isManagerOrAdmin, async (req, res) => {
    try {
        const { lastName, firstName, middleName, birthDate, phone, email, brigadeId, positionId } = req.body;

        if (req.user.roleName === 'Руководитель отдела') {
            const brigade = await Brigade.findByPk(brigadeId, { include: [Department] });
            if (!brigade) {
                return res.status(400).json({ error: 'Бригада не найдена' });
            }
            const manager = await Employee.findByPk(req.user.id, {
                include: [{ model: Brigade, include: [Department] }]
            });
            const managerDeptId = manager.Brigade?.Department?.id;
            if (!managerDeptId || brigade.Department.id !== managerDeptId) {
                return res.status(403).json({ error: 'Нельзя создавать сотрудника в бригаде другого отдела' });
            }
        }

        const employee = await Employee.create({
            lastName, firstName, middleName, birthDate, phone, email, brigadeId, positionId
        });
        res.status(201).json(employee);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Обновление сотрудника
router.put('/:id', isAuthenticated, async (req, res) => {
    try {
        const employee = await Employee.findByPk(req.params.id, {
            include: [{ model: Brigade, include: [Department] }]
        });
        if (!employee) return res.status(404).json({ error: 'Сотрудник не найден' });

        const isAdmin = req.user.roleName === 'Администрация';
        const isManager = req.user.roleName === 'Руководитель отдела';
        const isSelf = parseInt(req.params.id) === req.user.id;

        // Администратор может обновлять любые поля
        if (isAdmin) {
            await employee.update(req.body);
            return res.json(employee);
        }

        // Руководитель отдела – только своих сотрудников
        if (isManager) {
            const manager = await Employee.findByPk(req.user.id, {
                include: [{ model: Brigade, include: [Department] }]
            });
            const managerDeptId = manager.Brigade?.Department?.id;
            const employeeDeptId = employee.Brigade?.Department?.id;
            if (managerDeptId && employeeDeptId === managerDeptId) {
                await employee.update(req.body);
                return res.json(employee);
            } else {
                return res.status(403).json({ error: 'Нельзя редактировать сотрудника из другого отдела' });
            }
        }

        // Сам сотрудник может обновлять только свои данные
        if (isSelf) {
            const allowedFields = ['phone', 'email', 'lastName', 'firstName', 'middleName', 'birthDate'];
            const updateData = {};
            for (const field of allowedFields) {
                if (req.body[field] !== undefined) {
                    updateData[field] = req.body[field];
                }
            }
            await employee.update(updateData);
            return res.json(employee);
        }

        return res.status(403).json({ error: 'Доступ запрещён' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Удаление сотрудника
router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const employee = await Employee.findByPk(req.params.id);
        if (!employee) return res.status(404).json({ error: 'Сотрудник не найден' });

        const userData = await UserData.findOne({ where: { employeeId: employee.id } });
        if (userData) {
            return res.status(400).json({ error: 'У сотрудника есть учётная запись, сначала удалите её' });
        }

        await employee.destroy();
        res.json({ message: 'Сотрудник удалён' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;