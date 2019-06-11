const f = require('express').Router();
const db = require('../models');
const uuidv4 = require('uuid/v4');
const to = require('../util/to');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

//En go seria data, err := db.Query("SELECT ...")

const gmail = process.env.gmail;
const gmailPass = process.env.gmailpass;

const deleteQuery = 'DELETE FROM forget_pass WHERE token=$1'

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
           user: gmail,
           pass: gmailPass
       }
   });

f.get('/',(req,res) => {
    if(req.session.userID){
        res.redirect('/dashboard');
        return;
    }

    res.render('recuperar-contrasena/mail');
});

function sendToken(user,token){
    const mailOptions = {
        from: 'no-reply@caritasdequeretaro.org', // sender address
        to: user.email, // list of receivers
        subject: 'Recuperar contraseña Cáritas de Querétaro', // Subject line
        // plain text body
        html: 'Hola '+user.nombre+'<br>Tu código de recuperación de contraseña es:<br> <h2>'+token+'</h2>'
      };
    transporter.sendMail(mailOptions, function (err, info) {
        if(err)
          console.log(err)
        else
          console.log(info);
     });
}

function notifyChange(user){
    const mailOptions = {
        from: 'no-reply@caritasdequeretaro.org', // sender address
        to: user.email, // list of receivers
        subject: 'Cambio de contraseña para Cáritas de Querétaro', // Subject line
        // plain text body
        html: 'Hola '+user.nombre+'<br>Tu contraseña ha sido cambiada'
      };
    transporter.sendMail(mailOptions, function (err, info) {
        if(err)
          console.log(err)
        else
          console.log(info);
     });
}

f.post('/',async (req,res) => {
    const username = req.body.email;

    const q = await db.query('SELECT id,nombre,email,login FROM usuario WHERE login=$1 OR email=$1',[username]);
    console.log(q);

	if(!q || q.rowCount != 1){
		res.render('recuperar-contrasena/mail',{
			error: "El usuario introducido no existe"
		});
		return;
    }
    
    const user = q.rows[0];

    const token = uuidv4();

    db.query("INSERT into forget_pass (token, user_id) VALUES ($1,$2)",[token,user.id],(err,resq) => {
        if(err){
            console.log(err);
            res.end("error 500");
        }else{
            //no error, send via EMAIL
            sendToken(user,token);
            res.redirect('/forgot/token');
        }
    })

    
});

f.get('/token',(req,res) => {
    console.log(gmail);
    res.render('recuperar-contrasena/token')
});

f.post('/token',async (req,res) => {

    console.log(req.body);
    const token = req.body.token;

    //The expiration of the token is 8 hours
    const query = "SELECT user_id FROM forget_pass WHERE token=$1 AND created BETWEEN NOW() - INTERVAL '12 HOURS' AND NOW()";

    const q = (await to(db.query(query,[token])))[1]; //Por que Topi, por que ...

    console.log(q);

    if(!q || q.rowCount != 1){
		res.render('recuperar-contrasena/token',{
			error: "El código de recuperación no existe o ya ha expirado"
		});
		return;
    }

    //it exists.
    const pass1 = req.body.pass1;
    const pass2 = req.body.pass2;

    const id = q.rows[0].user_id;

    if(pass1 != pass2){
        res.render('recuperar-contrasena/token',{
			error: "Las contraseñas no coinciden"
		});
		return;
    }

    const salt = bcrypt.genSaltSync(8);
    console.log(pass1);
    const newHash = bcrypt.hashSync(pass1, salt);
    
    db.query("UPDATE usuario SET passhash='"+newHash+"' WHERE id="+id,(err,resq) => {
        if(err){
            console.log(err);
            res.end("error 500");
        }else{

            db.query(deleteQuery,[token],(err2,resq2) => {
                if(err2){
                    console.log(err2);
                } else {
                    console.log('Removed recovery token '+token);
                    console.log(resq2);
                }
            })

            res.render('generic-message',{
                title: 'Contraseña cambiada',
                content: 'Se ha cambiado la contraseña',
                session: req.session
            });
        }
    })
})

module.exports = f;