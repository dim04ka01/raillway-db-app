const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const BrigadeType = sequelize.define('BrigadeType', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'ID_Типа_бригады'
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'Название'
    }
}, {
    tableName: 'Тип_бригады',
    timestamps: false
});

module.exports = BrigadeType;