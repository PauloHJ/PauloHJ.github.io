const call = require('express').Router();
call.get('/', async (req, res) => {
    res.render('contenedor/index', {
        
    });
    // res.json(proyectos)
});
module.exports = call;