const sequelize = require('../config/db');

// Импорт моделей
const Department = require('./Department');
const BrigadeType = require('./BrigadeType');
const Brigade = require('./Brigade');
const Position = require('./Position');
const Role = require('./Role');
const UserData = require('./UserData');
const Employee = require('./Employee');
const LocomotiveModel = require('./LocomotiveModel');
const Locomotive = require('./Locomotive');
const WagonType = require('./WagonType');
const WagonModel = require('./WagonModel');
const Wagon = require('./Wagon');

// Связи
// Отделы - Бригады
Department.hasMany(Brigade, { foreignKey: 'ID_Отдела' });
Brigade.belongsTo(Department, { foreignKey: 'ID_Отдела' });

// Тип бригады - Бригады
BrigadeType.hasMany(Brigade, { foreignKey: 'ID_Типа_бригады' });
Brigade.belongsTo(BrigadeType, { foreignKey: 'ID_Типа_бригады' });

// Роли в системе - Данные пользователя
UserData.belongsTo(Role, { foreignKey: 'ID_Роли', as: 'Role' });
Role.hasMany(UserData, { foreignKey: 'ID_Роли' });

// Сотрудник - Данные пользователя 
UserData.belongsTo(Employee, { foreignKey: 'ID_Сотрудника', as: 'Employee' });
Employee.hasOne(UserData, { foreignKey: 'ID_Сотрудника' });

// Сотрудник - Бригада
Brigade.hasMany(Employee, { foreignKey: 'ID_Бригады' });
Employee.belongsTo(Brigade, { foreignKey: 'ID_Бригады' });

// Сотрудник - Должность
Position.hasMany(Employee, { foreignKey: 'ID_Должности' });
Employee.belongsTo(Position, { foreignKey: 'ID_Должности' });

// Локомотив - Модель локомотива
LocomotiveModel.hasMany(Locomotive, { foreignKey: 'ID_Модели_локомотива' });
Locomotive.belongsTo(LocomotiveModel, { foreignKey: 'ID_Модели_локомотива' });

// Вагон - Модель вагона
WagonModel.hasMany(Wagon, { foreignKey: 'ID_Модели_вагона' });
Wagon.belongsTo(WagonModel, { foreignKey: 'ID_Модели_вагона' });

// Вагон - Тип вагона
WagonType.hasMany(Wagon, { foreignKey: 'ID_Типа_вагона' });
Wagon.belongsTo(WagonType, { foreignKey: 'ID_Типа_вагона' });

// Экспортируем всё
module.exports = {
    sequelize,
    Department,
    BrigadeType,
    Brigade,
    Position,
    Role,
    UserData,
    Employee,
    LocomotiveModel,
    Locomotive,
    WagonType,
    WagonModel,
    Wagon
};