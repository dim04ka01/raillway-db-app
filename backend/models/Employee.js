const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Employee = sequelize.define('Employee', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'ID_Сотрудника'
    },
    brigadeId: {
        type: DataTypes.INTEGER,
        field: 'ID_Бригады',
        references: { model: 'Brigade', key: 'ID_Бригады' }
    },
    positionId: {
        type: DataTypes.INTEGER,
        field: 'ID_Должности',
        references: { model: 'Position', key: 'ID_Должности' }
    },
    lastName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'Фамилия'
    },
    firstName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'Имя'
    },
    middleName: {
        type: DataTypes.STRING,
        field: 'Отчество'
    },
    birthDate: {
        type: DataTypes.DATEONLY,
        field: 'Дата_рождения'
    },
    phone: {
        type: DataTypes.STRING,
        field: 'Номер_телефона'
    },
    email: {
        type: DataTypes.STRING,
        unique: true,
        field: 'Email'
    }
    
}, {
    tableName: 'Сотрудники',
    timestamps: false
});

module.exports = Employee;