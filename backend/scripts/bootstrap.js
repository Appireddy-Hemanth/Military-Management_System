const fs = require('fs');
const path = require('path');

const controllers = [
    'notificationController.js',
    'approvalController.js',
    'maintenanceController.js',
    'analyticsController.js',
    'searchController.js',
    'reportController.js',
    'twoFactorController.js',
    'messageController.js',
    'anomalyController.js'
];

const routes = [
    'notificationRoutes.js',
    'approvalRoutes.js',
    'maintenanceRoutes.js',
    'analyticsRoutes.js',
    'searchRoutes.js',
    'reportRoutes.js',
    'twoFactorRoutes.js',
    'messageRoutes.js',
    'anomalyRoutes.js'
];

const backendDir = 'c:\\Users\\User\\Downloads\\Military Asset Management System\\backend';

// Create base controllers
controllers.forEach(c => {
    const file = path.join(backendDir, 'controllers', c);
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Add your controller logic here
module.exports = {
  // Methods
};
`);
    }
});

// Create base routes
routes.forEach(r => {
    const file = path.join(backendDir, 'routes', r);
    if (!fs.existsSync(file)) {
        const controllerName = r.replace('Routes', 'Controller');
        fs.writeFileSync(file, `
const express = require('express');
const router = express.Router();
const controller = require('../controllers/${controllerName}');
const authMiddleware = require('../middleware/authMiddleware');

// Define routes

module.exports = router;
`);
    }
});

console.log('Bootstrapped backend files successfully.');
