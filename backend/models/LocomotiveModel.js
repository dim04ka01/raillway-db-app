const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const LocomotiveModel = sequelize.define('LocomotiveModel', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'ID_Модели_локомотива'
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'Название'
    },
    tractionForce: {
        type: DataTypes.STRING,
        field: 'Сила_тяги'
    },
    speed: {
        type: DataTypes.STRING,
        field: 'Скорость'
    },
    couplingWeight: {
        type: DataTypes.STRING,
        field: 'Сцепной_вес'
    },
    serviceWeight: {
        type: DataTypes.STRING,
        field: 'Служебный_вес'
    }
}, {
    tableName: 'Модели_локомотивов',
    timestamps: false
});

module.exports = LocomotiveModel;