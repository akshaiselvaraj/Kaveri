"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pgDb = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load .env
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../../.env') });
const pool = new pg_1.Pool({
    host: process.env.PGHOST || 'localhost',
    user: process.env.PGUSER || 'postgres',
    database: process.env.PGDATABASE || 'kaveri',
    password: process.env.PGPASSWORD || 'postgres',
    port: parseInt(process.env.PGPORT || '5432', 10),
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});
exports.pgDb = {
    query: (text, params) => pool.query(text, params),
    async queryAll(text, params) {
        const res = await pool.query(text, params);
        return res.rows;
    },
    async queryGet(text, params) {
        const res = await pool.query(text, params);
        return res.rows[0];
    },
    getPool: () => pool,
};
pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client', err);
});
