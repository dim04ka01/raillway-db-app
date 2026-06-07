const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Attachment = sequelize.define('Attachment', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'ID_Приложения'
    },
    entityType: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'Тип_сущности'
    },
    entityId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'ID_Сущности'
    },
    fileName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'Имя_файла'
    },
    filePath: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'Путь'
    },
    originalName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'Оригинальное_имя'
    },
    mimeType: {
        type: DataTypes.STRING,
        field: 'MIME_тип'
    },
    size: {
        type: DataTypes.INTEGER,
        field: 'Размер'
    }
}, {
    tableName: 'Приложения',
    timestamps: true,                 // включаем автоматические поля
    createdAt: 'Дата_создания',      // имя столбца для даты создания
    updatedAt: 'Дата_обновления'     // имя столбца для даты обновления
});

module.exports = Attachment;