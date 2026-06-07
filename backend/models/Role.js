const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Role = sequelize.define('Role', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'ID_Роли'
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'Название'
    }
}, {
    tableName: 'Роли_в_системе',
    timestamps: false
});

module.exports = Role;