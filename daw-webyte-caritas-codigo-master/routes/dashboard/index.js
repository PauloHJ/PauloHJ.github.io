const dash = require('express').Router();

const projRouter = require('./projects');
const benefRouter = require('./benef');
const canRouter = require('./canalizaciones.js');
const blogAdminRouter = require('./blogadmin');
const db = require('../../models');
const bcrypt = require('bcryptjs');

const CONSTANTS = require('../../constants/rbac');

//append sub router
dash.use('/proyectos',projRouter);
dash.use('/beneficiarios',benefRouter);
dash.use('/canalizaciones',canRouter);
dash.use('/blog',blogAdminRouter);


dash.get('/', async (req, res) => {
	if(!req.session.userID){
		res.redirect("/login");
		return;
	}
	const user = req.session.user;
	console.log(user);
	if(user.privileges.some(r => [CONSTANTS.CREATE_BOX, CONSTANTS.CREATE_PROJECT, CONSTANTS.CREATE_USER].indexOf(r) >= 0))
		res.render('dashboard/landing',{
			layout: 'dashboard-base',
			user: user,
			createStaff: user.privileges.includes(CONSTANTS.CREATE_USER)
		})
	else {
		let donativos = await db.query('SELECT * FROM donativos_bonito WHERE donante_id='+req.session.userID);
		donativos = donativos.rows;
		// res.json({ proyectos })
		res.render('dashboard/landing',{
			session: req.session,
			user: user,
			container: true,
			proyectos: donativos
		})
	}
});

dash.get('/nuevoStaff', (req, res) => {
	if(!req.session.userID){
		res.redirect("/login");
		return;
	}
	if(req.session.user.privileges.includes(CONSTANTS.CREATE_USER)) {
		res.render('dashboard/newStaff', {session: req.session});
		return;
	}
	res.redirect('/dashboard');
	return;
});

dash.post('/nuevoStaff', async (req, res) => {
	if(req.session.user.privileges.includes(CONSTANTS.CREATE_USER)) {
		const { username, name, lastname, email, password, password2 } = req.body;

		// Revisamos que el usuario haya ingresado todos sus datos
		if(username && name && lastname && email && password && password2) {
			// Revisamos que las contraseñas coincidan
			if(password === password2) {
				// Buscamos si el nombre de usuario o correo ya está registrado
				const posibleUser = await db.query('SELECT * FROM usuario WHERE login=$1 OR email=$2', [username, email]);
				// Si no está registrado, continuamos 👍
				if(posibleUser.rowCount === 0) {
					const salt = bcrypt.genSaltSync(8);
					const passHash = bcrypt.hashSync(password, salt);
					
					// Creamos el Usuario
					await db.query('INSERT INTO usuario (login, passHash, nombre, apellido, email) VALUES ($1, $2, $3, $4, $5)', [username, passHash, name, lastname, email]);
					// const result2 = await db.query('INSERT INTO usuario_privilegio (login, priv) VALUES ($1, $2)', [username, 'realizarDonativo']);
					const id = await db.query('SELECT id FROM usuario WHERE login=$1', [username])
					db.query('INSERT INTO usuario_rol (id_usuario, id_rol, activo) VALUES ($1, $2, $3)', [id.rows[0].id, 2, true]);

					res.json({ status: 'ok' });
					return;

				} else {
					res.json({ status: 'err', err: '¡Ups! El nombre de usuario o correo que ingresaste ya está registrado.', posibleUser });
					return;
				}
			} else {
				res.json({ status: 'err', err: '¡Ups! Por favor, revisa tu contraseña.' });
				return;
			}
		} else {
			res.json({ status: 'err', err: '¡Ups! Por favor, ingresa todos los datos.' });
			return;
		}
	}
	res.redirect('/dashboard');
	return;
});

dash.get('/modificarInformacion', async (req, res) => {
	if(!req.session.userID){
		res.redirect("/login");
		return;
	}
		
	
	let user = await db.query('SELECT login, nombre, apellido, email FROM usuario WHERE id=$1', [req.session.userID]);
	user = user.rows[0];
	console.log(user);
	res.render('dashboard/modificarInformacion',{
		session: req.session,
		userID: req.session.userID,
		user
	});
	
});

dash.post('/modificarInformacion', async (req, res) => {
	if(req.session.userID == req.body.userID) {
		const { name, lastname, email } = req.body;

		// Revisamos que el usuario haya ingresado todos sus datos
		if(name && lastname && email) {
			try {
				await db.query('UPDATE usuario SET nombre=$1, apellido=$2, email=$3 WHERE id=$4', [name, lastname, email, req.session.userID])
				req.session.user.name = name;
				req.session.user.lastName = lastname;
				req.session.user.fullName = name + ' ' + lastname;
				res.json({status: 'ok'});
			} catch(e) { 
				res.json({ status: 'err', err: '¡Ups! Ocurrió un error, revisa los datos.' }); 
			}
			return;
		} else {
			res.json({ status: 'err', err: '¡Ups! Por favor, ingresa todos los datos.' });
			return;
		}
	}
	res.json({status: 'err', err: '¡Ups! Parece que quieres hacer trampa.'});
	return;
});

dash.get("/cambiarcontrasena", (req,res) => {
	if(!req.session.userID){
		res.redirect("/login");
		return;
	}
	
	res.render('dashboard/cambiar-pass',{
		session: req.session,
	});
})

dash.post('/cambiarcontrasena', async (req,res) => {
	const data = req.body;

	const passQ = await db.query("SELECT passhash FROM usuario WHERE id="+req.session.userID);

	if(passQ.rowCount <= 0){
		res.end('Error 500');
	}

	const hash = passQ.rows[0].passhash;

	console.log(hash);
	console.log(data);

	if(bcrypt.compareSync(data.currentPass,hash)){
		//la contraseña es correcta
		//checar confirmacion
		if(data.newpass1 == data.newpass2){
			//yei
			const salt = bcrypt.genSaltSync(8);
			const passHash = bcrypt.hashSync(data.newpass1, salt);

			db.query("UPDATE usuario SET passhash='"+passHash+"' WHERE id="+req.session.userID,(err,resq) => {
				if(err){
					console.log(err);
					res.end("error 500");
				}else{
					res.render('generic-message',{
						user: req.session.user,
						session: req.session,
						title: 'Exito',
						content: 'Se ha cambiado la contraseña de forma exitosa.'
					})
				}
			})
		} else {
			res.end('Las contraseñas no coinciden')
		} 
	}else{
		//incorrecta
		res.end('incorrecta');
	}


})

module.exports = dash;