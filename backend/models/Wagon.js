const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Wagon = sequelize.define('Wagon', {
    transportId: {
        type: DataTypes.STRING(20),
        primaryKey: true,
        field: 'ID_ТС',
        references: { model: 'Транспортное_средство', key: 'ID_ТС' }
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
    }
}, {
    tableName: 'Вагоны',
    timestamps: false
});

module.exports = Wagon; 