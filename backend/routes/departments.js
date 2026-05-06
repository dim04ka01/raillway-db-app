const router = require('express').Router();
const { Department, Brigade } = require('../models');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// Получить все отделы
router.get('/', isAuthenticated, async (req, res) => {
    const departments = await Department.findAll({ include: [{ model: Brigade }] });
    res.json(departments);
});

// Получить один отдел
router.get('/:id', isAuthenticated, async (req, res) => {
    const dept = await Department.findByPk(req.params.id, { include: [{ model: Brigade }] });
    if (!dept) return res.status(404).json({ error: 'Отдел не найден' });
    res.json(dept);
});

// Создать отдел (только admin)
router.post('/', isAuthenticated, isAdmin, async (req, res) => {
    const dept = await Department.create({ name: req.body.name });
    res.status(201).json(dept);
});

// Обновить отдел (только admin)
router.put('/:id', isAuthenticated, isAdmin, async (req, res) => {
    const dept = await Department.findByPk(req.params.id);
    if (!dept) return res.status(404).json({ error: 'Отдел не найден' });
    await dept.update({ name: req.body.name });
    res.json(dept);
});

// Удалить отдел (только admin)
router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
    const dept = await Department.findByPk(req.params.id);
    if (!dept) return res.status(404).json({ error: 'Отдел не найден' });
    // Проверка на наличие связанных бригад
    const brigades = await Brigade.count({ where: { departmentId: dept.id } });
    if (brigades > 0) return res.status(400).json({ error: 'У отдела есть бригады, сначала удалите их' });
    await dept.destroy();
    res.json({ message: 'Отдел удалён' });
});

module.exports = router;