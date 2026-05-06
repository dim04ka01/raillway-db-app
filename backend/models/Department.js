const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Department = sequelize.define('Department', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'ID_Отдела'
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'Название'
    }
}, {
    tableName: 'Отделы',
    timestamps: false
});

module.exports = Department;