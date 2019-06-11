const db = require('../../models');
const can = require('express').Router();
const CONSTANTS = require('../../constants/rbac');
function validatePhone(phone){
	const l = phone.legth;
	for(var i = 0; i < l; i++){
		if(!(phone[i] in "0123456789 ()-+")){
			return false;
		}
	}

	return true;
}

can.get('/', async (req,res) => {
    if(!req.session.userID){
			res.redirect("/login");
			return;
		}
		 if(req.session.user.privileges.includes(CONSTANTS.CREATE_PROJECT)) {
		
		//En esta hacemos un query sencillo a las canalizaciones
		const cq = await db.query('SELECT * FROM canalizacion ORDER BY contacto');

		console.log(cq.rows);
		
    //Listar los datos obtenidos
    res.render('dashboard/canalizaciones/list',{
			layout: 'dashboard-base',
			user: req.session.user,
			canalizaciones: cq.rows
		})
	}else{
		  res.redirect('/dashboard');
		  return;
		  }
})


can.get('/nueva', async (req,res) => {
	if(!req.session.userID){
		res.redirect("/login");
		return;
	}
	 if(req.session.user.privileges.includes(CONSTANTS.CREATE_PROJECT)) {
	
	//console.log(phoneRegEx.test('(999) 998 5754'));
	
	res.render('dashboard/canalizaciones/create',{
		layout: 'dashboard-base',
		user: req.session.user
	})
}else{
	  res.redirect('/dashboard');
	  return;
	  }
})

can.post('/nueva', (req,res) => {

	if(!req.session.userID){
		    res.redirect("/login");
		    return;
		  }
		  if(req.session.user.privileges.includes(CONSTANTS.CREATE_PROJECT)) {
	const con = req.body.contacto;
	const tel = req.body.telefono;
	const dir = req.body.direccion;
	const car=	req.body.carta;
	const query = 'INSERT INTO canalizacion(id,contacto,telefono,direccion,carta) VALUES (DEFAULT,$1,$2,$3,$4)';

	const values = [con,tel,dir,car];

	db.query(query,values, (err, resp) => {
		if(err){
			console.log(err.stack);
		  //Este error viene de la BD, por lo que solo puede ser por la
		  //violación de la llave única. 
		  res.render('dashboard/errors/generic',{
			  layout: 'dashboard-base',
			  user: req.session.user,
			  title: 'Error al ingresar los datos',
			  text: 'Ocurrio un error al insertar la canalizacion'
		  });
		}else{
			res.render('dashboard/canalizaciones/success',{
				layout: 'dashboard-base',
				user: req.session.user,
				})
		}
	})
		}else{
			  res.redirect('/dashboard');
			  return;
			  }
	
})


can.get('/modificar/:id', async (req, res) => {
	if(!req.session.userID){
		    res.redirect("/login");
		    return;
		  }
	if(req.session.user.privileges.includes(CONSTANTS.CREATE_PROJECT)) {
  let canalizacion = await db.query('SELECT * FROM canalizacion WHERE id=$1', [req.params.id]);
			canalizacion=canalizacion.rows[0];
		res.render('dashboard/canalizaciones/modificar', { ...canalizacion, session: req.session 
			,layout: 'dashboard-base',
			user: req.session.user});
		//res.json({canalizacion})
	}else{
		  res.redirect('/dashboard');
		  return;
		  }
		
});

can.post('/modificar/:id', (req,res) => {
	if(!req.session.userID){
		    res.redirect("/login");
		    return;
		  }
	if(req.session.user.privileges.includes(CONSTANTS.CREATE_PROJECT)) {
	const con = req.body.contacto;
	const tel = req.body.telefono;
	const dir = req.body.direccion;
	const car=req.body.carta;

	const params = [con,tel,dir,car,req.params.id];

	const query = 'UPDATE canalizacion SET contacto=$1,telefono=$2,direccion=$3,carta=$4 WHERE id=$5';


	db.query(query,params, (err, resp) => {
		if(err){
			console.log(err.stack);
		  //Este error viene de la BD, por lo que solo puede ser por la
		  //violación de la llave única. 
		  res.render('dashboard/errors/generic',{
			  layout: 'dashboard-base',
			  user: req.session.user,
			  title: 'Error al ingresar los datos',
			  text: 'Ocurrio un error al insertar la canalizacion'
		  });
		}else{
			res.render('dashboard/canalizaciones/modificado',{
				layout: 'dashboard-base',
				user: req.session.user,
				})
		}
	})
}else{
	  res.redirect('/dashboard');
	  return;
	  }
})

module.exports = can;