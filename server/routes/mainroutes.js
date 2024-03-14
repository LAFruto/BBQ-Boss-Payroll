const express = require('express');
const router = express.Router();
const loginController = require('../controllers/loginController');
const dashboardController = require('../controllers/dashboardController');
const employeeController = require('../controllers/employeeController');
const payrollController = require('../controllers/payrollController');
const timekeepingController = require('../controllers/timekeepingController');
const leavesController = require('../controllers/leavesController');
const settingsController = require('../controllers/settingsController');

// LOGIN ROUTES
router.get('/', loginController.view);
router.post('/', loginController.authenticate);

// DASHBOARD ROUTES
router.get('/dashboard', dashboardController.view)
// router.post('', dashboardController.branch)
// router.post('', dashboardController.period)

// EMPLOYEES ROUTES
router.get('/employee', employeeController.view)
router.get('/employee/add-employee', employeeController.form)
router.post('/employee', employeeController.find)

// router.post('/employee/:id', employeeController.profile)

// router.post('/employee/addemployee', employeeController.create)

// PAYROLL ROUTES
router.get('/payroll', payrollController.view)
router.get('/payroll/convert-mbos', payrollController.form)

// TIMEKEEPING ROUTES
router.get('/timekeeping', timekeepingController.view)
router.post('/timekeeping', timekeepingController.date)
router.post('/timekeeping/:id/delete', timekeepingController.delete)
router.post('/timekeeping/:id/approve', timekeepingController.approve)

router.get('/timekeeping/add-timesheet', timekeepingController.form)

router.get('/timekeeping/add-record', timekeepingController.record_form)
router.post('/timekeeping/add-record', timekeepingController.record_create)

router.get('/timekeeping/edit-record/:id', timekeepingController.record_edit)
router.post('/timekeeping/:id/edit-record/', timekeepingController.record_update)

// LEAVES ROUTES
router.get('/leaves', leavesController.view)

// SETTINGS ROUTES
router.get('/settings', settingsController.view)


module.exports = router;