const benef = require('express').Router();
const CONSTANTS = require('../../constants/rbac');
benef.get('/', async (req, res) => {
    if(!req.session.userID){
            res.redirect("/login");
            return;
          }
    if(req.session.user.privileges.includes(CONSTANTS.CREATE_PROJECT)) {


    res.render('beneficiario/index', {

    });
}else{
      res.redirect('/dashboard');
      return;
      }
});
module.exports = benef;