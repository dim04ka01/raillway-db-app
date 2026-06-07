const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const WagonType = sequelize.define('WagonType', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'ID_Типа_вагона'
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'Название'
    }
}, {
    tableName: 'Типы_вагонов',
    timestamps: false
});

module.exports = WagonType;