const call = require('express').Router();
call.get('/', async (req, res) => {


    res.render('ayuda/index', {

    });
    
});
module.exports = call;