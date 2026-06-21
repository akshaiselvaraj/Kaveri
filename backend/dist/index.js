"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const config_1 = require("./config");
const api_routes_1 = __importDefault(require("./routes/api.routes"));
require("./db/sqlite"); // Import to trigger SQLite DB init and seeding
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: '*', // For hackathon purposes, open access to all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json());
// Routes
app.use('/api', api_routes_1.default);
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'Kaveri Crime Intelligence Backend' });
});
app.listen(config_1.config.PORT, () => {
    console.log(`===========================================================`);
    console.log(`Kaveri Crime Intelligence Backend is running on port ${config_1.config.PORT}`);
    console.log(`API base endpoint: http://localhost:${config_1.config.PORT}/api`);
    console.log(`===========================================================`);
});
