const r = require('express').Router();
const db = require('../models');

r.get('/', async (req, res) => {
  let posts = await db.query('SELECT id,titulo,fotourl,fecha from posts ORDER BY fecha DESC');
  posts = posts.rows;
  const session = req.session;

  res.render('blog/list', { posts, session });
});



r.get('/:id', async (req, res) => {
  let proyecto = await db.query('SELECT * FROM posts WHERE id=$1', [req.params.id]);
  if(proyecto.rowCount>0) {
    proyecto = proyecto.rows[0];
    //res.json(proyecto);
  
    res.render('blog/detalle', { proyecto, session: req.session });
  } else {
    res.render('404', { status:'err', err:'No se pudo encontrar el proyecto solicitado', session: req.session });
  }
});
module.exports = r;