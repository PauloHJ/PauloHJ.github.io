const db = require('../../models');
const r = require('express').Router();
const CONSTANTS = require('../../constants/rbac');
const multer = require('multer');
const inMemoryStorage = multer.memoryStorage();
uploadStrategy = multer({ storage: inMemoryStorage }).single('upload');
const azureStorage = require('azure-storage');
const blobService = azureStorage.createBlobService();
const getStream = require('into-stream');
const containerName = 'uploads';

const getBlobName = originalName => {
	const identifier = Math.random().toString().replace(/0\./, ''); // remove "0." from start of string
	return `${identifier}-${originalName}`;
};


//esto deberia listar los posts en una tabla
r.get('/', async (req,res) => {
    if(!req.session.userID){
			res.redirect("/login");
			return;
		}
		if(req.session.user.privileges.includes(CONSTANTS.CREATE_PROJECT)) {
		
		//En esta hacemos un query sencillo a las canalizaciones
		const cq = await db.query('SELECT id,titulo,fecha FROM posts ORDER BY fecha');

		//console.log(cq.rows);
		
    //Listar los datos obtenidos
    res.render('dashboard/blog/list',{
			layout: 'dashboard-base',
			user: req.session.user,
			posts: cq.rows
				})
			}else{
				  res.redirect('/dashboard');
				  return;
				  }
})


//Esto es un formulario para crear un nuevo post
r.get('/nuevo', (req,res) => {
	if(!req.session.userID){
		res.redirect("/login");
		return;
	}
	if(req.session.user.privileges.includes(CONSTANTS.CREATE_PROJECT)) {
	res.render('dashboard/blog/create',{
		layout: 'dashboard-base',
		user: req.session.user
	})
}else{
	  res.redirect('/dashboard');
	  return;
	  }
})

const handleError = (err, res) => {
	res.status(500);
	res.render('error', { error: err });
};

function savePostInDB(title,content,img,req,res){
	const query = 'INSERT INTO posts(titulo,cuerpo,fotourl,autor) VALUES ($1,$2,$3,$4)';
	const values = [title,content,"https://caritasqro.blob.core.windows.net/uploads/"+img,req.session.userID];

	db.query(query,values, (err, resp) => {
		if(err){
			console.log(err.stack);
		  //Este error viene de la BD, por lo que solo puede ser por la
		  //violación de la llave única. 
		  res.render('generic-message',{
			  layout: 'dashboard-base',
				user: req.session.user,
				session: req.session,
			  title: 'Error al ingresar los datos',
			  conent: 'Ocurrio un error al insertar la imagen'
		  });
		}else{
			res.render('generic-message',{
				layout: 'dashboard-base',
				user: req.session.user,
				session: req.session,
				title: 'Exito',
				content: 'Post creado correctamente'
			})
		}
	})
}

//esto es el endpoint del form
r.post('/nuevo',uploadStrategy,(req,res) => {
	
	if(!req.session.userID){
		    res.redirect("/login");
		    return;
		  }
		  if(req.session.user.privileges.includes(CONSTANTS.CREATE_PROJECT)) {
		
		
	//res.json(req.body)
	const title = req.body.titulo;
	const content = req.body.contenido;

	//azure stuff
	const
          blobName = getBlobName(req.file.originalname)
        , stream = getStream(req.file.buffer)
        , streamLength = req.file.buffer.length
		;
		
		blobService.createBlockBlobFromStream(containerName, blobName, stream, streamLength, err => {

			if(err) {
					handleError(err);
					return;
			}

			//we did it. Now store the rest of the data in the DB
			savePostInDB(title,content,blobName,req,res);
	});
}else{
	  res.redirect('/dashboard');
	  return;
	  }
})

//-----------------Editar POST-----------------------
r.get("/editar/:id",async (req,res) => {
	if(!req.session.userID){
		    res.redirect("/login");
		    return;
		  }
		  if(req.session.user.privileges.includes(CONSTANTS.CREATE_PROJECT)) {
		
		
	let post = await db.query('SELECT * FROM posts WHERE id=$1', [req.params.id]);
  if(post.rowCount>0) {
    post = post.rows[0];
    //res.json(proyecto);
  
    res.render('dashboard/blog/edit', { layout: 'dashboard-base',post, session: req.session });
  } else {
    res.render('404', { status:'err', err:'No se pudo encontrar el proyecto solicitado', session: req.session });
	}
}else{
	  res.redirect('/dashboard');
	  return;
	  }
})

function updateWithoutImg(title,content,req,res,id){
	//const query = 'INSERT INTO posts(titulo,cuerpo,fotourl,autor) VALUES ($1,$2,$3,$4)';
	const query = 'UPDATE posts SET titulo=$1,cuerpo=$2 WHERE id=$3';
	const values = [title,content,id];

	db.query(query,values, (err, resp) => {
		if(err){
			console.log(err.stack);
		  //Este error viene de la BD, por lo que solo puede ser por la
		  //violación de la llave única. 
		  res.render('dashboard/errors/generic',{
			  layout: 'dashboard-base',
			  user: req.session.user,
			  title: 'Error al ingresar los datos',
			  text: 'Ocurrio un error al insertar la imagen'
		  });
		}else{
			res.render('generic-message',{
				layout: 'dashboard-base',
				user: req.session.user,
				session: req.session,
				title: "Exito",
				content: "Post creado correctamente"
			})
		}
	})
}

function updateWithImg(title,content,req,res,id,img){
	//const query = 'INSERT INTO posts(titulo,cuerpo,fotourl,autor) VALUES ($1,$2,$3,$4)';
	const query = 'UPDATE posts SET titulo=$1,cuerpo=$2,fotourl=$3 WHERE id=$4';
	const values = [title,content,img,id];

	db.query(query,values, (err, resp) => {
		if(err){
			console.log(err.stack);
		  //Este error viene de la BD, por lo que solo puede ser por la
		  //violación de la llave única. 
		  res.render('dashboard/errors/generic',{
			  layout: 'dashboard-base',
			  user: req.session.user,
			  title: 'Error al ingresar los datos',
			  text: 'Ocurrio un error al insertar la imagen'
		  });
		}else{
			res.render('generic-message',{
				layout: 'dashboard-base',
				user: req.session.user,
				session: req.session,
				title: "Exito",
				content: "post actualizado"
			})
		}
	})
}

r.post('/editar/:id',uploadStrategy,(req,res) => {
	if(!req.session.userID){
		    res.redirect("/login");
		    return;
		  }
		  if(req.session.user.privileges.includes(CONSTANTS.CREATE_PROJECT)) {
		
		

	//res.json(req.body)
	const title = req.body.titulo;
	const content = req.body.contenido;
	if(req.file){
		//do azure stuff here
		//azure stuff
		const
		blobName = getBlobName(req.file.originalname)
	, stream = getStream(req.file.buffer)
	, streamLength = req.file.buffer.length
	;

	blobService.createBlockBlobFromStream(containerName, blobName, stream, streamLength, err => {

		if(err) {
			handleError(err);
			return;
		}

		//we did it. Now store the rest of the data in the DB
		//savePostInDB(title,content,blobName,req,res);
		updateWithImg(title,content,req,res,req.params.id,"https://caritasqro.blob.core.windows.net/uploads/"+blobName);
	});
	}else {
		//Execute a simple update
		updateWithoutImg(title,content,req,res,req.params.id);
	}
}else{
	  res.redirect('/dashboard');
	  return;
	  }
})

module.exports = r;