const call = require('express').Router();
call.get('/', async (req, res) => {


    res.render('contacto/index', {

    });
    
});
module.exports = call;