module.exports = (sequelize, DataTypes) => {
    const Usuario = sequelize.define('usuario', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        nombre: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        rol: {
            type: DataTypes.ENUM('admin', 'cliente'),
            allowNull: false,
            defaultValue: 'cliente',
        },
    }, {
        tableName: 'usuarios',
        timestamps: true,
    });

    return Usuario;
};