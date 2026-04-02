const { sha1Encode } = require('../utils/text.utils');
const { checkUser, isAdmin } = require('../middleware/check-user');

module.exports = (app, db) => {

    app.get('/login', (req, res) => {
        res.render('auth/form-login', { error: null });
    });

    app.post('/login', async (req, res) => {
        const { email, password } = req.body;

        const usuario = await db.usuario.findOne({
            where: { email }
        });

        if (!usuario) {
            return res.render('auth/form-login', {
                error: 'Usuario o contraseña incorrectas'
            });
        }

        const encodedPassword = sha1Encode(password);

        if (encodedPassword !== usuario.password) {
            return res.render('auth/form-login', {
                error: 'Usuario o contraseña incorrectas'
            });
        }

        req.session.user = {
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            rol: usuario.rol
        };

        res.redirect('/');
    });

    app.get('/register', (req, res) => {
        res.render('auth/form-register', { error: null });
    });

    app.post('/register', async (req, res) => {
        const { nombre, email, password } = req.body;

        const existingUser = await db.usuario.findOne({
            where: { email }
        });

        if (existingUser) {
            return res.render('auth/form-register', {
                error: 'El email ya está registrado'
            });
        }

        const encodedPassword = sha1Encode(password);

        await db.usuario.create({
            nombre,
            email,
            password: encodedPassword,
            rol: 'cliente'
        });

        res.redirect('/login');
    });

    app.post('/admin/register', checkUser, isAdmin, async (req, res) => {
        const { nombre, email, password } = req.body;

        if (!nombre || !email || !password) {
            return res.status(400).send('Nombre, email y password son obligatorios');
        }

        const existingUser = await db.usuario.findOne({
            where: { email }
        });

        if (existingUser) {
            return res.status(409).send('El email ya esta registrado');
        }

        const encodedPassword = sha1Encode(password);

        const nuevoAdmin = await db.usuario.create({
            nombre,
            email,
            password: encodedPassword,
            rol: 'admin'
        });

        return res.status(201).send(`Administrador creado: ${nuevoAdmin.email}`);
    });

    app.get('/logout', (req, res) => {
        req.session.user = null;
        res.redirect('/login');
    });

    app.get('/', async (req, res) => {
        if (!req.session.user) {
            return res.redirect('/login');
        }

        const isAdmin = req.session.user.rol === 'admin';

        const [
            totalCanchas,
            totalHorariosDisponibles,
            totalReservas,
            totalResenas,
        ] = await Promise.all([
            db.cancha.count(),
            db.horario.count({ where: { disponible: true } }),
            db.reserva.count(isAdmin ? {} : { where: { usuario_id: req.session.user.id } }),
            db.resena.count(),
        ]);

        const latestReservas = await db.reserva.findAll({
            where: isAdmin ? {} : { usuario_id: req.session.user.id },
            include: [
                {
                    model: db.horario,
                    as: 'horario',
                    include: [
                        {
                            model: db.cancha,
                            as: 'cancha',
                        },
                    ],
                },
            ],
            order: [['createdAt', 'DESC']],
            limit: 5,
        });

        res.render('home/index', {
            currentUser: req.session.user,
            isAdmin,
            stats: {
                totalCanchas,
                totalHorariosDisponibles,
                totalReservas,
                totalResenas,
            },
            latestReservas,
        });
    });
};
