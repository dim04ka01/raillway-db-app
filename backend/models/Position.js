const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Position = sequelize.define('Position', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'ID_Должности'
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'Название'
    }
}, {
    tableName: 'Должности',
    timestamps: false
});

module.exports = Position;