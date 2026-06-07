const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Locomotive = sequelize.define('Locomotive', {
    transportId: {
        type: DataTypes.STRING(20),
        primaryKey: true,
        field: 'ID_ТС',
        references: { model: 'Транспортное_средство', key: 'ID_ТС' }
    },
    modelId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'ID_Модели_локомотива',
        references: { model: 'Модели_локомотивов', key: 'ID_Модели_локомотива' }
    }
}, {
    tableName: 'Локомотивы',
    timestamps: false
});

module.exports = Locomotive;