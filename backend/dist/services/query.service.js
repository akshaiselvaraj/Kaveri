"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryService = void 0;
const sqlite_1 = require("../db/sqlite");
class QueryService {
    /**
     * 1. Get FIR Details (Intent: get_fir)
     */
    async getFir(firId) {
        let id = firId.trim();
        if (!id.toUpperCase().startsWith('FIR-')) {
            id = `FIR-${id}`;
        }
        const sql = `
SELECT f.*, l.district, l.latitude, l.longitude
FROM fir f
LEFT JOIN location l ON f.location_id = l.location_id
WHERE UPPER(f.fir_id) = UPPER(?)
    `.trim();
        const fir = await (0, sqlite_1.queryGet)(sql, [id]);
        if (!fir)
            return { data: null, sql };
        // Get linked accused
        const accusedSql = `SELECT a.* FROM accused a JOIN crime_link cl ON a.accused_id = cl.accused_id WHERE cl.fir_id = ?`;
        const accused = await (0, sqlite_1.queryAll)(accusedSql, [id]);
        // Get linked victims
        const victimsSql = `SELECT v.* FROM victim v JOIN crime_link cl ON v.victim_id = cl.victim_id WHERE cl.fir_id = ?`;
        const victims = await (0, sqlite_1.queryAll)(victimsSql, [id]);
        // Get transactions on date
        const transactions = await (0, sqlite_1.queryAll)(`SELECT * FROM transaction_table WHERE date = ? LIMIT 10`, [fir.date]);
        return {
            data: { fir, accused, victims, transactions },
            sql: `${sql};\n-- ${accusedSql};\n-- ${victimsSql};`
        };
    }
    /**
     * 2. Get Accused Details (Intent: get_accused)
     */
    async getAccused(identifier) {
        let accused;
        let sql = '';
        if (typeof identifier === 'number' || !isNaN(Number(identifier))) {
            sql = `SELECT * FROM accused WHERE accused_id = ?`;
            accused = await (0, sqlite_1.queryGet)(sql, [Number(identifier)]);
        }
        else {
            sql = `SELECT * FROM accused WHERE name LIKE ?`;
            accused = await (0, sqlite_1.queryGet)(sql, [`%${identifier}%`]);
        }
        if (!accused)
            return { data: null, sql };
        const historySql = `
SELECT f.fir_id, f.crime_type, f.date, f.status, f.description, l.district
FROM fir f
JOIN crime_link cl ON f.fir_id = cl.fir_id
LEFT JOIN location l ON f.location_id = l.location_id
WHERE cl.accused_id = ?
ORDER BY f.date DESC
    `.trim();
        const history = await (0, sqlite_1.queryAll)(historySql, [accused.accused_id]);
        return {
            data: { accused, history },
            sql: `${sql};\n-- ${historySql};`
        };
    }
    /**
     * 3. Get Victim Details (Intent: get_victim)
     */
    async getVictim(identifier) {
        let victim;
        let sql = '';
        if (typeof identifier === 'number' || !isNaN(Number(identifier))) {
            sql = `SELECT * FROM victim WHERE victim_id = ?`;
            victim = await (0, sqlite_1.queryGet)(sql, [Number(identifier)]);
        }
        else {
            sql = `SELECT * FROM victim WHERE name LIKE ?`;
            victim = await (0, sqlite_1.queryGet)(sql, [`%${identifier}%`]);
        }
        if (!victim)
            return { data: null, sql };
        const casesSql = `
SELECT f.fir_id, f.crime_type, f.date, f.status, l.district
FROM fir f
JOIN crime_link cl ON f.fir_id = cl.fir_id
LEFT JOIN location l ON f.location_id = l.location_id
WHERE cl.victim_id = ?
ORDER BY f.date DESC
    `.trim();
        const cases = await (0, sqlite_1.queryAll)(casesSql, [victim.victim_id]);
        return {
            data: { victim, cases },
            sql: `${sql};\n-- ${casesSql};`
        };
    }
    /**
     * 4. Crime By Location (Intent: crime_by_location)
     */
    async crimeByLocation(districtName, crimeType) {
        let sql = `
SELECT f.fir_id, f.crime_type, f.date, f.status, f.description, l.district
FROM fir f
JOIN location l ON f.location_id = l.location_id
WHERE l.district LIKE ?
    `.trim();
        const params = [`%${districtName}%`];
        if (crimeType) {
            sql += '\nAND f.crime_type LIKE ?';
            params.push(`%${crimeType}%`);
        }
        sql += '\nORDER BY f.date DESC LIMIT 30';
        const results = await (0, sqlite_1.queryAll)(sql, params);
        return { data: results, sql };
    }
    /**
     * 5. Investigation Status Overview (Intent: investigation_status)
     */
    async investigationStatus(status, district, crimeType) {
        let sql = `
SELECT f.fir_id, f.crime_type, f.date, f.status, f.description, l.district
FROM fir f
JOIN location l ON f.location_id = l.location_id
WHERE f.status LIKE ?
    `.trim();
        const params = [`%${status}%`];
        if (district) {
            sql += '\nAND l.district LIKE ?';
            params.push(`%${district}%`);
        }
        if (crimeType) {
            sql += '\nAND f.crime_type LIKE ?';
            params.push(`%${crimeType}%`);
        }
        sql += '\nORDER BY f.date DESC LIMIT 30';
        const results = await (0, sqlite_1.queryAll)(sql, params);
        return { data: results, sql };
    }
    /**
     * 6. Repeat Offenders (Intent: repeat_offenders)
     */
    async repeatOffenders(district, crimeType) {
        let sql = `
SELECT a.accused_id, a.name, a.age, a.gender, a.occupation, a.risk_score, COUNT(cl.fir_id) as case_count,
       GROUP_CONCAT(DISTINCT f.crime_type) as crime_types
FROM accused a
JOIN crime_link cl ON a.accused_id = cl.accused_id
JOIN fir f ON cl.fir_id = f.fir_id
LEFT JOIN location l ON f.location_id = l.location_id
    `.trim();
        const conditions = [];
        const params = [];
        if (district) {
            conditions.push('l.district LIKE ?');
            params.push(`%${district}%`);
        }
        if (crimeType) {
            conditions.push('f.crime_type LIKE ?');
            params.push(`%${crimeType}%`);
        }
        if (conditions.length > 0) {
            sql += '\nWHERE ' + conditions.join(' AND ');
        }
        sql += `
GROUP BY a.accused_id
HAVING case_count > 1
ORDER BY case_count DESC, a.risk_score DESC
LIMIT 15
    `.trim();
        const results = await (0, sqlite_1.queryAll)(sql, params);
        return { data: results, sql };
    }
    /**
     * 7. Criminal History dossier retrieval (Intent: criminal_history)
     */
    async criminalHistory(personName) {
        return this.getAccused(personName);
    }
    /**
     * 8. Crime Statistics (Intent: crime_statistics)
     */
    async crimeStatistics(district, crimeType) {
        const params = [];
        let districtFilter = '';
        if (district) {
            districtFilter = 'JOIN location l ON f.location_id = l.location_id WHERE l.district LIKE ?';
            params.push(`%${district}%`);
        }
        const totalCount = await (0, sqlite_1.queryGet)(`
      SELECT COUNT(*) as count FROM fir f
      ${districtFilter}
    `, params);
        let typeSql = `SELECT crime_type, COUNT(*) as count FROM fir f`;
        if (district) {
            typeSql += ` JOIN location l ON f.location_id = l.location_id WHERE l.district LIKE ?`;
        }
        typeSql += ` GROUP BY crime_type ORDER BY count DESC`;
        const crimeTypes = await (0, sqlite_1.queryAll)(typeSql, params);
        let statusSql = `SELECT status, COUNT(*) as count FROM fir f`;
        if (district) {
            statusSql += ` JOIN location l ON f.location_id = l.location_id WHERE l.district LIKE ?`;
        }
        statusSql += ` GROUP BY status`;
        const statuses = await (0, sqlite_1.queryAll)(statusSql, params);
        let riskSql = `
      SELECT DISTINCT a.name, a.risk_score, a.occupation
      FROM accused a
      JOIN crime_link cl ON a.accused_id = cl.accused_id
      JOIN fir f ON cl.fir_id = f.fir_id
    `;
        const riskParams = [];
        if (district) {
            riskSql += ` JOIN location l ON f.location_id = l.location_id WHERE l.district LIKE ? AND a.risk_score > 75`;
            riskParams.push(`%${district}%`);
        }
        else {
            riskSql += ` WHERE a.risk_score > 75`;
        }
        riskSql += ` ORDER BY a.risk_score DESC LIMIT 5`;
        const highRiskSuspects = await (0, sqlite_1.queryAll)(riskSql, riskParams);
        const mainSql = `
-- Total Registered Cases:
SELECT COUNT(*) FROM fir f ${district ? 'JOIN location l ON f.location_id = l.location_id WHERE l.district = ?' : ''};
-- Distribution by Crime Type:
${typeSql};
-- Suspect Risk Analysis:
${riskSql};
    `.trim();
        return {
            data: {
                totalCases: totalCount?.count || 0,
                crimeTypes,
                statuses,
                highRiskSuspects
            },
            sql: mainSql
        };
    }
    /**
     * Helper fallback to retrieve top items for general context
     */
    async generalStatus() {
        const counts = await (0, sqlite_1.queryGet)('SELECT COUNT(*) as count FROM fir');
        const locationCount = await (0, sqlite_1.queryGet)('SELECT COUNT(*) as count FROM location');
        const accusedCount = await (0, sqlite_1.queryGet)('SELECT COUNT(*) as count FROM accused');
        return {
            data: {
                totalFirs: counts?.count || 0,
                totalLocations: locationCount?.count || 0,
                totalAccused: accusedCount?.count || 0
            },
            sql: 'SELECT (SELECT COUNT(*) FROM fir) as firs, (SELECT COUNT(*) FROM location) as locs, (SELECT COUNT(*) FROM accused) as acc;'
        };
    }
}
exports.queryService = new QueryService();
