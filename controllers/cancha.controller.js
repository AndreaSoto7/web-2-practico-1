const { checkUser, isAdmin } = require('../middleware/check-user');

module.exports = (app, db) => {
    const loadTiposCancha = async () => {
        return db.tipoCancha.findAll({
            order: [['nombre', 'ASC']],
        });
    };

    const parseCanchaPayload = (body) => {
        return {
            nombre: body.nombre ? body.nombre.trim() : '',
            tipo_id: Number.parseInt(body.tipo_id, 10),
            precioPorHora: Number.parseFloat(body.precioPorHora),
            estado: body.estado,
        };
    };

    const validateCanchaPayload = async (payload) => {
        if (!payload.nombre) {
            return 'El nombre es obligatorio';
        }

        if (!Number.isInteger(payload.tipo_id)) {
            return 'Debes seleccionar un tipo de cancha valido';
        }

        const tipoCancha = await db.tipoCancha.findByPk(payload.tipo_id);
        if (!tipoCancha) {
            return 'El tipo de cancha seleccionado no existe';
        }

        if (Number.isNaN(payload.precioPorHora) || payload.precioPorHora <= 0) {
            return 'El precio por hora debe ser un numero mayor a 0';
        }

        if (!['activa', 'inactiva'].includes(payload.estado)) {
            return 'El estado seleccionado no es valido';
        }

        return null;
    };

    app.get('/canchas', checkUser, async (req, res) => {
        const canchas = await db.cancha.findAll({
            include: [
                {
                    model: db.tipoCancha,
                    as: 'tipoCancha',
                },
            ],
            order: [['nombre', 'ASC']],
        });

        res.render('canchas/index', {
            canchas,
            currentUser: req.session.user,
            success: req.query.success || null,
            error: req.query.error || null,
        });
    });

    app.get('/canchas/nueva', checkUser, isAdmin, async (req, res) => {
        const tiposCancha = await loadTiposCancha();

        res.render('canchas/form', {
            cancha: {
                nombre: '',
                tipo_id: '',
                precioPorHora: '',
                estado: 'activa',
            },
            tiposCancha,
            error: null,
            formAction: '/canchas',
            title: 'Nueva cancha',
            submitLabel: 'Crear cancha',
            currentUser: req.session.user,
        });
    });

    app.post('/canchas', checkUser, isAdmin, async (req, res) => {
        const canchaPayload = parseCanchaPayload(req.body);
        const tiposCancha = await loadTiposCancha();
        const validationError = await validateCanchaPayload(canchaPayload);

        if (validationError) {
            return res.render('canchas/form', {
                cancha: canchaPayload,
                tiposCancha,
                error: validationError,
                formAction: '/canchas',
                title: 'Nueva cancha',
                submitLabel: 'Crear cancha',
                currentUser: req.session.user,
            });
        }

        await db.cancha.create(canchaPayload);
        return res.redirect('/canchas?success=Cancha creada correctamente');
    });

    app.get('/canchas/:id/editar', checkUser, isAdmin, async (req, res) => {
        const cancha = await db.cancha.findByPk(req.params.id);
        if (!cancha) {
            return res.redirect('/canchas?error=La cancha solicitada no existe');
        }

        const tiposCancha = await loadTiposCancha();

        res.render('canchas/form', {
            cancha,
            tiposCancha,
            error: null,
            formAction: `/canchas/${cancha.id}`,
            title: 'Editar cancha',
            submitLabel: 'Guardar cambios',
            currentUser: req.session.user,
        });
    });

    app.post('/canchas/:id', checkUser, isAdmin, async (req, res) => {
        const cancha = await db.cancha.findByPk(req.params.id);
        if (!cancha) {
            return res.redirect('/canchas?error=La cancha solicitada no existe');
        }

        const canchaPayload = parseCanchaPayload(req.body);
        const tiposCancha = await loadTiposCancha();
        const validationError = await validateCanchaPayload(canchaPayload);

        if (validationError) {
            return res.render('canchas/form', {
                cancha: {
                    ...canchaPayload,
                    id: cancha.id,
                },
                tiposCancha,
                error: validationError,
                formAction: `/canchas/${cancha.id}`,
                title: 'Editar cancha',
                submitLabel: 'Guardar cambios',
                currentUser: req.session.user,
            });
        }

        await cancha.update(canchaPayload);
        return res.redirect('/canchas?success=Cancha actualizada correctamente');
    });

    app.post('/canchas/:id/eliminar', checkUser, isAdmin, async (req, res) => {
        const cancha = await db.cancha.findByPk(req.params.id);
        if (!cancha) {
            return res.redirect('/canchas?error=La cancha solicitada no existe');
        }

        await cancha.destroy();
        return res.redirect('/canchas?success=Cancha eliminada correctamente');
    });
};
