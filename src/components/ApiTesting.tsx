import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface ApiRequest {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers: Record<string, string>;
  body: string;
  createdAt: number;
}

interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  duration: number;
}

export default function ApiTesting() {
  const { t } = useLanguage();
  const [requests, setRequests] = useState<ApiRequest[]>([]);
  const [activeRequest, setActiveRequest] = useState<ApiRequest | null>(null);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body'>('params');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = () => {
    const saved = localStorage.getItem('api_requests');
    if (saved) {
      const parsed = JSON.parse(saved);
      setRequests(parsed);
      if (parsed.length > 0) {
        setActiveRequest(parsed[0]);
      }
    } else {
      // Create default request
      const defaultRequest: ApiRequest = {
        id: '1',
        name: 'Sample GET Request',
        method: 'GET',
        url: 'https://jsonplaceholder.typicode.com/posts/1',
        headers: {
          'Content-Type': 'application/json'
        },
        body: '',
        createdAt: Date.now()
      };
      setRequests([defaultRequest]);
      setActiveRequest(defaultRequest);
    }
  };

  const saveRequests = (reqs: ApiRequest[]) => {
    setRequests(reqs);
    localStorage.setItem('api_requests', JSON.stringify(reqs));
  };

  const createNewRequest = () => {
    const newRequest: ApiRequest = {
      id: Date.now().toString(),
      name: 'New Request',
      method: 'GET',
      url: 'https://api.example.com',
      headers: {
        'Content-Type': 'application/json'
      },
      body: '',
      createdAt: Date.now()
    };
    
    const updated = [...requests, newRequest];
    saveRequests(updated);
    setActiveRequest(newRequest);
  };

  const updateActiveRequest = (updates: Partial<ApiRequest>) => {
    if (!activeRequest) return;
    
    const updated = { ...activeRequest, ...updates };
    setActiveRequest(updated);
    
    const requestIndex = requests.findIndex(r => r.id === activeRequest.id);
    if (requestIndex !== -1) {
      const updatedRequests = [...requests];
      updatedRequests[requestIndex] = updated;
      saveRequests(updatedRequests);
    }
  };

  const deleteRequest = (id: string) => {
    const updated = requests.filter(r => r.id !== id);
    saveRequests(updated);
    
    if (activeRequest?.id === id) {
      setActiveRequest(updated.length > 0 ? updated[0] : null);
    }
  };

  const sendRequest = async () => {
    if (!activeRequest) return;
    
    setIsLoading(true);
    const startTime = Date.now();
    
    try {
      // Simulate API request
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock response based on URL
      let mockResponse: ApiResponse;
      
      if (activeRequest.url.includes('jsonplaceholder')) {
        mockResponse = {
          status: 200,
          statusText: 'OK',
          headers: {
            'content-type': 'application/json; charset=utf-8',
            'cache-control': 'max-age=43200'
          },
          body: JSON.stringify({
            userId: 1,
            id: 1,
            title: "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
            body: "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto"
          }, null, 2),
          duration: Date.now() - startTime
        };
      } else {
        mockResponse = {
          status: 404,
          statusText: 'Not Found',
          headers: {
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            error: 'Endpoint not found',
            message: 'This is a mock response for demo purposes'
          }, null, 2),
          duration: Date.now() - startTime
        };
      }
      
      setResponse(mockResponse);
    } catch (error) {
      setResponse({
        status: 0,
        statusText: 'Network Error',
        headers: {},
        body: `Error: ${error}`,
        duration: Date.now() - startTime
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addHeader = () => {
    if (!activeRequest) return;
    updateActiveRequest({
      headers: {
        ...activeRequest.headers,
        'New-Header': 'value'
      }
    });
  };

  const updateHeader = (oldKey: string, newKey: string, value: string) => {
    if (!activeRequest) return;
    const newHeaders = { ...activeRequest.headers };
    delete newHeaders[oldKey];
    newHeaders[newKey] = value;
    updateActiveRequest({ headers: newHeaders });
  };

  const removeHeader = (key: string) => {
    if (!activeRequest) return;
    const newHeaders = { ...activeRequest.headers };
    delete newHeaders[key];
    updateActiveRequest({ headers: newHeaders });
  };

  return (
    <div className="h-full flex flex-col bg-[var(--color-surface)]">
      {/* Header */}
      <div className="px-3 py-2 border-b border-[var(--color-border)]">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">🌐 {t('activity.apiTesting')}</h2>
        
        <button
          onClick={createNewRequest}
          className="w-full px-3 py-2 bg-[var(--color-primary)] text-white rounded text-sm hover:opacity-80 transition-opacity"
        >
          ➕ {t('api.newRequest')}
        </button>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar - Request List */}
        <div className="w-64 border-r border-[var(--color-border)] overflow-y-auto">
          <div className="p-3">
            <h3 className="text-sm font-semibold mb-2">{t('api.requests')}</h3>
            <div className="space-y-1">
              {requests.map(request => (
                <div
                  key={request.id}
                  className={`p-2 rounded cursor-pointer transition-colors ${
                    activeRequest?.id === request.id
                      ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]'
                      : 'hover:bg-[var(--color-hover)]'
                  }`}
                  onClick={() => setActiveRequest(request)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 text-xs rounded font-mono ${
                        request.method === 'GET' ? 'bg-green-600 text-white' :
                        request.method === 'POST' ? 'bg-blue-600 text-white' :
                        request.method === 'PUT' ? 'bg-orange-600 text-white' :
                        request.method === 'DELETE' ? 'bg-red-600 text-white' :
                        'bg-gray-600 text-white'
                      }`}>
                        {request.method}
                      </span>
                      <span className="text-sm font-medium truncate">{request.name}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteRequest(request.id);
                      }}
                      className="p-1 hover:bg-red-500/20 rounded text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="text-xs text-[var(--color-textSecondary)] mt-1 truncate">
                    {request.url}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {activeRequest ? (
            <>
              {/* Request Configuration */}
              <div className="p-4 border-b border-[var(--color-border)]">
                {/* Request Name */}
                <input
                  type="text"
                  value={activeRequest.name}
                  onChange={(e) => updateActiveRequest({ name: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-sm font-medium mb-3"
                />

                {/* Method and URL */}
                <div className="flex gap-2 mb-4">
                  <select
                    value={activeRequest.method}
                    onChange={(e) => updateActiveRequest({ method: e.target.value as any })}
                    className="px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-sm font-mono"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                  </select>
                  <input
                    type="text"
                    value={activeRequest.url}
                    onChange={(e) => updateActiveRequest({ url: e.target.value })}
                    className="flex-1 px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-sm font-mono"
                    placeholder="https://api.example.com/endpoint"
                  />
                  <button
                    onClick={sendRequest}
                    disabled={isLoading}
                    className="px-6 py-2 bg-green-600 text-white rounded text-sm hover:opacity-80 transition-opacity disabled:opacity-50"
                  >
                    {isLoading ? `⏳ ${t('api.sending')}` : `📤 ${t('api.send')}`}
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-[var(--color-border)]">
                  {(['params', 'headers', 'body'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 text-sm capitalize transition-colors ${
                        activeTab === tab
                          ? 'border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]'
                          : 'text-[var(--color-textSecondary)] hover:text-[var(--color-text)]'
                      }`}
                    >
                      {tab === 'params' ? t('api.params') : 
                       tab === 'headers' ? t('api.headers') : 
                       t('api.body')}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="mt-4">
                  {activeTab === 'headers' && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-medium">Headers</h4>
                        <button
                          onClick={addHeader}
                          className="px-2 py-1 bg-[var(--color-primary)] text-white rounded text-xs hover:opacity-80"
                        >
                          Add Header
                        </button>
                      </div>
                      {Object.entries(activeRequest.headers).map(([key, value]) => (
                        <div key={key} className="flex gap-2">
                          <input
                            type="text"
                            value={key}
                            onChange={(e) => updateHeader(key, e.target.value, value)}
                            className="flex-1 px-2 py-1 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-sm"
                            placeholder="Header name"
                          />
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => updateHeader(key, key, e.target.value)}
                            className="flex-1 px-2 py-1 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-sm"
                            placeholder="Header value"
                          />
                          <button
                            onClick={() => removeHeader(key)}
                            className="px-2 py-1 text-red-500 hover:bg-red-500/20 rounded"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'body' && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Request Body</h4>
                      <textarea
                        value={activeRequest.body}
                        onChange={(e) => updateActiveRequest({ body: e.target.value })}
                        className="w-full h-32 px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-sm font-mono resize-none"
                        placeholder="Request body (JSON, XML, etc.)"
                      />
                    </div>
                  )}

                  {activeTab === 'params' && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Query Parameters</h4>
                      <p className="text-sm text-[var(--color-textSecondary)]">
                        Add query parameters directly to the URL above
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Response */}
              <div className="flex-1 p-4 overflow-auto">
                {response ? (
                  <div>
                    <div className="flex items-center gap-4 mb-4">
                      <h3 className="text-lg font-semibold">Response</h3>
                      <span className={`px-2 py-1 rounded text-sm font-mono ${
                        response.status >= 200 && response.status < 300 ? 'bg-green-600 text-white' :
                        response.status >= 400 ? 'bg-red-600 text-white' :
                        'bg-yellow-600 text-white'
                      }`}>
                        {response.status} {response.statusText}
                      </span>
                      <span className="text-sm text-[var(--color-textSecondary)]">
                        {response.duration}ms
                      </span>
                    </div>

                    {/* Response Headers */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">Headers</h4>
                      <div className="bg-[var(--color-background)] border border-[var(--color-border)] rounded p-3">
                        {Object.entries(response.headers).map(([key, value]) => (
                          <div key={key} className="flex text-sm font-mono">
                            <span className="text-[var(--color-primary)] w-48">{key}:</span>
                            <span>{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Response Body */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Body</h4>
                      <div className="bg-[var(--color-background)] border border-[var(--color-border)] rounded p-3">
                        <pre className="text-sm font-mono whitespace-pre-wrap overflow-auto">
                          {response.body}
                        </pre>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-[var(--color-textSecondary)]">
                    <div className="text-center">
                      <div className="text-4xl mb-4">📡</div>
                      <p className="mb-2">{t('api.noResponse')}</p>
                      <p className="text-sm">{t('api.sendRequest')}</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[var(--color-textSecondary)]">
              <div className="text-center">
                <div className="text-4xl mb-4">🌐</div>
                <p className="mb-2">No request selected</p>
                <p className="text-sm">Create a new request to get started</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
