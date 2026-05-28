const sequelize = require('../config/db');

// Импорт моделей
const Department = require('./Department');
const BrigadeType = require('./BrigadeType');
const Brigade = require('./Brigade');
const Position = require('./Position');
const Role = require('./Role');
const UserData = require('./UserData');
const Employee = require('./Employee');
const Transport = require('./Transport');
const LocomotiveModel = require('./LocomotiveModel');
const Locomotive = require('./Locomotive');
const WagonType = require('./WagonType');
const WagonModel = require('./WagonModel');
const Wagon = require('./Wagon');
const MaintenanceRecord = require('./MaintenanceRecord');
const MaintenanceRequest = require('./MaintenanceRequest');

// Связи
// Отделы - Бригады
Department.hasMany(Brigade, { foreignKey: 'ID_Отдела' });
Brigade.belongsTo(Department, { foreignKey: 'ID_Отдела' });

// Тип бригады - Бригады
BrigadeType.hasMany(Brigade, { foreignKey: 'ID_Типа_бригады' });
Brigade.belongsTo(BrigadeType, { foreignKey: 'ID_Типа_бригады' });

// Роли в системе - Данные пользователя
UserData.belongsTo(Role, { foreignKey: 'ID_Роли' });
Role.hasMany(UserData, { foreignKey: 'ID_Роли' });

// Сотрудник - Данные пользователя 
UserData.belongsTo(Employee, { foreignKey: 'ID_Сотрудника' });
Employee.hasOne(UserData, { foreignKey: 'ID_Сотрудника' });

// Сотрудник - Бригада
Brigade.hasMany(Employee, { foreignKey: 'ID_Бригады' });
Employee.belongsTo(Brigade, { foreignKey: 'ID_Бригады' });

// Сотрудник - Должность
Position.hasMany(Employee, { foreignKey: 'ID_Должности' });
Employee.belongsTo(Position, { foreignKey: 'ID_Должности' });

// Транспортное средство - Локомотив
Transport.hasOne(Locomotive, { foreignKey: 'transportId' });
Locomotive.belongsTo(Transport, { foreignKey: 'transportId' });

// Транспортное средство - Вагон
Transport.hasOne(Wagon, { foreignKey: 'transportId' });
Wagon.belongsTo(Transport, { foreignKey: 'transportId' });

// Модель локомотива - Локомотив
LocomotiveModel.hasMany(Locomotive, { foreignKey: 'modelId' });
Locomotive.belongsTo(LocomotiveModel, { foreignKey: 'modelId' });

// Тип вагона - Вагон
WagonType.hasMany(Wagon, { foreignKey: 'wagonTypeId' });
Wagon.belongsTo(WagonType, { foreignKey: 'wagonTypeId' });

// Модель вагона - Вагон
WagonModel.hasMany(Wagon, { foreignKey: 'modelId' });
Wagon.belongsTo(WagonModel, { foreignKey: 'modelId' });

// История обслуживания - Транспортное средство
MaintenanceRecord.belongsTo(Transport, { foreignKey: 'transportId' });
Transport.hasMany(MaintenanceRecord, { foreignKey: 'transportId' });

// История обслуживания - Сотрудник
MaintenanceRecord.belongsTo(Employee, { foreignKey: 'employeeId' });
Employee.hasMany(MaintenanceRecord, { foreignKey: 'employeeId' });

// Заявки - Транспортное средство
MaintenanceRequest.belongsTo(Transport, { foreignKey: 'transportId' });
Transport.hasMany(MaintenanceRequest, { foreignKey: 'transportId' });

// Заявки - Сотрудник
MaintenanceRequest.belongsTo(Employee, { foreignKey: 'managerId' });
Employee.hasMany(MaintenanceRequest, { foreignKey: 'managerId' });

// Экспортируем всё
module.exports = {
    sequelize,
    Employee,
    Department,
    Brigade,
    BrigadeType,
    Position,
    Role,
    UserData,
    Transport,
    LocomotiveModel,
    Locomotive,
    WagonType,
    WagonModel,
    Wagon,
    MaintenanceRecord,
    MaintenanceRequest
};