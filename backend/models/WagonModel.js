const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const WagonModel = sequelize.define('WagonModel', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'ID_Модели_вагона'
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'Название'
    },
    tareWeight: {
        type: DataTypes.STRING,
        field: 'Масса_тары'
    },
    designSpeed: {
        type: DataTypes.STRING,
        field: 'Конструкционная_скорость'
    },
    seatingCapacity: {
        type: DataTypes.INTEGER,
        field: 'Количество_мест'
    }
}, {
    tableName: 'Модели_вагонов',
    timestamps: false
});

module.exports = WagonModel;