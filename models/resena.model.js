module.exports = (sequelize, DataTypes) => {
    const Resena = sequelize.define('resena', {
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
        cancha_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'canchas',
                key: 'id',
            },
        },
        calificacion: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 5,
            },
        },
        comentario: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    }, {
        tableName: 'resenas',
        timestamps: true,
    });

    return Resena;
};