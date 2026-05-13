const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const LocomotiveMaintenanceRecord = sequelize.define('LocomotiveMaintenanceRecord', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'ID_Записи_о_локомотиве'
    },
    employeeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'ID_Сотрудника',
        references: { model: 'Сотрудники', key: 'ID_Сотрудника' }
    },
    locomotiveId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'ID_Локомотива',
        references: { model: 'Локомотивы', key: 'ID_Локомотива' }
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
    tableName: 'История_обслуживания_локомотивов',
    timestamps: false
});

module.exports = LocomotiveMaintenanceRecord;