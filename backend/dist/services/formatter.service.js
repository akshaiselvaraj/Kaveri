"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatterService = exports.FormatterService = void 0;
class FormatterService {
    /**
     * Format FIR Details
     */
    formatFir(data) {
        if (!data)
            return '⚠️ **Investigation dossier not found for the requested FIR.**';
        const { fir, accused, victims, transactions } = data;
        let md = `### 📋 Investigation File: **${fir.fir_id}**\n`;
        md += `- **Crime Type**: \`${fir.crime_type}\`\n`;
        md += `- **Status**: **${fir.status}**\n`;
        md += `- **Date**: \`${fir.date}\`\n`;
        md += `- **Location**: \`${fir.district}\` (Lat: ${fir.latitude}, Lng: ${fir.longitude})\n`;
        md += `- **Description**: ${fir.description}\n\n`;
        md += `#### 👥 Linked Suspects/Accused (${accused.length}):\n`;
        if (accused.length > 0) {
            md += `| ID | Suspect Name | Age | Gender | Occupation | Risk Score | Dossier |\n`;
            md += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;
            accused.forEach((a) => {
                const riskBadge = a.risk_score >= 70 ? `🔴 ${a.risk_score}%` : a.risk_score >= 40 ? `🟡 ${a.risk_score}%` : `🟢 ${a.risk_score}%`;
                md += `| \`${a.accused_id}\` | **${a.name}** | ${a.age} | ${a.gender} | ${a.occupation || 'N/A'} | ${riskBadge} | [View Dossier](#/accused/${a.accused_id}) |\n`;
            });
        }
        else {
            md += `*No accused suspects linked to this case file.*\n`;
        }
        md += `\n`;
        md += `#### 👤 Linked Victims (${victims.length}):\n`;
        if (victims.length > 0) {
            md += `| ID | Victim Name | Age | Gender | Occupation | Dossier |\n`;
            md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
            victims.forEach((v) => {
                md += `| \`${v.victim_id}\` | **${v.name}** | ${v.age} | ${v.gender} | ${v.occupation || 'N/A'} | [View Profile](#/victim/${v.victim_id}) |\n`;
            });
        }
        else {
            md += `*No victim profiles linked to this case file.*\n`;
        }
        md += `\n`;
        if (fir.crime_type === 'Cyber Fraud' || fir.crime_type === 'Financial Crime') {
            md += `#### 💸 Associated Account Transactions:\n`;
            if (transactions && transactions.length > 0) {
                md += `| Txn ID | From Account | To Account | Amount | Date |\n`;
                md += `| :--- | :--- | :--- | :--- | :--- |\n`;
                transactions.forEach((t) => {
                    md += `| \`${t.transaction_id}\` | \`${t.from_account}\` | \`${t.to_account}\` | **INR ${t.amount.toLocaleString('en-IN')}** | \`${t.date}\` |\n`;
                });
            }
            else {
                md += `*No transactions linked for this case date.*\n`;
            }
        }
        return md;
    }
    /**
     * Format Accused Dossier
     */
    formatAccused(data) {
        if (!data)
            return '⚠️ **Suspect record not found.**';
        const { accused, history } = data;
        const riskBadge = accused.risk_score >= 70 ? `🔴 HIGH RISK (${accused.risk_score}%)` : accused.risk_score >= 40 ? `🟡 MEDIUM RISK (${accused.risk_score}%)` : `🟢 LOW RISK (${accused.risk_score}%)`;
        let md = `### 👤 Suspect Dossier: **${accused.name}**\n`;
        md += `- **Suspect ID**: \`${accused.accused_id}\`\n`;
        md += `- **Demographics**: ${accused.age} Years Old | ${accused.gender}\n`;
        md += `- **Occupation**: ${accused.occupation || 'Unspecified'}\n`;
        md += `- **Risk Classification**: **${riskBadge}**\n\n`;
        md += `#### 📅 Case Incident Registry Linkage (${history.length}):\n`;
        if (history.length > 0) {
            md += `| FIR ID | Crime Type | Incident Date | Case Status | Location | Summary |\n`;
            md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
            history.forEach((h) => {
                md += `| **[${h.fir_id}](#/fir/${h.fir_id})** | \`${h.crime_type}\` | \`${h.date}\` | *${h.status}* | ${h.district} | ${h.description.substring(0, 50)}... |\n`;
            });
        }
        else {
            md += `*No registered crime records associated with this suspect.*\n`;
        }
        return md;
    }
    /**
     * Format Victim Profile
     */
    formatVictim(data) {
        if (!data)
            return '⚠️ **Victim profile not found.**';
        const { victim, cases } = data;
        let md = `### 👤 Victim Profile: **${victim.name}**\n`;
        md += `- **Victim ID**: \`${victim.victim_id}\`\n`;
        md += `- **Demographics**: ${victim.age} Years Old | ${victim.gender}\n`;
        md += `- **Occupation**: ${victim.occupation || 'Unspecified'}\n\n`;
        md += `#### 📋 Mapped Cases (${cases.length}):\n`;
        if (cases.length > 0) {
            md += `| FIR ID | Crime Type | Date | Case Status | Location |\n`;
            md += `| :--- | :--- | :--- | :--- | :--- |\n`;
            cases.forEach((c) => {
                md += `| **[${c.fir_id}](#/fir/${c.fir_id})** | \`${c.crime_type}\` | \`${c.date}\` | *${c.status}* | ${c.district} |\n`;
            });
        }
        else {
            md += `*No records found mapping this profile to active FIRs.*\n`;
        }
        return md;
    }
    /**
     * Format Crime By Location
     */
    formatCrimeByLocation(results, location, crimeType) {
        let md = `### 📍 Crime Registry for Location: **${location}**\n`;
        if (crimeType)
            md += `*Filtered by Crime Type: \`${crimeType}\`*\n\n`;
        md += `Found **${results.length}** matches in this region.\n\n`;
        if (results.length > 0) {
            md += `| FIR ID | Crime Type | Date | Status | Summary |\n`;
            md += `| :--- | :--- | :--- | :--- | :--- |\n`;
            results.forEach((r) => {
                md += `| **[${r.fir_id}](#/fir/${r.fir_id})** | \`${r.crime_type}\` | \`${r.date}\` | *${r.status}* | ${r.description.substring(0, 60)}... |\n`;
            });
        }
        else {
            md += `*No crime records matching these filters exist in the database.*\n`;
        }
        return md;
    }
    /**
     * Format Investigation Status
     */
    formatInvestigationStatus(results, status, district, crimeType) {
        let md = `### 🔍 Investigation Status: **${status}**\n`;
        const filters = [];
        if (district)
            filters.push(`District: \`${district}\``);
        if (crimeType)
            filters.push(`Crime Type: \`${crimeType}\``);
        if (filters.length > 0)
            md += `*Filters: ${filters.join(' | ')}*\n\n`;
        md += `Found **${results.length}** cases currently marked as \`${status}\`.\n\n`;
        if (results.length > 0) {
            md += `| FIR ID | District | Crime Type | Date | Description |\n`;
            md += `| :--- | :--- | :--- | :--- | :--- |\n`;
            results.forEach((r) => {
                md += `| **[${r.fir_id}](#/fir/${r.fir_id})** | ${r.district} | \`${r.crime_type}\` | \`${r.date}\` | ${r.description.substring(0, 60)}... |\n`;
            });
        }
        else {
            md += `*No cases matched this status and filter configuration.*\n`;
        }
        return md;
    }
    /**
     * Format Repeat Offenders
     */
    formatRepeatOffenders(results, district, crimeType) {
        let md = `### ⚠️ High-Risk Repeat Offenders\n`;
        const filters = [];
        if (district)
            filters.push(`District: \`${district}\``);
        if (crimeType)
            filters.push(`Crime Type: \`${crimeType}\``);
        if (filters.length > 0)
            md += `*Filters: ${filters.join(' | ')}*\n\n`;
        md += `Found **${results.length}** suspects associated with multiple registered cases.\n\n`;
        if (results.length > 0) {
            md += `| Suspect Name | Risk Score | Case Count | Associated Crimes | Occupation | Dossier |\n`;
            md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
            results.forEach((r) => {
                const riskBadge = r.risk_score >= 70 ? `🔴 ${r.risk_score}%` : r.risk_score >= 40 ? `🟡 ${r.risk_score}%` : `🟢 ${r.risk_score}%`;
                const crimes = r.crime_types ? r.crime_types.split(',').map((c) => `\`${c}\``).join(', ') : 'N/A';
                md += `| **${r.name}** | ${riskBadge} | **${r.case_count} Cases** | ${crimes} | ${r.occupation || 'N/A'} | [View Dossier](#/accused/${r.accused_id}) |\n`;
            });
        }
        else {
            md += `*No repeat offenders found matching the filter configuration.*\n`;
        }
        return md;
    }
    /**
     * Format Crime Statistics
     */
    formatStatistics(stats, district) {
        let md = `### 📊 Crime Intelligence Summary Report\n`;
        if (district)
            md += `*Location Boundary: \`${district}\`*\n\n`;
        md += `- **Total Registered Cases**: **${stats.totalCases}**\n\n`;
        md += `#### 🚨 Case Distribution by Crime Type:\n`;
        if (stats.crimeTypes.length > 0) {
            md += `| Crime Type | Incident Count | Barchart |\n`;
            md += `| :--- | :--- | :--- |\n`;
            const max = stats.crimeTypes[0]?.count || 1;
            stats.crimeTypes.forEach((t) => {
                const barSize = Math.max(1, Math.round((t.count / max) * 10));
                const bar = '█'.repeat(barSize) + '░'.repeat(10 - barSize);
                md += `| \`${t.crime_type}\` | **${t.count}** | \`${bar}\` |\n`;
            });
        }
        else {
            md += `*No registered crime distribution stats.*\n`;
        }
        md += `\n`;
        md += `#### 📈 Case Resolution Pipeline:\n`;
        if (stats.statuses.length > 0) {
            md += `| Case Status | Case Count |\n`;
            md += `| :--- | :--- |\n`;
            stats.statuses.forEach((s) => {
                md += `| *${s.status}* | **${s.count}** |\n`;
            });
        }
        else {
            md += `*No status pipeline logs found.*\n`;
        }
        md += `\n`;
        md += `#### ⚠️ Mapped High-Risk Suspects:\n`;
        if (stats.highRiskSuspects.length > 0) {
            stats.highRiskSuspects.forEach((a) => {
                md += `- **${a.name}** (Risk Score: \`${a.risk_score}%\`) - *${a.occupation || 'Unspecified'}*\n`;
            });
        }
        else {
            md += `*No high risk suspects active in this area.*\n`;
        }
        return md;
    }
}
exports.FormatterService = FormatterService;
exports.formatterService = new FormatterService();
