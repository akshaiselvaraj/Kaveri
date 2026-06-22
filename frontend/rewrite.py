import re

def update_app():
    with open('src/App.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # Imports
    content = content.replace("import React, { useState, useEffect, useRef } from 'react';", 
                              "import React, { useState, useEffect, useRef } from 'react';\nimport { useTranslation } from 'react-i18next';")
    
    # Hook
    content = content.replace("export default function App() {", 
                              "export default function App() {\n  const { t, i18n } = useTranslation();")
    
    # Session load
    content = content.replace("`Loaded operational session logs ID: **${id}**. Processing secure console logs...`",
                              "t('system.loaded_session', { id })")
    
    # Error text
    content = content.replace("'Operational AI pipeline failed to process the request.'",
                              "t('system.error')")
    
    # Header
    content = content.replace(">KAVERI CRIME INTELLIGENCE PLATFORM</h1>",
                              ">{t('header.title')}</h1>")
    content = content.replace(">Government of Karnataka // Police Intelligence Unit</p>",
                              ">{t('header.subtitle')}</p>")
    content = content.replace("<span>{selectedRole}</span>",
                              "<span>{selectedRole === 'Lead Investigator' ? t('header.role') : selectedRole === 'Intelligence Officer' ? t('header.role_io') : t('header.role_dgp')}</span>")
    content = content.replace("onClick={() => setLanguage(l => l === 'en' ? 'kn' : 'en')}",
                              "onClick={() => { const newLang = language === 'en' ? 'kn' : 'en'; setLanguage(newLang); i18n.changeLanguage(newLang); }}")
    
    content = content.replace(">Console.Admin</span>",
                              ">{t('header.admin')}</span>")
    
    # Main area
    content = content.replace(">Kaveri Crime Intelligence Assistant</h2>",
                              ">{t('main.assistant_title')}</h2>")
    content = content.replace("Access state crime registers using secure natural language commands. Mapped suspect files, risk records, and transfer histories update context registers in real time.",
                              "{t('main.assistant_desc')}")
    
    # Prompts
    content = content.replace("""[
                    'Show cyber fraud cases in Bengaluru',
                    'Retrieve FIR 1002',
                    'Show criminal history of Ravi Kumar',
                    'List repeat offenders',
                    'Show pending investigations'
                  ]""", """[
                    t('main.prompt1'),
                    t('main.prompt2'),
                    t('main.prompt3'),
                    t('main.prompt4'),
                    t('main.prompt5')
                  ]""")
                  
    # Loading
    content = content.replace("Compiling State SQL Database Queries",
                              "{t('main.compiling')}")
    
    # Input
    content = content.replace("""placeholder={language === 'en' ? "Execute crime intelligence commands (e.g. show repeat offenders)..." : "ಅಪರಾಧ ದಾಖಲೆಗಳ ಪ್ರಶ್ನೆಯನ್ನು ನಮೂದಿಸಿ..."}""",
                              """placeholder={t('main.input_placeholder')}""")
    content = content.replace(">Execute query\n              </button>",
                              ">{t('main.submit')}\n              </button>")
    
    # Settings
    content = content.replace("secure console settings",
                              "{t('settings.title')}")
    content = content.replace("Investigator Role Profile</label>",
                              "{t('settings.role_label')}</label>")
    content = content.replace(">Lead Investigator</option>",
                              ">{t('header.role')}</option>")
    content = content.replace(">Intelligence Officer</option>",
                              ">{t('header.role_io')}</option>")
    content = content.replace(">Director General of Police</option>",
                              ">{t('header.role_dgp')}</option>")
                              
    content = content.replace(">Target AI Engine Model</span>",
                              ">{t('settings.model_label')}</span>")
    content = content.replace(">ACTIVE SECURE</span>",
                              ">{t('settings.active_secure')}</span>")
    content = content.replace(">Database Provider API</span>",
                              ">{t('settings.db_label')}</span>")
    content = content.replace(">LOCAL SEED</span>",
                              ">{t('settings.local_seed')}</span>")
    content = content.replace(">\n                Apply Changes",
                              ">\n                {t('settings.apply')}")

    with open('src/App.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

def update_sidebar():
    with open('src/components/Sidebar.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    content = content.replace("import { Plus", "import { useTranslation } from 'react-i18next';\nimport { Plus")
    content = content.replace("export const Sidebar: React.FC<SidebarProps> = ({", "export const Sidebar: React.FC<SidebarProps> = ({\n")
    # inject hook
    content = re.sub(r'(export const Sidebar: React\.FC<SidebarProps> = \(\{[^\}]+\}\) => \{)', r'\1\n  const { t } = useTranslation();', content)
    
    content = content.replace(">KAVERI ASSISTANT</h1>", ">{t('sidebar.title')}</h1>")
    content = content.replace(">Karnataka Police Intel</p>", ">{t('sidebar.subtitle')}</p>")
    content = content.replace(">\n            New Investigation", ">\n            {t('sidebar.new_chat')}")
    content = content.replace(">\n            Recent Investigations", ">\n            {t('sidebar.recent_chats')}")
    content = content.replace("No previous investigations logged.", "{t('sidebar.no_history')}")
    content = content.replace(">\n          Export Report", ">\n          {t('sidebar.export')}")
    content = content.replace(">\n          Settings", ">\n          {t('sidebar.settings')}")
    content = content.replace(">CONSOLE CONNECTED</span>", ">{t('sidebar.connected')}</span>")
    
    with open('src/components/Sidebar.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

def update_right_panel():
    with open('src/components/RightPanel.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    content = content.replace("import { Filter", "import { useTranslation } from 'react-i18next';\nimport { Filter")
    content = re.sub(r'(export const RightPanel: React\.FC<RightPanelProps> = \([^)]+\) => \{)', r'\1\n  const { t } = useTranslation();', content)
    
    content = content.replace(">Operational Context</h2>", ">{t('right_panel.title')}</h2>")
    content = content.replace(">\n            Active Filters", ">\n            {t('right_panel.active_filters')}")
    content = content.replace(">No search filters active.</p>", ">{t('right_panel.no_filters')}</p>")
    content = content.replace(">\n            Query Metrics", ">\n            {t('right_panel.metrics')}")
    content = content.replace(">Pipeline Intent:</span>", ">{t('right_panel.intent')}</span>")
    content = content.replace(">Latency:</span>", ">{t('right_panel.latency')}</span>")
    content = content.replace(">Language Dialect:</span>", ">{t('right_panel.dialect')}</span>")
    content = content.replace(">\n            Generated SQL Query", ">\n            {t('right_panel.sql_title')}")
    content = content.replace(">No SQL executed in this interaction.</p>", ">{t('right_panel.no_sql')}</p>")
    content = content.replace(">\n            Dossier Links", ">\n            {t('right_panel.dossier')}")
    content = content.replace(">No suspect or case dossier entities mapped.</p>", ">{t('right_panel.no_dossier')}</p>")
    
    with open('src/components/RightPanel.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

def update_message_item():
    with open('src/components/MessageItem.tsx', 'r', encoding='utf-8') as f:
        content = f.read()
        
    content = content.replace("import { Shield", "import { useTranslation } from 'react-i18next';\nimport { Shield")
    content = re.sub(r'(export const MessageItem: React\.FC<MessageItemProps> = \([^)]+\) => \{)', r'\1\n  const { t } = useTranslation();', content)
    
    content = content.replace("Suspect #{trimmedCell}", "{t('message.suspect')} #{trimmedCell}")
    content = content.replace("Victim #{trimmedCell}", "{t('message.victim')} #{trimmedCell}")
    content = content.replace(">Log ID: #USR-{message.id.slice(-4)}</span>", ">{t('message.log_id')}{message.id.slice(-4)}</span>")
    content = content.replace(">Investigator Query</span>", ">{t('message.user_query')}</span>")
    content = content.replace(">Crime Intelligence Findings</span>", ">{t('message.findings')}</span>")
    content = content.replace(">\n                  Mute", ">\n                  {t('message.mute')}")
    content = content.replace(">\n                  Speak", ">\n                  {t('message.speak')}")
    content = content.replace("/> Summary", "/> {t('message.summary')}")
    content = content.replace("/> Evidence", "/> {t('message.evidence')}")
    content = content.replace("/> Recommendations", "/> {t('message.recommendations')}")
    content = content.replace("Secure Query executed successfully", "{t('message.sql_success')}")
    content = content.replace("Latency: {message.queryMetadata.executionTimeMs}ms", "{t('message.latency')} {message.queryMetadata.executionTimeMs}ms")
    
    with open('src/components/MessageItem.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

def update_details():
    with open('src/components/DetailViews.tsx', 'r', encoding='utf-8') as f:
        content = f.read()
        
    content = content.replace("import { X", "import { useTranslation } from 'react-i18next';\nimport { X")
    content = re.sub(r'(export const DetailModal: React\.FC<DetailModalProps> = \([^)]+\) => \{)', r'\1\n  const { t } = useTranslation();', content)
    
    content = content.replace("`Official Case Dossier: ${id}`", "t('details.fir_title').replace('{{id}}', id)")
    content = content.replace("`Suspect Identification profile`", "t('details.accused_title')")
    content = content.replace("`Victim Registry records`", "t('details.victim_title')")
    content = content.replace(">Retrieving official logs...</span>", ">{t('details.loading')}</span>")
    content = content.replace("/> Crime Type</span>", "/> {t('details.crime_type')}</span>")
    content = content.replace("/> Date Filed</span>", "/> {t('details.date_filed')}</span>")
    content = content.replace("/> Police Jurisdiction</span>", "/> {t('details.jurisdiction')}</span>")
    content = content.replace("/> Case Status</span>", "/> {t('details.status')}</span>")
    content = content.replace(">Incident Details</h3>", ">{t('details.incident_details')}</h3>")
    content = content.replace("'No case logs seeded.'", "t('details.no_case_logs')")
    content = content.replace(">Identified Suspects</h3>", ">{t('details.suspects')}</h3>")
    content = content.replace("'Unemployed'", "t('details.unemployed')")
    content = content.replace("Risk: {acc.risk_score}", "{t('details.risk')} {acc.risk_score}")
    content = content.replace(">No suspects identified.</p>", ">{t('details.no_suspects')}</p>")
    content = content.replace(">Victims / Complainants</h3>", ">{t('details.victims')}</h3>")
    content = content.replace("{vic.age} yrs", "{vic.age} {t('details.years_short')}")
    content = content.replace("'N/A'", "t('details.na')")
    content = content.replace(">No victim logs mapped.</p>", ">{t('details.no_victims')}</p>")
    content = content.replace("/> GPS Tag Location</span>", "/> {t('details.gps')}</span>")
    content = content.replace("Latitude: {data.latitude}° // Longitude: {data.longitude}°", "{t('details.lat')} {data.latitude}° // {t('details.lng')} {data.longitude}°")
    
    content = content.replace("{data.age} years old", "{data.age} {t('details.years')}")
    content = content.replace(">Accused Threat Risk index</span>", ">{t('details.threat_index')}</span>")
    content = content.replace(">Suspect Incident Dossier</h3>", ">{t('details.suspect_dossier')}</h3>")
    content = content.replace("Filed Date: {h.date}", "{t('details.filed_date')} {h.date}")
    content = content.replace(">No formal cases filed on this individual.</p>", ">{t('details.no_cases_ind')}</p>")
    content = content.replace(">Incident Complainant History</h3>", ">{t('details.complainant_history')}</h3>")
    content = content.replace("Filed Date: {c.date}", "{t('details.filed_date')} {c.date}")
    content = content.replace(">No formal cases filed on behalf of this person.</p>", ">{t('details.no_cases_vic')}</p>")
    
    # Fix statuses
    content = content.replace("{h.status}", "{h.status === 'Pending' ? t('details.status_pending') : h.status === 'Under Investigation' ? t('details.status_under_inv') : h.status === 'Completed' ? t('details.status_completed') : h.status === 'Closed' ? t('details.status_closed') : h.status}")
    content = content.replace("{c.status}", "{c.status === 'Pending' ? t('details.status_pending') : c.status === 'Under Investigation' ? t('details.status_under_inv') : c.status === 'Completed' ? t('details.status_completed') : c.status === 'Closed' ? t('details.status_closed') : c.status}")
    content = content.replace("{data.status}", "{data.status === 'Pending' ? t('details.status_pending') : data.status === 'Under Investigation' ? t('details.status_under_inv') : data.status === 'Completed' ? t('details.status_completed') : data.status === 'Closed' ? t('details.status_closed') : data.status}")

    with open('src/components/DetailViews.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    update_app()
    update_sidebar()
    update_right_panel()
    update_message_item()
    update_details()
