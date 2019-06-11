const db = require('../../models');

const benef = require('express').Router();
const CONSTANTS = require('../../constants/rbac');
benef.get('/', async (req, res) => {
	if(!req.session.userID){
		res.redirect("/login");
		return;
    }
     if(req.session.user.privileges.includes(CONSTANTS.CREATE_PROJECT)) {
		
    //Ask the beneficiaries to the db
    const bq = await db.query('SELECT nombre,apellido,curp,sexo,nacimiento,id FROM beneficiario');

    //res.json(bq.rows);
	
	res.render('dashboard/beneficiarios/list',{
		layout: 'dashboard-base',
        user: req.session.user,
        benef: bq.rows
	});
}else{
	  res.redirect('/dashboard');
	  return;
	  }
});
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
	
benef.get('/nuevo', async (req, res) => {
	if(!req.session.userID){
		res.redirect("/login");
		return;
	}
	if(req.session.user.privileges.includes(CONSTANTS.CREATE_PROJECT)) {
	
	const pq = await db.query('SELECT * FROM canalizacion ', );
	const bq = await db.query('SELECT * FROM proyecto ', );

	res.render('dashboard/beneficiarios/create',{
		layout: 'dashboard-base',bene:pq.rows, proj:bq.rows
	});
}else{
	  res.redirect('/dashboard');
	  return;
	  }
});

benef.post('/nuevo', async (req, res) => {
	if(!req.session.userID){
		res.redirect("/login");
		return;
	}

	if(req.session.user.privileges.includes(CONSTANTS.CREATE_PROJECT)) {
		let { calle, numero, cp, colonia, profesion, name, lastname, curp, sexo, nacimiento, city, canalizacion, rfc, estadoCivil, zona, checkIndigena, checkExtrangero } = req.body;
	
	
		checkIndigena = !!checkIndigena;
		checkExtrangero = !!checkExtrangero;

		const params = [name,lastname,curp,sexo,nacimiento,city,canalizacion,rfc,estadoCivil,zona,checkExtrangero,checkIndigena,profesion,calle,numero,cp,colonia];
		// console.table(params);
		// res.json({params});

		// console.log(req.body.proyectos);
		
		// console.log(...params);
		const query = 'INSERT INTO beneficiario(id,nombre,apellido,curp,sexo,nacimiento,municipio_id,canalizacion_id,rfc,estadocivil,zonageografica,extranjero,indigente,profesion,calle,numero,cp,colonia) VALUES (DEFAULT,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)';

		db.query(query,params, async (err, resp) => {
			if(err) {
				console.log(err.stack);
				//Este error viene de la BD, por lo que solo puede ser por la
				//violación de la llave única. 
				res.render('dashboard/errors/generic',{
					layout: 'dashboard-base',
					user: req.session.user,
					title: 'Error al ingresar los datos',
					text: 'Ocurrio un error al insertar los datos'
				});
			} else {
				console.log(resp);

				let idBenef = await db.query('SELECT id FROM beneficiario WHERE curp=$1', [curp]);
				idBenef = idBenef.rows[0].id;
				console.log("IDBenef:",idBenef);
				req.body.proyectos.forEach(id => {
					db.query('INSERT INTO proyecto_beneficiario(proyecto_id, beneficiario_id) VALUES($1, $2)', [parseInt(id), parseInt(idBenef)]);
					// console.log(id);
				});

				res.render('dashboard/beneficiarios/modificado',{
					layout: 'dashboard-base',
					user: req.session.user,
				});
			}
		})
	}else{
	  res.redirect('/dashboard');
	  return;
  }
});


benef.get('/modificar/:id', async (req, res) => {
	if(!req.session.userID){
		res.redirect("/login");
		return;
	}
	const bq = await db.query('SELECT * FROM proyecto ', );
	if(req.session.user.privileges.includes(CONSTANTS.CREATE_PROJECT)) {
  let beneficiario = await db.query('SELECT * FROM beneficiario WHERE id=$1', [req.params.id]);
			beneficiario=beneficiario.rows[0];
			const pq = await db.query('SELECT * FROM canalizacion ', );
		res.render('dashboard/beneficiarios/modificar', { ...beneficiario, session: req.session 
			,layout: 'dashboard-base',
			proj: bq.rows,
			user: req.session.user,bene:pq.rows});
		//res.json({canalizacion})
	}else{
		  res.redirect('/dashboard');
		  return;
		  }
});

benef.get('/:id', async (req, res) => {
	if(!req.session.userID){
		    res.redirect("/login");
		    return;
		  }
		  if(req.session.user.privileges.includes(CONSTANTS.CREATE_PROJECT)) {
		
		
  let beneficiario = await db.query('SELECT * FROM beneficiario WHERE id=$1', [req.params.id]);
	beneficiario = beneficiario.rows[0];

	const query = 'SELECT proyecto.nombre,proyecto_id as pnombre FROM proyecto_beneficiario, proyecto WHERE proyecto_id = proyecto.id AND beneficiario_id = $1';
	
	const q = await db.query(query,[req.params.id]);

	if(q){
		beneficiario.projects = q.rows;
	}

  console.log(beneficiario)
  res.render('dashboard/beneficiarios/detail', { beneficiario, session: req.session,layout:"dashboard-base",user: req.session.user });
	}else{
	  res.redirect('/dashboard');
  	return;
  }
});


function reasoc(benef_id,projects){
	//delete all records of this benef
	const query = "DELETE FROM proyecto_beneficiario WHERE beneficiario_id=$1";

	db.query(query,[benef_id], (err, resp) => {
		if(err){
			console.log(err);
			return;
		}

		//now do a for each and add all the data

		//error for typeof
		console.log(projects);
		
		//if(projects && projects.forEach) 
		
		if(projects && projects.forEach){
			projects.forEach(id => {
				console.log("INSERTING"+id)
				db.query('INSERT INTO proyecto_beneficiario(proyecto_id, beneficiario_id) VALUES($1, $2)', [id, benef_id],(err2,res2) => {
					if(err){
						console.log(err);
					}else{
						
					}
				});
			});
		} else if(projects) {
			db.query('INSERT INTO proyecto_beneficiario(proyecto_id, beneficiario_id) VALUES($1, $2)', [projects, benef_id],(err2,res2) => {
				if(err){
					console.log(err);
				}else{
					
				}
			});
		}
	})
}

const projectIdsQuery = 'SELECT proyecto_id FROM proyecto_beneficiario WHERE beneficiario_id=$1';

//--Edit
benef.get('/json/:id',async (req,res) => {

	//get the active projects
	const pids = await db.query(projectIdsQuery,[req.params.id]);

	if(!req.session.userID){
    res.redirect("/login");
    return;
  }
  if(req.session.user.privileges.includes(CONSTANTS.CREATE_PROJECT)) {
		
	let beneficiario = await db.query('SELECT * FROM beneficiario WHERE id=$1', [req.params.id]);
  if(beneficiario.rowCount>0) {
		beneficiario = beneficiario.rows[0];
		
		beneficiario.projects = pids.rows;
  
    let [ municipio ] = await Promise.all([
       
      db.query('SELECT * FROM municipio WHERE id=$1', [beneficiario.municipio_id]),
      
    ]);
    beneficiario.municipio = municipio.rows[0];
    
    // console.log("Donadores: ", totalDonadores, "Donaciones: ", totalDonaciones)
    res.json(beneficiario);
  } else {
    res.render('404', { status:'err', err:'No se pudo encontrar el beneficiario solicitado', session: req.session });
	}
}else{
	  res.redirect('/dashboard');
	  return;
	  }
})

benef.post('/modificar/:id', (req,res) => {

	console.log(req.body.proyectos);

	if(!req.session.userID){
    res.redirect("/login");
    return;
  }
  if(req.session.user.privileges.includes(CONSTANTS.CREATE_PROJECT)) {
		
		let { calle, numero, cp, colonia, profesion, name, lastname, curp, sexo, nacimiento, city, canalizacion, rfc, estadoCivil, zona, checkIndigena, checkExtrangero } = req.body;
	
	
		checkIndigena = !!checkIndigena;
		checkExtrangero = !!checkExtrangero;

		const params = [name,lastname,curp,sexo,nacimiento,city,canalizacion,rfc,estadoCivil,zona,checkExtrangero,checkIndigena,profesion,calle,numero,cp,colonia,req.params.id];
			

		console.log(...params);
		const query = 'UPDATE beneficiario SET nombre=$1,apellido=$2,curp=$3,sexo=$4,nacimiento=$5,municipio_id=$6,canalizacion_id=$7,rfc=$8,estadocivil=$9,zonageografica=$10,extranjero=$11,indigente=$12,profesion=$13,calle=$14,numero=$15,cp=$16,colonia=$17 WHERE id=$18';

		//Reassociate projects with beneficiaries
		reasoc(req.params.id,req.body.proyectos);


		db.query(query,params, (err, resp) => {
			if(err){
				console.log(err.stack);
				//Este error viene de la BD, por lo que solo puede ser por la
				//violación de la llave única. 
				res.render('dashboard/errors/generic',{
					layout: 'dashboard-base',
					user: req.session.user,
					title: 'Error al ingresar los datos',
					text: 'Ocurrio un error al insertar los datos'
				});
			}else{
				res.render('dashboard/beneficiarios/modificado',{
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

module.exports = benef;