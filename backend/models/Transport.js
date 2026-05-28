const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Transport = sequelize.define('Transport', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        field: 'ID_ТС',
        validate: {
            isInt: { msg: 'ID должно быть целым числом' },
            min: 1,
        }
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