const { sha1Encode } = require('../utils/text.utils');

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

    app.get('/logout', (req, res) => {
        req.session.user = null;
        res.redirect('/login');
    });

    app.get('/', (req, res) => {
        if (!req.session.user) {
            return res.redirect('/login');
        }

        res.send(`Bienvenido/a ${req.session.user.nombre}`);
    });
};