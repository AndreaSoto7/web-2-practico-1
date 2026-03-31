module.exports = (sequelize, DataTypes) => {
    const Cancha = sequelize.define('cancha', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        nombre: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        tipo_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'tipos_cancha',
                key: 'id',
            },
        },
        precioPorHora: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        estado: {
            type: DataTypes.ENUM('activa', 'inactiva'),
            allowNull: false,
            defaultValue: 'activa',
        },
    }, {
        tableName: 'canchas',
        timestamps: true,
    });

    return Cancha;
};