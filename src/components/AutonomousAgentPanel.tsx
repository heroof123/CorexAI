import React, { useState, useEffect } from 'react';
import { agentService } from '../services/agentService';
import {
    getAutonomyConfig,
    saveAutonomyConfig,
    getAutonomyLevelDescription,
    AutonomyLevel
} from '../services/ai';

export const AutonomousAgentPanel: React.FC = () => {
    const [config, setConfig] = useState(getAutonomyConfig());
    const [activeRole, setActiveRole] = useState(agentService.getActiveRole());
    const [logs, setLogs] = useState<any[]>([]);

    useEffect(() => {
        const handleLog = (msg: any) => {
            if (msg.role === 'system' && (msg.content.includes('🤖') || msg.content.includes('🚀') || msg.content.includes('🔧') || msg.content.includes('✅'))) {
                setLogs(prev => [{
                    id: Date.now(),
                    content: msg.content,
                    timestamp: msg.timestamp || Date.now()
                }, ...prev].slice(0, 50));
            }
        };
        agentService.registerChatCallback(handleLog);
        return () => agentService.unregisterChatCallback(handleLog);
    }, []);

    const handleLevelChange = (level: number) => {
        const newConfig = { ...config, level: level as AutonomyLevel };
        setConfig(newConfig);
        saveAutonomyConfig(newConfig);
    };

    const handleRoleChange = (role: 'Architect' | 'Developer' | 'QA' | 'CorexA') => {
        agentService.setActiveRole(role);
        setActiveRole(role);
    };

    const levels: AutonomyLevel[] = [1, 2, 3, 4, 5];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#050505', padding: '12px', gap: '10px', overflow: 'hidden' }}>

            {/* Header */}
            <div>
                <h2 style={{ fontSize: 13, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                    <span style={{ width: 8, height: 8, background: '#ef4444', borderRadius: '50%', animation: 'pulse 2s infinite', boxShadow: '0 0 10px rgba(239,68,68,0.8)', flexShrink: 0 }} />
                    Otonom Islem Merkezi
                </h2>
                <p style={{ fontSize: 9, color: '#525252', textTransform: 'uppercase', fontWeight: 900, letterSpacing: 2, marginTop: 2 }}>Ghost in the Machine (v2.0)</p>
            </div>

            {/* Autonomy Level */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 9, fontWeight: 900, color: '#737373', textTransform: 'uppercase', letterSpacing: 2 }}>Otonomi Seviyesi</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: 'rgba(239,68,68,0.2)', padding: '2px 8px', borderRadius: 20, border: '1px solid rgba(239,68,68,0.3)' }}>
                        Seviye {config.level}
                    </span>
                </div>

                <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                    {levels.map(l => (
                        <button
                            key={l}
                            onClick={() => handleLevelChange(l)}
                            title={getAutonomyLevelDescription(l)}
                            style={{
                                flex: 1, height: 8, borderRadius: 999, border: 'none', cursor: 'pointer',
                                background: config.level >= l
                                    ? l === 5 ? '#ef4444' : '#3b82f6'
                                    : 'rgba(255,255,255,0.1)',
                                boxShadow: config.level >= l && l === 5 ? '0 0 8px rgba(239,68,68,0.5)' : 'none',
                                transition: 'all 0.2s'
                            }}
                        />
                    ))}
                </div>
                <p style={{ fontSize: 9, color: '#737373', fontStyle: 'italic', textAlign: 'center', margin: 0 }}>
                    {getAutonomyLevelDescription(config.level)}
                </p>
            </div>

            {/* Role Selection */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {(['Architect', 'Developer', 'QA', 'CorexA'] as const).map(role => (
                    <button
                        key={role}
                        onClick={() => handleRoleChange(role)}
                        style={{
                            padding: '7px 4px',
                            borderRadius: 12,
                            fontSize: 9,
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            letterSpacing: 1.5,
                            cursor: 'pointer',
                            border: '1px solid',
                            transition: 'all 0.2s',
                            background: activeRole === role ? '#2563eb' : 'rgba(255,255,255,0.02)',
                            color: activeRole === role ? '#fff' : '#737373',
                            borderColor: activeRole === role ? '#60a5fa' : 'rgba(255,255,255,0.05)',
                        }}
                    >
                        {role}
                    </button>
                ))}
            </div>

            {/* Live Activity Logs */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                    <span style={{ fontSize: 9, fontWeight: 900, color: '#737373', textTransform: 'uppercase', letterSpacing: 2 }}>Otonom Aktivite</span>
                    <span style={{ fontSize: 9, color: '#404040', fontFamily: 'monospace' }}>LIVE FEED</span>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {logs.length === 0 ? (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
                            <div style={{ fontSize: 32, marginBottom: 6 }}>📡</div>
                            <p style={{ fontSize: 10, color: '#fff', margin: 0 }}>Otonom islem bekleniyor...</p>
                        </div>
                    ) : (
                        logs.map((log) => (
                            <div key={log.id} style={{ padding: '6px 8px', background: 'rgba(255,255,255,0.02)', borderLeft: '2px solid rgba(239,68,68,0.5)', borderRadius: '0 8px 8px 0' }}>
                                <div style={{ fontSize: 9, color: '#404040', fontFamily: 'monospace', marginBottom: 2 }}>
                                    {new Date(log.timestamp).toLocaleTimeString()}
                                </div>
                                <p style={{ fontSize: 10, color: '#d4d4d4', lineHeight: 1.5, fontFamily: 'monospace', margin: 0 }}>
                                    {log.content.replace(/\*\*/g, '')}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Quick Action */}
            <button
                onClick={() => agentService.applyAutofix("Manual trigger scan")}
                style={{
                    width: '100%', padding: '9px', background: 'linear-gradient(90deg, #dc2626, #ea580c)',
                    border: 'none', borderRadius: 12, fontSize: 10, fontWeight: 900,
                    textTransform: 'uppercase', letterSpacing: 3, color: '#fff',
                    cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0
                }}
            >
                Tum Proyeyi Heal Et
            </button>
        </div>
    );
};
