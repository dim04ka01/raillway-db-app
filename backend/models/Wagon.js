const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Wagon = sequelize.define('Wagon', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'ID_Вагона'
    },
    wagonTypeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'ID_Типа_вагона',
        references: { model: 'Типы_вагонов', key: 'ID_Типа_вагона' }
    },
    modelId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'ID_Модели_вагона',
        references: { model: 'Модели_вагонов', key: 'ID_Модели_вагона' }
    },
    productionDate: {
        type: DataTypes.DATEONLY,
        field: 'Дата_производства'
    }
}, {
    tableName: 'Вагоны',
    timestamps: false
});

module.exports = Wagon;