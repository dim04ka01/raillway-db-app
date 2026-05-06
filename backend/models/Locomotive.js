const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Locomotive = sequelize.define('Locomotive', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'ID_Локомотива'
    },
    modelId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'ID_Модели_локомотива',
        references: { model: 'Модели_локомотивов', key: 'ID_Модели_локомотива' }
    },
    productionDate: {
        type: DataTypes.DATEONLY,
        field: 'Дата_производства'
    }
}, {
    tableName: 'Локомотивы',
    timestamps: false
});

module.exports = Locomotive;