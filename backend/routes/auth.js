const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { UserData, Employee, Role } = require('../models');

// Регистрация нового пользователя (только для администраторов)
router.post('/register', async (req, res) => {
    try {
        const { login, password, employeeId, roleId } = req.body;
        const hashed = await bcrypt.hash(password, 10);
        const user = await UserData.create({
            login,
            password: hashed,
            employeeId,
            roleId
        });
        res.status(201).json({ message: 'Пользователь создан', userId: user.employeeId });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Логин
router.post('/login', async (req, res) => {
    try {
        const { login, password } = req.body;
        const user = await UserData.findOne({
            where: { login },
            include: [{ model: Role, as: 'Role' }, { model: Employee, as: 'Employee' }]
        });
        if (!user) return res.status(401).json({ error: 'Неверный логин или пароль' });
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ error: 'Неверный логин или пароль' });
        const token = jwt.sign(
            { employeeId: user.employeeId, login: user.login, role: user.Role.name },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );
        res.json({ token, user: { login: user.login, role: user.Role.name, employee: user.Employee } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;