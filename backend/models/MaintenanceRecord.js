const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const MaintenanceRecord = sequelize.define('MaintenanceRecord', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'ID_Записи'
    },
    employeeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'ID_Сотрудника'
    },
    transportId: {
        type: DataTypes.STRING(20),
        allowNull: false,
        field: 'ID_ТС'
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'Дата'
    },
    description: {
        type: DataTypes.TEXT,
        field: 'Описание'
    },
    requestId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'ID_Заявки'
    }
}, {
    tableName: 'История_обслуживания',
    timestamps: false
});

module.exports = MaintenanceRecord;