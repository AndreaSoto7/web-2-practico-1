const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Horario = sequelize.define('horario', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        cancha_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'canchas',
                key: 'id',
            },
        },
        fecha: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        hora_inicio: {
            type: DataTypes.TIME,
            allowNull: false,
        },
        hora_fin: {
            type: DataTypes.TIME,
            allowNull: false,
        },
        disponible: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
    }, {
        tableName: 'horarios',
        timestamps: true,
    });

    return Horario;
};