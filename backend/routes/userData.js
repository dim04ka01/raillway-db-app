const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { UserData, Employee, Role } = require('../models');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// Получить все записи (только admin)
router.get('/', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const users = await UserData.findAll({
            include: [
                { model: Employee, as: 'Employee' },
                { model: Role, as: 'Role' }
            ],
            attributes: { exclude: ['password'] }
        });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Получить одну запись по employeeId (админ или сам пользователь)
router.get('/:employeeId', isAuthenticated, async (req, res) => {
    try {
        const employeeId = parseInt(req.params.employeeId);
        if (req.user.roleName !== 'Администрация' && req.user.id !== employeeId) {
            return res.status(403).json({ error: 'Доступ запрещён' });
        }
        const user = await UserData.findByPk(employeeId, {
            include: [
                { model: Employee, as: 'Employee' },
                { model: Role, as: 'Role' }
            ],
            attributes: { exclude: ['password'] }
        });
        if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Создать запись (только admin)
router.post('/', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { employeeId, roleId, login, password } = req.body;
        if (!password) return res.status(400).json({ error: 'Пароль обязателен' });
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await UserData.create({
            employeeId,
            roleId,
            login,
            password: hashedPassword
        });
        const { password: _, ...userWithoutPassword } = user.toJSON();
        res.status(201).json(userWithoutPassword);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Обновить запись (админ может менять роль и логин; пользователь может менять только пароль)
router.put('/:employeeId', isAuthenticated, async (req, res) => {
    try {
        const employeeId = parseInt(req.params.employeeId);
        const user = await UserData.findByPk(employeeId);
        if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

        const isAdminUser = req.user.roleName === 'Администрация';
        const isSelf = req.user.id === employeeId;

        if (!isAdminUser && !isSelf) {
            return res.status(403).json({ error: 'Доступ запрещён' });
        }

        const updateData = {};
        if (isAdminUser) {
            if (req.body.roleId !== undefined) updateData.roleId = req.body.roleId;
            if (req.body.login !== undefined) updateData.login = req.body.login;
        }
        if (req.body.password) {
            updateData.password = await bcrypt.hash(req.body.password, 10);
        }

        await user.update(updateData);
        const updatedUser = await UserData.findByPk(employeeId, {
            include: [{ model: Role, as: 'Role' }],
            attributes: { exclude: ['password'] }
        });
        res.json(updatedUser);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Удалить запись (только admin)
router.delete('/:employeeId', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const user = await UserData.findByPk(req.params.employeeId);
        if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
        await user.destroy();
        res.json({ message: 'Учётная запись удалена' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;