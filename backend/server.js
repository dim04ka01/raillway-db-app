const cors = require('cors');
const { sequelize, Role, Department, Position, UserData, Employee } = require('./models'); // все модели

const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Подключение маршрутов
// Аутентификация 
app.use('/api/auth', require('./routes/auth'));

// Основные справочники
app.use('/api/employees', require('./routes/employees'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/brigades', require('./routes/brigades'));
app.use('/api/brigade-types', require('./routes/brigadeTypes'));
app.use('/api/positions', require('./routes/positions'));
app.use('/api/roles', require('./routes/roles'));
app.use('/api/user-data', require('./routes/userData'));

// Модели локомотивов и вагонов
app.use('/api/locomotive-models', require('./routes/locomotiveModels'));
app.use('/api/wagon-types', require('./routes/wagonTypes'));
app.use('/api/wagon-models', require('./routes/wagonModels'));

// Транспортные средства (общие)
app.use('/api/transport', require('./routes/transport'));
app.use('/api/locomotives', require('./routes/locomotives'));
app.use('/api/wagons', require('./routes/wagons'));

// История обслуживания
app.use('/api/maintenance', require('./routes/maintenance'));

// Заявки на техосмотр
app.use('/api/maintenance-requests', require('./routes/maintenanceRequests'));

// Отчёты
app.use('/api/reports', require('./routes/reports'));

// Функция инициализации базовых данных 
async function initDatabase() {
    // Создание ролей, если их нет
    const roles = ['Администрация', 'Руководитель отдела', 'Сотрудник'];
    for (const name of roles) {
        await Role.findOrCreate({ where: { name }, defaults: { name } });
    }
    // Создание отдела "Управление"
    const [adminDept] = await Department.findOrCreate({ where: { name: 'Управление' }, defaults: { name: 'Управление' } });
    // Создание должности "Начальник станции"
    const [adminPos] = await Position.findOrCreate({ where: { name: 'Начальник станции' }, defaults: { name: 'Начальник станции' } });
    // Создание администратора
    const existingAdmin = await UserData.findOne({ where: { login: 'admin' } });
    if (!existingAdmin) {
        // Создаём сотрудника для администратора
        const adminEmployee = await Employee.create({
            lastName: 'Администратор',
            firstName: 'Системы',
            email: 'admin@railway.station',
            phone: '+70000000000',
            positionId: adminPos.id
        });
        const adminRole = await Role.findOne({ where: { name: 'Администрация' } });
        await UserData.create({
            employeeId: adminEmployee.id,
            roleId: adminRole.id,
            login: 'admin',
            password: require('bcryptjs').hashSync('admin123', 10)
        });
        console.log('Создана учётная запись администратора: login = admin, password = admin123');
    }
}

// Запуск сервера
async function startServer() {
    try {
        // Проверка подключения к БД
        await sequelize.authenticate();
        console.log('Подключено к PostgreSQL');

        // Синхронизация моделей с базой данных
        await sequelize.sync({ alter: true });
        console.log('База данных синхронизирована');

        // Инициализация базовых справочников только при первом запуске (проверка внутри)
        await initDatabase();

        // Запуск Express-сервера
        app.listen(PORT, () => {
            console.log(`Сервер запущен на порту ${PORT}`);
        });
    } catch (error) {
        console.error('Ошибка при запуске сервера:', error.message);
        process.exit(1);
    }
}

startServer();