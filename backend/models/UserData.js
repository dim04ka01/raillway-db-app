const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const UserData = sequelize.define('UserData', {
    employeeId: {
        type: DataTypes.INTEGER,
        primaryKey: true,  // связь 1:1 с сотрудником
        field: 'ID_Сотрудника',
        references: { model: 'Сотрудники', key: 'ID_Сотрудника' }
    },
    roleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'ID_Роли',
        references: { model: 'Роли_в_системе', key: 'ID_Роли' }
    },
    login: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        field: 'Логин'
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'Пароль'
    }
}, {
    tableName: 'Данные_пользователя',
    timestamps: false
});

module.exports = UserData;