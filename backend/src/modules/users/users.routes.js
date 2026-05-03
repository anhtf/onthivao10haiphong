const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const { requireAdmin } = require('../../middleware/roleGuard');
const usersController = require('./users.controller');

// GET /api/users — Admin: list all students
router.get('/', authenticate, requireAdmin, usersController.listStudents);

// GET /api/users/:id — Admin: get user detail
router.get('/:id', authenticate, requireAdmin, usersController.getUser);

// DELETE /api/users/:id — Admin: delete student
router.delete('/:id', authenticate, requireAdmin, usersController.deleteUser);

module.exports = router;
