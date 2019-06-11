const router = require('express').Router();
const db = require('../../models');
const to = require('../../util/to');
const uuidv4 = require('uuid/v4');
const paypal = require('paypal-rest-sdk');



const cats = ["Niños","Mujeres","Becas","Salud","Educacion",
"Jovenes","Adultos","Rural","Urbano","Otros"]
 

router.get('/', async (req, res) => {
  let [proyectos, sub_programas] = await Promise.all([
    db.query('SELECT * from proyecto'), 
    db.query('SELECT * FROM subprograma')
  ]);

  categorias = [
    {id:0, nombre:'Niños'},
    {id:1, nombre:'Mujeres'},
    {id:2, nombre:'Becas'},
    {id:3, nombre:'Salud'},
    {id:4, nombre:'Educacion'},
    {id:5, nombre:'Jovenes'},
    {id:6, nombre:'Adultos Mayores'},
    {id:7, nombre:'Rural'},
    {id:8, nombre:'Urbano'},
    {id:9, nombre:'Otros'},
  ]

  proyectos = proyectos.rows;
  sub_programas = sub_programas.rows;
  const session = req.session;

  res.render('proyectos/index', { proyectos, session, sub_programas, categorias });
  // res.json(proyectos)
});

router.post('/', async (req, res) => {
  let query = 'SELECT * FROM proyecto ', proyectos;
  let byPrograma = undefined, byName = undefined, byCategoria;
  let postman = false;

  if(postman){
    byPrograma = req.query.byPrograma;
    byCategoria = req.query.byCategoria;
    byName = req.query.byName;
  } else {
    byCategoria = req.body.byCategoria;
    byPrograma = req.body.byPrograma;
    byName = req.body.byName;
  }

  console.log(byCategoria)

  if(byPrograma && byName && byCategoria) {
    console.log("primero");
    proyectos = await db.query(query + "WHERE subprograma_id=$1 AND (nombre LIKE $2 OR descripcion LIKE $2) AND (categorias LIKE $3)", [byPrograma, `%${byName}%`, `%${byCategoria}%`]);
  } else if(byPrograma && byName){
    console.log("segundo");
    proyectos = await db.query(query + "WHERE subprograma_id=$1  AND (nombre LIKE $2 OR descripcion LIKE $2)", [byPrograma, `%${byName}%`]);
  } else if(byName && byCategoria){
    console.log("ByName:", byName);
    proyectos = await db.query(query + "WHERE (nombre LIKE $1 OR descripcion LIKE $1) AND (categorias LIKE $2)", [`%${byName}%`, `%${byCategoria}%`]);
  } else if(byPrograma && byCategoria) {
    proyectos = await db.query(query + "WHERE subprograma_id=$1  AND categorias LIKE $2", [byPrograma, `%${byCategoria}%`])
  } else if(byName) {
    proyectos = await db.query(query + "WHERE (nombre LIKE $1 OR descripcion LIKE $1)", [`%${byName}%`] )
  } else if(byPrograma) {
    proyectos = await db.query(query + "WHERE subprograma_id=$1", [byPrograma])
  } else if(byCategoria) {
    proyectos = await db.query(query + "WHERE categorias LIKE $1", [`%${byCategoria}%`])
  } else {
    console.log("cuarto");
    proyectos = await db.query(query);
  }

  res.json({proyectos});
});

router.get('/:id', async (req, res) => {
  let proyecto = await db.query('SELECT * FROM proyecto WHERE id=$1', [req.params.id]);
  if(proyecto.rowCount>0) {
    proyecto = proyecto.rows[0];

    const catindex = proyecto.categorias.split(',');

    let catStrings = [];

    catindex.forEach(indexStr => {
      const i = parseInt(indexStr);
      catStrings.push(cats[i]);
    });
  
    let [ subPrograma, municipio, totalDonadores, totalDonaciones ] = await Promise.all([
      db.query('SELECT * FROM subprograma WHERE id=$1', [proyecto.subprograma_id]), 
      db.query('SELECT * FROM municipio WHERE id=$1', [proyecto.municipio_id]),
      db.query('SELECT COUNT(nombre) FROM donasporpersona'),
      db.query('SELECT SUM(monto) FROM dona WHERE proyecto_id=$1', [req.params.id])
    ]);
    proyecto.municipio = municipio.rows[0];
    // subPrograma = subPrograma.rows[0];
    let programa = await db.query('SELECT * FROM programa WHERE id=$1', [subPrograma.rows[0].programa_id]);
    proyecto.programa = programa.rows[0];
    proyecto.programa.subPrograma = subPrograma.rows[0];
    
    let paypal_string = process.env.paypal_string;
    totalDonadores = totalDonadores.rows[0].count;
    totalDonaciones = totalDonaciones.rows[0].sum;

    // console.log("Donadores: ", totalDonadores, "Donaciones: ", totalDonaciones)
    res.render(
      'proyectos/detalle', 
      { 
        status:'ok', 
        proyecto,
        categorias : catStrings,
        session: req.session,
        totalDonadores,
        totalDonaciones, 
        paypal_string });
  } else {
    res.render('404', { status:'err', err:'No se pudo encontrar el proyecto solicitado', session: req.session });
  }
});

router.post('/:id', async (req, res) => {
  let { monto, paymentId } = req.body;
  monto = parseFloat(monto);
  console.log("---paymentID:",paymentId);
  await paypal.capture.get(paymentId, async (payerr, payment) => {
    if(payerr) {
      res.json({ status: 'err', payerr });
      return;
    } else {
      console.log(JSON.stringify(payment))
      let [err, data] = await to(db.query('INSERT INTO dona(id, proyecto_id, donante_id, monto) VALUES($1, $2, $3, $4)', [uuidv4(), req.params.id, req.session.userID, monto]))
      if(err) {
        res.json({status: 'err', mensaje: err});
        return;
      }
      let newData = await db.query('SELECT sum(total_donado), count(nombre) FROM donasporpersona');
      res.json({status: 'ok', newDonadores: newData.rows[0].count, newDonaciones: newData.rows[0].sum});
      return;
    }
  });
});

module.exports = router;