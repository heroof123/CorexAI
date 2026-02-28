import { useState, useEffect } from 'react';
// import { invoke } from '@tauri-apps/api/core';

interface DeveloperToolsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DeveloperTools({ isOpen, onClose }: DeveloperToolsProps) {
  const [activeTab, setActiveTab] = useState('json');
  
  // JSON/XML Formatter
  const [jsonInput, setJsonInput] = useState('');
  const [jsonOutput, setJsonOutput] = useState('');
  const [jsonError, setJsonError] = useState('');

  // Base64 Encoder/Decoder
  const [base64Input, setBase64Input] = useState('');
  const [base64Output, setBase64Output] = useState('');
  const [base64Mode, setBase64Mode] = useState<'encode' | 'decode'>('encode');

  // Color Picker
  const [selectedColor, setSelectedColor] = useState('#3b82f6');
  const [colorFormats, setColorFormats] = useState({
    hex: '#3b82f6',
    rgb: 'rgb(59, 130, 246)',
    hsl: 'hsl(217, 91%, 60%)',
    rgba: 'rgba(59, 130, 246, 1)'
  });

  // Regex Tester
  const [regexPattern, setRegexPattern] = useState('');
  const [regexText, setRegexText] = useState('');
  const [regexFlags, setRegexFlags] = useState('g');
  const [regexMatches, setRegexMatches] = useState<string[]>([]);
  const [regexError, setRegexError] = useState('');

  // Hash Generator
  const [hashInput, setHashInput] = useState('');
  const [hashResults, setHashResults] = useState({
    md5: '',
    sha1: '',
    sha256: '',
    sha512: ''
  });

  // ESC tuşu ile kapatma
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // JSON/XML Formatter Functions
  const formatJson = () => {
    try {
      setJsonError('');
      const parsed = JSON.parse(jsonInput);
      setJsonOutput(JSON.stringify(parsed, null, 2));
    } catch (error) {
      setJsonError(`JSON Hatası: ${error}`);
      setJsonOutput('');
    }
  };

  const minifyJson = () => {
    try {
      setJsonError('');
      const parsed = JSON.parse(jsonInput);
      setJsonOutput(JSON.stringify(parsed));
    } catch (error) {
      setJsonError(`JSON Hatası: ${error}`);
      setJsonOutput('');
    }
  };

  const formatXml = () => {
    try {
      setJsonError('');
      // Basit XML formatter
      const formatted = jsonInput
        .replace(/></g, '>\n<')
        .replace(/^\s*\n/gm, '')
        .split('\n')
        .map((line, index) => {
          const indent = '  '.repeat(Math.max(0, 
            line.match(/^<[^\/]/g) ? index : 
            line.match(/^<\//g) ? index - 1 : index
          ));
          return indent + line.trim();
        })
        .join('\n');
      setJsonOutput(formatted);
    } catch (error) {
      setJsonError(`XML Hatası: ${error}`);
    }
  };

  // Base64 Functions
  const processBase64 = () => {
    try {
      if (base64Mode === 'encode') {
        setBase64Output(btoa(base64Input));
      } else {
        setBase64Output(atob(base64Input));
      }
    } catch (error) {
      setBase64Output(`Hata: ${error}`);
    }
  };

  // Color Functions
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  };

  const updateColorFormats = (hex: string) => {
    const rgb = hexToRgb(hex);
    if (rgb) {
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      setColorFormats({
        hex: hex,
        rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
        hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
        rgba: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`
      });
    }
  };

  // Regex Functions
  const testRegex = () => {
    try {
      setRegexError('');
      const regex = new RegExp(regexPattern, regexFlags);
      const matches = regexText.match(regex) || [];
      setRegexMatches(matches);
    } catch (error) {
      setRegexError(`Regex Hatası: ${error}`);
      setRegexMatches([]);
    }
  };

  // Hash Functions
  const generateHashes = async () => {
    try {
      // Tauri backend'de hash fonksiyonları implement edilmeli
      // Şimdilik browser crypto API kullanıyoruz
      const encoder = new TextEncoder();
      const data = encoder.encode(hashInput);
      
      // SHA-256
      const sha256Buffer = await crypto.subtle.digest('SHA-256', data);
      const sha256Array = Array.from(new Uint8Array(sha256Buffer));
      const sha256Hex = sha256Array.map(b => b.toString(16).padStart(2, '0')).join('');
      
      // SHA-1
      const sha1Buffer = await crypto.subtle.digest('SHA-1', data);
      const sha1Array = Array.from(new Uint8Array(sha1Buffer));
      const sha1Hex = sha1Array.map(b => b.toString(16).padStart(2, '0')).join('');

      setHashResults({
        md5: 'MD5 requires backend implementation',
        sha1: sha1Hex,
        sha256: sha256Hex,
        sha512: 'SHA-512 requires backend implementation'
      });
    } catch (error) {
      console.error('Hash generation error:', error);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'json', name: 'JSON/XML', icon: '📄' },
    { id: 'base64', name: 'Base64', icon: '🔐' },
    { id: 'color', name: 'Color Picker', icon: '🎨' },
    { id: 'regex', name: 'Regex Tester', icon: '🔍' },
    { id: 'hash', name: 'Hash Generator', icon: '🔒' }
  ];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="h-12 bg-[var(--color-background)] border-b border-[var(--color-border)] flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔧</span>
              <h3 className="text-sm font-semibold text-[var(--color-text)]">Developer Tools</h3>
            </div>
            
            <button
              onClick={onClose}
              className="w-6 h-6 flex items-center justify-center text-[var(--color-textSecondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover)] rounded transition-colors"
              title="Close (ESC)"
            >
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-[var(--color-border)] bg-[var(--color-background)]">
            <div className="flex">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                      : 'border-transparent text-[var(--color-textSecondary)] hover:text-[var(--color-text)]'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
            {/* JSON/XML Formatter */}
            {activeTab === 'json' && (
              <div className="space-y-4">
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={formatJson}
                    className="px-3 py-2 bg-[var(--color-primary)] text-white rounded hover:opacity-80 transition-opacity"
                  >
                    Format JSON
                  </button>
                  <button
                    onClick={minifyJson}
                    className="px-3 py-2 bg-[var(--color-secondary)] text-white rounded hover:opacity-80 transition-opacity"
                  >
                    Minify JSON
                  </button>
                  <button
                    onClick={formatXml}
                    className="px-3 py-2 bg-green-600 text-white rounded hover:opacity-80 transition-opacity"
                  >
                    Format XML
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Input:</label>
                    <textarea
                      value={jsonInput}
                      onChange={(e) => setJsonInput(e.target.value)}
                      className="w-full h-64 p-3 bg-[var(--color-background)] border border-[var(--color-border)] rounded font-mono text-sm"
                      placeholder="Paste your JSON or XML here..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Output:</label>
                    <textarea
                      value={jsonOutput}
                      readOnly
                      className="w-full h-64 p-3 bg-[var(--color-background)] border border-[var(--color-border)] rounded font-mono text-sm"
                      placeholder="Formatted output will appear here..."
                    />
                  </div>
                </div>
                
                {jsonError && (
                  <div className="p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
                    {jsonError}
                  </div>
                )}
              </div>
            )}

            {/* Base64 Encoder/Decoder */}
            {activeTab === 'base64' && (
              <div className="space-y-4">
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setBase64Mode('encode')}
                    className={`px-3 py-2 rounded transition-colors ${
                      base64Mode === 'encode'
                        ? 'bg-[var(--color-primary)] text-white'
                        : 'bg-[var(--color-background)] border border-[var(--color-border)]'
                    }`}
                  >
                    Encode
                  </button>
                  <button
                    onClick={() => setBase64Mode('decode')}
                    className={`px-3 py-2 rounded transition-colors ${
                      base64Mode === 'decode'
                        ? 'bg-[var(--color-primary)] text-white'
                        : 'bg-[var(--color-background)] border border-[var(--color-border)]'
                    }`}
                  >
                    Decode
                  </button>
                  <button
                    onClick={processBase64}
                    className="px-3 py-2 bg-green-600 text-white rounded hover:opacity-80 transition-opacity"
                  >
                    Process
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {base64Mode === 'encode' ? 'Text to Encode:' : 'Base64 to Decode:'}
                    </label>
                    <textarea
                      value={base64Input}
                      onChange={(e) => setBase64Input(e.target.value)}
                      className="w-full h-32 p-3 bg-[var(--color-background)] border border-[var(--color-border)] rounded font-mono text-sm"
                      placeholder={base64Mode === 'encode' ? 'Enter text to encode...' : 'Enter Base64 to decode...'}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Result:</label>
                    <textarea
                      value={base64Output}
                      readOnly
                      className="w-full h-32 p-3 bg-[var(--color-background)] border border-[var(--color-border)] rounded font-mono text-sm"
                      placeholder="Result will appear here..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Color Picker */}
            {activeTab === 'color' && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center">
                    <label className="block text-sm font-medium mb-2">Color Picker:</label>
                    <input
                      type="color"
                      value={selectedColor}
                      onChange={(e) => {
                        setSelectedColor(e.target.value);
                        updateColorFormats(e.target.value);
                      }}
                      className="w-20 h-20 border border-[var(--color-border)] rounded cursor-pointer"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">HEX:</label>
                        <input
                          type="text"
                          value={colorFormats.hex}
                          onChange={(e) => {
                            setSelectedColor(e.target.value);
                            updateColorFormats(e.target.value);
                          }}
                          className="w-full p-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded font-mono text-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">RGB:</label>
                        <input
                          type="text"
                          value={colorFormats.rgb}
                          readOnly
                          className="w-full p-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded font-mono text-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">HSL:</label>
                        <input
                          type="text"
                          value={colorFormats.hsl}
                          readOnly
                          className="w-full p-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded font-mono text-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">RGBA:</label>
                        <input
                          type="text"
                          value={colorFormats.rgba}
                          readOnly
                          className="w-full p-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded font-mono text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 rounded border border-[var(--color-border)]" style={{ backgroundColor: selectedColor }}>
                  <p className="text-white text-center font-medium">Color Preview</p>
                </div>
              </div>
            )}

            {/* Regex Tester */}
            {activeTab === 'regex' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-2">Regex Pattern:</label>
                    <input
                      type="text"
                      value={regexPattern}
                      onChange={(e) => setRegexPattern(e.target.value)}
                      className="w-full p-3 bg-[var(--color-background)] border border-[var(--color-border)] rounded font-mono text-sm"
                      placeholder="Enter regex pattern..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Flags:</label>
                    <input
                      type="text"
                      value={regexFlags}
                      onChange={(e) => setRegexFlags(e.target.value)}
                      className="w-full p-3 bg-[var(--color-background)] border border-[var(--color-border)] rounded font-mono text-sm"
                      placeholder="g, i, m..."
                    />
                  </div>
                </div>
                
                <button
                  onClick={testRegex}
                  className="px-4 py-2 bg-[var(--color-primary)] text-white rounded hover:opacity-80 transition-opacity"
                >
                  Test Regex
                </button>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Test Text:</label>
                  <textarea
                    value={regexText}
                    onChange={(e) => setRegexText(e.target.value)}
                    className="w-full h-32 p-3 bg-[var(--color-background)] border border-[var(--color-border)] rounded font-mono text-sm"
                    placeholder="Enter text to test against regex..."
                  />
                </div>
                
                {regexError && (
                  <div className="p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
                    {regexError}
                  </div>
                )}
                
                {regexMatches.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Matches ({regexMatches.length}):</label>
                    <div className="space-y-2">
                      {regexMatches.map((match, index) => (
                        <div key={index} className="p-2 bg-green-100 border border-green-300 rounded font-mono text-sm">
                          {match}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Hash Generator */}
            {activeTab === 'hash' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Input Text:</label>
                  <textarea
                    value={hashInput}
                    onChange={(e) => setHashInput(e.target.value)}
                    className="w-full h-32 p-3 bg-[var(--color-background)] border border-[var(--color-border)] rounded font-mono text-sm"
                    placeholder="Enter text to generate hashes..."
                  />
                </div>
                
                <button
                  onClick={generateHashes}
                  className="px-4 py-2 bg-[var(--color-primary)] text-white rounded hover:opacity-80 transition-opacity"
                >
                  Generate Hashes
                </button>
                
                <div className="space-y-3">
                  {Object.entries(hashResults).map(([algorithm, hash]) => (
                    <div key={algorithm}>
                      <label className="block text-sm font-medium mb-1">{algorithm.toUpperCase()}:</label>
                      <input
                        type="text"
                        value={hash}
                        readOnly
                        className="w-full p-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded font-mono text-xs"
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
