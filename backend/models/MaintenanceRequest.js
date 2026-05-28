const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const MaintenanceRequest = sequelize.define('MaintenanceRequest', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'ID_Заявки'
    },
    managerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'ID_Руководителя',
        references: { model: 'Сотрудники', key: 'ID_Сотрудника' }
    },
    transportId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'ID_ТС',
        references: { model: 'Транспортное_средство', key: 'ID_ТС' }
    },
    createdAt: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'Дата_создания'
    },
    desiredDate: {
        type: DataTypes.DATEONLY,
        field: 'Желаемая_дата_выполнения'
    },
    status: {
        type: DataTypes.STRING(50),
        defaultValue: 'Новая',
        field: 'Статус'
    },
    description: {
        type: DataTypes.TEXT,
        field: 'Описание'
    },
    completionDate: {
        type: DataTypes.DATEONLY,
        field: 'Дата_выполнения'
    }
}, {
    tableName: 'Заявки',
    timestamps: false
});

module.exports = MaintenanceRequest;