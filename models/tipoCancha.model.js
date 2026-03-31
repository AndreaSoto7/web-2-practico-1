module.exports = (sequelize, DataTypes) => {
    const TipoCancha = sequelize.define('tipoCancha', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        nombre: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    }, {
        tableName: 'tipos_cancha',
        timestamps: true,
    });

    return TipoCancha;
};