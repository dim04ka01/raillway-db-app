const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Brigade = sequelize.define('Brigade', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'ID_Бригады'
    },
    departmentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'ID_Отдела',
        references: { model: 'Отделы', key: 'ID_Отдела' }
    },
    brigadeTypeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'ID_Типа_бригады',
        references: { model: 'Тип_бригады', key: 'ID_Типа_бригады' }
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'Название'
    }
}, {
    tableName: 'Бригады',
    timestamps: false
});

module.exports = Brigade;