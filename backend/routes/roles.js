const router = require('express').Router();
const { Role, UserData } = require('../models');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

router.get('/', isAuthenticated, async (req, res) => {
    try {
        const roles = await Role.findAll();
        res.json(roles);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const role = await Role.findByPk(req.params.id);
        if (!role) return res.status(404).json({ error: 'Роль не найдена' });
        res.json(role);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { name } = req.body;
        const role = await Role.create({ name });
        res.status(201).json(role);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.put('/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const role = await Role.findByPk(req.params.id);
        if (!role) return res.status(404).json({ error: 'Роль не найдена' });
        await role.update(req.body);
        res.json(role);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const role = await Role.findByPk(req.params.id);
        if (!role) return res.status(404).json({ error: 'Роль не найдена' });
        const count = await UserData.count({ where: { roleId: role.id } });
        if (count > 0) {
            return res.status(400).json({ error: 'Есть пользователи с этой ролью, сначала удалите их' });
        }
        await role.destroy();
        res.json({ message: 'Роль удалена' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;