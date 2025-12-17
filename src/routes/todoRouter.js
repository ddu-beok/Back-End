const express = require('express');
const todoController = require('../controllers/todoController');

const router = express.Router();

router.post('/:dduBeokId', todoController.createTodo);
// router.get('/:dduBeokId', todoController.getTodo);

module.exports = router;