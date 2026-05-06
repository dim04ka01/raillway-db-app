const router = require('express').Router();
const { Brigade, Department, BrigadeType, Employee } = require('../models');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

router.get('/', isAuthenticated, async (req, res) => {
    const brigades = await Brigade.findAll({ include: [Department, BrigadeType, Employee] });
    res.json(brigades);
});

router.get('/:id', isAuthenticated, async (req, res) => {
    const brigade = await Brigade.findByPk(req.params.id, { include: [Department, BrigadeType, Employee] });
    if (!brigade) return res.status(404).json({ error: 'Бригада не найдена' });
    res.json(brigade);
});

router.post('/', isAuthenticated, isAdmin, async (req, res) => {
    const { name, departmentId, brigadeTypeId } = req.body;
    const brigade = await Brigade.create({ name, departmentId, brigadeTypeId });
    res.status(201).json(brigade);
});

router.put('/:id', isAuthenticated, isAdmin, async (req, res) => {
    const brigade = await Brigade.findByPk(req.params.id);
    if (!brigade) return res.status(404).json({ error: 'Бригада не найдена' });
    await brigade.update(req.body);
    res.json(brigade);
});

router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
    const brigade = await Brigade.findByPk(req.params.id);
    if (!brigade) return res.status(404).json({ error: 'Бригада не найдена' });
    const employees = await Employee.count({ where: { brigadeId: brigade.id } });
    if (employees > 0) return res.status(400).json({ error: 'В бригаде есть сотрудники, сначала удалите их' });
    await brigade.destroy();
    res.json({ message: 'Бригада удалена' });
});

module.exports = router;