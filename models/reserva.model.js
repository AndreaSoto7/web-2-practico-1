const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Reserva = sequelize.define('reserva', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        usuario_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'usuarios',
                key: 'id',
            },
        },
        horario_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'horarios',
                key: 'id',
            },
        },
        estado: {
            type: DataTypes.ENUM('confirmada', 'cancelada'),
            allowNull: false,
            defaultValue: 'confirmada',
        },
    }, {
        tableName: 'reservas',
        timestamps: true,
    });

    return Reserva;
};