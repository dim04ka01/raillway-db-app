const jwt = require('jsonwebtoken');
const { UserData, Employee, Role } = require('../models');

// Проверка наличия и валидности JWT
const isAuthenticated = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Не авторизован' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userData = await UserData.findByPk(decoded.employeeId, {
            include: [
                { model: Employee },
                { model: Role }
            ]
        });
        if (!userData) return res.status(401).json({ error: 'Пользователь не найден' });
        req.user = {
            id: userData.employeeId,
            login: userData.login,
            roleId: userData.roleId,
            employee: userData.Employee
        };
        if (userData.Role) {
            req.user.roleName = userData.Role.name;
        }
        next();
    } catch (err) {
        res.status(401).json({ error: 'Неверный токен' });
    }
};

// Проверка роли "admin"
const isAdmin = (req, res, next) => {
    if (req.user.roleName !== 'Администрация') {
        return res.status(403).json({ error: 'Доступ запрещён' });
    }
    next();
};

// Проверка роли "admin" или "manager"
const isManagerOrAdmin = (req, res, next) => {
    if (req.user.roleName !== 'Администрация' && req.user.roleName !== 'Руководитель отдела') {
        return res.status(403).json({ error: 'Доступ запрещён' });
    }
    next();
};

module.exports = { isAuthenticated, isAdmin, isManagerOrAdmin };