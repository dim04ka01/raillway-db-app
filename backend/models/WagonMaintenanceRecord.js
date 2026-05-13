const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const WagonMaintenanceRecord = sequelize.define('WagonMaintenanceRecord', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'ID_Записи_о_вагоне'
    },
    employeeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'ID_Сотрудника',
        references: { model: 'Сотрудники', key: 'ID_Сотрудника' }
    },
    wagonId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'ID_Вагона',
        references: { model: 'Вагоны', key: 'ID_Вагона' }
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'Дата'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'Описание'
    }
}, {
    tableName: 'История_обслуживания_вагонов',
    timestamps: false
});

module.exports = WagonMaintenanceRecord;