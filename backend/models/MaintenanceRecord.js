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
        field: 'ID_Сотрудника',
        references: { model: 'Сотрудники', key: 'ID_Сотрудника' }
    },
    transportId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'ID_ТС',
        references: { model: 'Транспортное_средство', key: 'ID_ТС' }
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'Дата'
    },
    description: {
        type: DataTypes.TEXT,
        field: 'Описание'
    }
}, {
    tableName: 'История_обслуживания',
    timestamps: false
});

module.exports = MaintenanceRecord;