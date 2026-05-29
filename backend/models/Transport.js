const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Transport = sequelize.define('Transport', {
    id: {
        type: DataTypes.STRING(20),
        primaryKey: true,
        allowNull: false,
        field: 'ID_ТС',
    },
    productionDate: {
        type: DataTypes.DATEONLY,
        field: 'Дата_производства'
    }
}, {
    tableName: 'Транспортное_средство',
    timestamps: false
});

module.exports = Transport;