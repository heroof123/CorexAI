import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface DatabaseConnection {
  id: string;
  name: string;
  type: 'sqlite' | 'mysql' | 'postgresql';
  host?: string;
  port?: number;
  database: string;
  username?: string;
  isConnected: boolean;
}

interface Table {
  name: string;
  rowCount: number;
  columns: Column[];
}

interface Column {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey: boolean;
}

export default function DatabaseBrowser() {
  const { t } = useLanguage();
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [activeConnection, setActiveConnection] = useState<string | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [queryResult, setQueryResult] = useState<any[]>([]);
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM users LIMIT 10;');
  const [showAddConnection, setShowAddConnection] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = () => {
    const saved = localStorage.getItem('db_connections');
    if (saved) {
      setConnections(JSON.parse(saved));
    }
  };

  const saveConnections = (conns: DatabaseConnection[]) => {
    setConnections(conns);
    localStorage.setItem('db_connections', JSON.stringify(conns));
  };

  const addConnection = (conn: Omit<DatabaseConnection, 'id' | 'isConnected'>) => {
    const newConn: DatabaseConnection = {
      ...conn,
      id: Date.now().toString(),
      isConnected: false
    };
    saveConnections([...connections, newConn]);
    setShowAddConnection(false);
  };

  const connectToDatabase = async (id: string) => {
    try {
      // Simulate connection
      const updated = connections.map(conn => ({
        ...conn,
        isConnected: conn.id === id ? true : conn.isConnected
      }));
      saveConnections(updated);
      setActiveConnection(id);
      
      // Load sample tables
      setTables([
        {
          name: 'users',
          rowCount: 150,
          columns: [
            { name: 'id', type: 'INTEGER', nullable: false, primaryKey: true },
            { name: 'email', type: 'VARCHAR(255)', nullable: false, primaryKey: false },
            { name: 'name', type: 'VARCHAR(100)', nullable: true, primaryKey: false },
            { name: 'created_at', type: 'TIMESTAMP', nullable: false, primaryKey: false }
          ]
        },
        {
          name: 'posts',
          rowCount: 89,
          columns: [
            { name: 'id', type: 'INTEGER', nullable: false, primaryKey: true },
            { name: 'user_id', type: 'INTEGER', nullable: false, primaryKey: false },
            { name: 'title', type: 'VARCHAR(200)', nullable: false, primaryKey: false },
            { name: 'content', type: 'TEXT', nullable: true, primaryKey: false }
          ]
        },
        {
          name: 'categories',
          rowCount: 12,
          columns: [
            { name: 'id', type: 'INTEGER', nullable: false, primaryKey: true },
            { name: 'name', type: 'VARCHAR(50)', nullable: false, primaryKey: false }
          ]
        }
      ]);
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const executeQuery = async () => {
    if (!sqlQuery.trim()) return;
    
    setIsExecuting(true);
    try {
      // Simulate query execution
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Sample result data
      const sampleData = [
        { id: 1, email: 'john@example.com', name: 'John Doe', created_at: '2024-01-15 10:30:00' },
        { id: 2, email: 'jane@example.com', name: 'Jane Smith', created_at: '2024-01-16 14:20:00' },
        { id: 3, email: 'bob@example.com', name: 'Bob Johnson', created_at: '2024-01-17 09:15:00' }
      ];
      
      setQueryResult(sampleData);
    } catch (error) {
      console.error('Query failed:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const ConnectionForm = () => {
    const [formData, setFormData] = useState({
      name: '',
      type: 'sqlite' as const,
      host: 'localhost',
      port: 5432,
      database: '',
      username: ''
    });

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-6 w-96">
          <h3 className="text-lg font-semibold mb-4">Add Database Connection</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Connection Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-sm"
                placeholder="My Database"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Database Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-sm"
              >
                <option value="sqlite">SQLite</option>
                <option value="mysql">MySQL</option>
                <option value="postgresql">PostgreSQL</option>
              </select>
            </div>

            {formData.type !== 'sqlite' && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">Host</label>
                    <input
                      type="text"
                      value={formData.host}
                      onChange={(e) => setFormData({...formData, host: e.target.value})}
                      className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Port</label>
                    <input
                      type="number"
                      value={formData.port}
                      onChange={(e) => setFormData({...formData, port: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-sm"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Database</label>
              <input
                type="text"
                value={formData.database}
                onChange={(e) => setFormData({...formData, database: e.target.value})}
                className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-sm"
                placeholder={formData.type === 'sqlite' ? 'database.db' : 'database_name'}
              />
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <button
              onClick={() => setShowAddConnection(false)}
              className="flex-1 px-4 py-2 border border-[var(--color-border)] rounded hover:bg-[var(--color-hover)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => addConnection(formData)}
              className="flex-1 px-4 py-2 bg-[var(--color-primary)] text-white rounded hover:opacity-80 transition-opacity"
            >
              Add Connection
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-[var(--color-surface)]">
      {/* Header */}
      <div className="px-3 py-2 border-b border-[var(--color-border)]">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">🗄️ {t('activity.database')}</h2>
        
        <button
          onClick={() => setShowAddConnection(true)}
          className="w-full px-3 py-2 bg-[var(--color-primary)] text-white rounded text-sm hover:opacity-80 transition-opacity"
        >
          ➕ {t('database.addConnection')}
        </button>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar - Connections & Tables */}
        <div className="w-64 border-r border-[var(--color-border)] flex flex-col">
          {/* Connections */}
          <div className="p-3 border-b border-[var(--color-border)]">
            <h3 className="text-sm font-semibold mb-2">{t('database.connections')}</h3>
            <div className="space-y-1">
              {connections.map(conn => (
                <div
                  key={conn.id}
                  className={`p-2 rounded cursor-pointer transition-colors ${
                    activeConnection === conn.id
                      ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]'
                      : 'hover:bg-[var(--color-hover)]'
                  }`}
                  onClick={() => connectToDatabase(conn.id)}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${conn.isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                    <span className="text-sm font-medium">{conn.name}</span>
                  </div>
                  <div className="text-xs text-[var(--color-textSecondary)] ml-4">
                    {conn.type.toUpperCase()} • {conn.database}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tables */}
          {activeConnection && (
            <div className="flex-1 p-3">
              <h3 className="text-sm font-semibold mb-2">{t('database.tables')}</h3>
              <div className="space-y-1">
                {tables.map(table => (
                  <div
                    key={table.name}
                    className={`p-2 rounded cursor-pointer transition-colors ${
                      selectedTable === table.name
                        ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]'
                        : 'hover:bg-[var(--color-hover)]'
                    }`}
                    onClick={() => setSelectedTable(table.name)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm">📋 {table.name}</span>
                      <span className="text-xs text-[var(--color-textSecondary)]">{table.rowCount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {activeConnection ? (
            <>
              {/* Query Editor */}
              <div className="p-3 border-b border-[var(--color-border)]">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold">{t('database.sqlQuery')}</h3>
                  <button
                    onClick={executeQuery}
                    disabled={isExecuting}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:opacity-80 transition-opacity disabled:opacity-50"
                  >
                    {isExecuting ? `⏳ ${t('database.running')}` : `▶️ ${t('database.execute')}`}
                  </button>
                </div>
                <textarea
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  className="w-full h-24 px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-sm font-mono resize-none"
                  placeholder="Enter your SQL query here..."
                />
              </div>

              {/* Results */}
              <div className="flex-1 p-3 overflow-auto">
                {queryResult.length > 0 ? (
                  <div className="border border-[var(--color-border)] rounded">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-[var(--color-background)]">
                            {Object.keys(queryResult[0]).map(key => (
                              <th key={key} className="px-3 py-2 text-left border-b border-[var(--color-border)]">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {queryResult.map((row, index) => (
                            <tr key={index} className="hover:bg-[var(--color-hover)]">
                              {Object.values(row).map((value, cellIndex) => (
                                <td key={cellIndex} className="px-3 py-2 border-b border-[var(--color-border)]">
                                  {String(value)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-[var(--color-textSecondary)]">
                    <div className="text-4xl mb-4">📊</div>
                    <p>Execute a query to see results</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[var(--color-textSecondary)]">
              <div className="text-center">
                <div className="text-4xl mb-4">🗄️</div>
                <p className="mb-2">{t('database.noConnection')}</p>
                <p className="text-sm">{t('database.addConnectionDesc')}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showAddConnection && <ConnectionForm />}
    </div>
  );
}