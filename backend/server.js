require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { errorMiddleware } = require('./middleware/errorMiddleware');
const authRoutes = require('./routes/authRoutes');
const baseRoutes = require('./routes/baseRoutes');
const userRoutes = require('./routes/userRoutes');
const equipmentRoutes = require('./routes/equipmentRoutes');
const assetRoutes = require('./routes/assetRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const transferRoutes = require('./routes/transferRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const expenditureRoutes = require('./routes/expenditureRoutes');
const auditRoutes = require('./routes/auditRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
app.use(cors({
    origin: '*', // Or specify the frontend URL e.g., 'http://localhost:5173'
    credentials: true,
}));
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json());

const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*', // Adjust to match frontend URL in production
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});

// Middleware to inject io into requests
app.use((req, res, next) => {
    req.io = io;
    next();
});

app.use('/api/auth', authRoutes);
app.use('/api/bases', baseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/equipment-types', equipmentRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/expenditures', expenditureRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/dashboard', dashboardRoutes);

// --- ENTERPRISE EXPANSION ROUTES ---
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/approvals', require('./routes/approvalRoutes'));
app.use('/api/maintenance', require('./routes/maintenanceRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/search', require('./routes/searchRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/auth/2fa', require('./routes/twoFactorRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/anomalies', require('./routes/anomalyRoutes'));
app.use('/api/documents', require('./routes/documentRoutes'));

// Serve uploads
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));

app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Allow users to join a base-specific room if they want only local updates, 
    // or just broadcast to everyone for now
    socket.on('join', (userRole) => {
        console.log(`User joined as ${userRole}`);
    });

    socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
    });
});

server.listen(PORT, () => {
    console.log(`Military Asset Management System Backend running on port ${PORT}`);
});
