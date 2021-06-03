const connection = require("./db-config");
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const Joi = require("joi");

connection.connect((err) => {
  if (err) {
    console.error('error connecting: ' + err.stack);
  } else {
    console.log('connected to database with threadId :  ' + connection.threadId);
  }
});

app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.get("/force_users", (req, res) => {
  let sql = 'SELECT * FROM force_users';
  const sqlValues = [];
  if (req.query.force_side) {
    sql += ' WHERE force_side = ?';
    sqlValues.push(req.query.force_side);
  }
  if (req.query.saber_color) {
    req.query.force_side ? sql += ' AND lightsaber_color = ? ;' : sql += ' WHERE lightsaber_color = ?';
    sqlValues.push(req.query.max_duration);
  }
  connection.query(sql, sqlValues, (err, result) => {
    if (err) {
      res.status(500).send('Error retrieving data from database');
    } else {
      res.status(200).json(result);
    }
  });
});

app.get("/force_users/:id", (req, res) => {
  const forceUserId = req.params.id;
  connection.query(
    'SELECT * FROM users WHERE id = ?',
    [forceUserId],
    (err, result) => {
    if (err) {
      res.status(500).send('Error retrieving user from the database');
    } else {
      result.length ? res.status(200).json(result[0]) : res.status(404).send('Force User not found !');
    }
  });
});

app.post("/force_users", (req, res) => {
  const { name, force_side, lightsaber_color } = req.body;
  const { error: validationErrors } = Joi.object({
    name: Joi.string().max(255).required(),
    force_side: Joi.string().max(50).required(),
    lightsaber_color: Joi.string().max(50).required(),
  }).validate({ name, force_side, lightsaber_color }, { abortEarly: false });
  if (validationErrors) {
    res.status(422).json({ errors: validationErrors.details });
  } else {
    connection.promise()
      .query('INSERT INTO force_users (name, force_side, lightsaber_color) VALUES (?, ?, ?)', [name, force_side, lightsaber_color])
      .then(([result]) => {
        const createdForceUser = { id: result.insertId, name, force_side, lightsaber_color };
        res.json(createdForceUser);
      }).catch((err) => { console.error(err); res.sendStatus(500); });
  }
}); 

app.patch('/force_users/:id', (req, res) => {
  const { error: validationErrors } = Joi.object({
    name: Joi.string().max(255),
    force_side: Joi.string().max(50),
    lightsaber_color: Joi.string().max(50),
  }).validate(req.body, { abortEarly: false });
  if (validationErrors)
    return res.status(422).json({ errors: validationErrors.details });
  connection.promise()
    .query('UPDATE force_users SET ? WHERE id = ?', [req.body, req.params.id])
    .then(([result]) => {
      res.sendStatus(200).send('Force user updated');
    })
    .catch((err) => {
      console.error(err);
      res.sendStatus(500).send('Error updating the user');
    });
});

app.delete('/force_users/:id', (req, res) => {
  const forceUserId = req.params.id
  connection.promise()
    .query('DELETE FROM force_users WHERE id = ?', [forceUserId])
    .then(([result]) => {
      if (result.affectedRows) res.sendStatus(204);
      else res.sendStatus(404);
    })
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});