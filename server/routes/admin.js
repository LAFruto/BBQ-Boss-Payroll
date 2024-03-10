const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

//create, find, update, delete
router.get('/', adminController.view);
router.post('/', adminController.find);

router.get('/:id', adminController.delete);

router.get('/adduser', adminController.form);
router.post('/adduser', adminController.create);

router.get('/edituser/:id', adminController.edit);
router.post('/edituser/:id', adminController.update);

router.get('/viewuser/:id', adminController.viewall);

module.exports = router;

