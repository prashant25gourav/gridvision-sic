import React, { useState, useRef, useEffect } from 'react';
import { Send, ArrowRight, Sparkles, CheckCircle2, Bot } from 'lucide-react';
import { sendChatMessage, fetchHouseholds, type HouseholdSummary, type ToolCall } from '../../../services/api';
import './Workspaces.css';

interface ExtendedCopilotMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  content: string;
  grounded?: boolean;
  toolCalls?: ToolCall[];
  debug?: Record<string, any>;
}

interface CopilotWorkspaceProps {
  onNavigateOverview?: (anchor?: string) => void;
}

// Clean consumer formatting helper (e.g. "MAC000023" -> "Consumer 023")
function formatConsumerId(rawId: string): string {
  if (!rawId) return '';
  const match = rawId.match(/MAC0*(\d+)/i);
  if (match) {
    return `Consumer ${match[1].padStart(3, '0')}`;
  }
  return `Consumer ${rawId}`;
}

export const CopilotWorkspace: React.FC<CopilotWorkspaceProps> = ({
  onNavigateOverview,
}) => {
  const [messages, setMessages] = useState<ExtendedCopilotMessage[]>([
    {
      id: 'initial-1',
      sender: 'assistant',
      timestamp: 'Ready',
      content:
        'Ask about demand, forecasts, consumer profiles, anomalies, or behavioral stability.\n\nGridVision uses its analytics and knowledge base to ground answers in the available data.',
      grounded: true,
      toolCalls: [],
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [households, setHouseholds] = useState<HouseholdSummary[]>([]);
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string>('MAC000023');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const nextIdRef = useRef(10);

  useEffect(() => {
    fetchHouseholds()
      .then((data) => {
        if (data.length > 0) {
          setHouseholds(data);
          const found23 = data.find((h) => h.household_id === 'MAC000023');
          if (found23) {
            setSelectedHouseholdId(found23.household_id);
          } else {
            setSelectedHouseholdId(data[0].household_id);
          }
        }
      })
      .catch((e) => console.warn('Could not load household list for Copilot:', e));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputValue.trim();
    if (!text) return;

    const currentId = nextIdRef.current++;
    const userMessage: ExtendedCopilotMessage = {
      id: `usr-${currentId}`,
      sender: 'user',
      timestamp: 'Just now',
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInputValue('');
    setIsTyping(true);

    try {
      const response = await sendChatMessage(text, selectedHouseholdId || undefined);

      const assistantId = nextIdRef.current++;
      const assistantMessage: ExtendedCopilotMessage = {
        id: `ast-${assistantId}`,
        sender: 'assistant',
        timestamp: 'Just now',
        content: response.answer,
        grounded: response.grounded,
        toolCalls: response.tool_calls,
        debug: response.debug,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.warn('Backend chat failed:', err);

      const assistantId = nextIdRef.current++;
      const assistantMessage: ExtendedCopilotMessage = {
        id: `ast-${assistantId}`,
        sender: 'assistant',
        timestamp: 'Just now',
        content:
          'Unable to communicate with the GridVision AI Copilot service at this time. Please verify that the backend API server is running and accessible.',
        grounded: false,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const consumerLabel = formatConsumerId(selectedHouseholdId);

  const domainQueryCategories = [
    {
      category: 'Demand & Forecasts',
      prompts: [
        'When does demand peak across the network?',
        `What is the forecast for ${consumerLabel}?`,
        `When is ${consumerLabel} expected to peak?`,
        `How large is ${consumerLabel}'s forecast error?`,
      ],
    },
    {
      category: 'Consumers & Profiles',
      prompts: [
        `What consumption profile does ${consumerLabel} have?`,
        `What cluster is ${consumerLabel} currently assigned to?`,
        `How stable is ${consumerLabel}'s consumption behavior?`,
        `Has ${consumerLabel} changed behavioral clusters over time?`,
      ],
    },
    {
      category: 'Anomalies',
      prompts: [
        `Is ${consumerLabel} showing an anomaly?`,
        `Why was ${consumerLabel} flagged?`,
        'Which consumers were flagged for unusual consumption?',
      ],
    },
    {
      category: 'Operational Guidance',
      prompts: [
        'What does forecast reliability mean?',
        'What should an operator check after an unusual consumption event?',
        'How does GridVision forecast electricity demand?',
      ],
    },
  ];

  return (
    <div className="workspace-container">
      {/* Workspace Header */}
      <header className="workspace-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="workspace-header-title-row">
              <h1 className="workspace-title">AI Copilot</h1>
            </div>
            <p className="workspace-subtitle">
              Intelligent energy analytics assistant answering questions about demand, forecasts, consumer profiles, and anomalies.
            </p>
          </div>

          {onNavigateOverview && (
            <button
              type="button"
              className="workspace-link-btn"
              onClick={() => onNavigateOverview('overview-copilot')}
              style={{ fontSize: '0.82rem', alignSelf: 'flex-start' }}
              title="Learn how the AI Copilot works on the Overview page"
            >
              <span>Learn about AI Copilot</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </header>

      {/* Main Split Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Chat Area */}
        <div className="workspace-card" style={{ padding: '1.25rem 1.5rem', minHeight: '620px', display: 'flex', flexDirection: 'column' }}>
          {/* Header Strip with Consumer Context */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '0.85rem',
              borderBottom: '1px solid var(--border)',
              marginBottom: '1rem',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <label htmlFor="copilot-hh-select" style={{ fontSize: '0.82rem', color: 'var(--foreground-muted)' }}>
                Consumer:
              </label>
              <select
                id="copilot-hh-select"
                value={selectedHouseholdId}
                onChange={(e) => setSelectedHouseholdId(e.target.value)}
                className="text-input"
                style={{
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.82rem',
                  fontFamily: 'var(--font-mono)',
                  width: 'auto',
                }}
              >
                {households.slice(0, 50).map((h) => (
                  <option key={h.household_id} value={h.household_id}>
                    {formatConsumerId(h.household_id)} ({h.household_id})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--foreground-subtle)', fontSize: '0.78rem' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--accent-emerald)' }} />
              <span>Ready</span>
            </div>
          </div>

          {/* Messages Stream */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.1rem', overflowY: 'auto', maxHeight: '460px', paddingRight: '0.5rem', marginBottom: '1rem' }}>
            {messages.map((msg) => {
              const isAssistant = msg.sender === 'assistant';
              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isAssistant ? 'flex-start' : 'flex-end',
                    maxWidth: '92%',
                    alignSelf: isAssistant ? 'flex-start' : 'flex-end',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', fontSize: '0.75rem', color: 'var(--foreground-subtle)' }}>
                    {isAssistant && <Bot size={13} style={{ color: 'var(--accent-emerald)' }} />}
                    <span style={{ fontWeight: 600 }}>{isAssistant ? 'GridVision Copilot' : 'You'}</span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  {/* Message Bubble */}
                  <div
                    style={{
                      padding: '0.95rem 1.25rem',
                      borderRadius: isAssistant ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
                      backgroundColor: isAssistant ? 'var(--surface-raised)' : 'color-mix(in srgb, var(--accent-emerald) 18%, transparent)',
                      border: `1px solid ${isAssistant ? 'var(--border)' : 'color-mix(in srgb, var(--accent-emerald) 35%, transparent)'}`,
                      color: 'var(--foreground)',
                      fontSize: '0.88rem',
                      lineHeight: 1.6,
                      whiteSpace: 'pre-wrap',
                      boxShadow: isAssistant ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    }}
                  >
                    {msg.content}

                    {/* Grounding & Development Transparency */}
                    {isAssistant && msg.grounded !== undefined && (
                      <div style={{ marginTop: '0.75rem', paddingTop: '0.55rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', color: msg.grounded ? 'var(--accent-emerald)' : 'var(--foreground-subtle)', fontWeight: 600 }}>
                            <CheckCircle2 size={12} />
                            {msg.grounded ? 'Grounded in GridVision data' : 'Domain response'}
                          </span>

                          {msg.toolCalls && msg.toolCalls.length > 0 && (
                            <details style={{ fontSize: '0.72rem', color: 'var(--foreground-subtle)', cursor: 'pointer' }}>
                              <summary style={{ outline: 'none', userSelect: 'none' }}>
                                Trace ({msg.toolCalls.length} tool{msg.toolCalls.length > 1 ? 's' : ''})
                              </summary>
                              <div
                                style={{
                                  marginTop: '0.4rem',
                                  padding: '0.5rem 0.75rem',
                                  backgroundColor: 'var(--surface)',
                                  borderRadius: 'var(--radius-sm)',
                                  border: '1px solid var(--border)',
                                  fontFamily: 'var(--font-mono)',
                                  fontSize: '0.72rem',
                                  whiteSpace: 'pre-wrap',
                                }}
                              >
                                {msg.toolCalls.map((tc, idx) => (
                                  <div key={idx} style={{ marginBottom: '0.25rem' }}>
                                    <strong style={{ color: 'var(--accent-emerald)' }}>{tc.tool}</strong>({JSON.stringify(tc.args)})
                                  </div>
                                ))}
                              </div>
                            </details>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-emerald)', fontSize: '0.82rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-emerald)' }} />
                <span>Consulting GridVision analytics & knowledge base...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div style={{ display: 'flex', gap: '0.65rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <input
              type="text"
              placeholder={`Ask about ${consumerLabel}, forecasts, or demand patterns...`}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
              className="text-input"
              style={{ flex: 1, fontSize: '0.88rem' }}
            />
            <button
              type="button"
              disabled={isTyping || !inputValue.trim()}
              onClick={() => handleSendMessage()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.55rem 1.25rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--foreground)',
                color: 'var(--background)',
                border: 'none',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: isTyping || !inputValue.trim() ? 'not-allowed' : 'pointer',
                opacity: isTyping || !inputValue.trim() ? 0.5 : 1,
                transition: 'opacity 150ms ease',
              }}
            >
              <span>SEND</span>
              <Send size={14} />
            </button>
          </div>
        </div>

        {/* Right Column: Suggested Questions Categorized */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="workspace-card" style={{ padding: '1.25rem' }}>
            <div className="workspace-card-header" style={{ marginBottom: '0.85rem' }}>
              <div>
                <h3 className="workspace-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Sparkles size={16} style={{ color: 'var(--accent-emerald)' }} />
                  <span>Suggested Questions</span>
                </h3>
                <p className="workspace-card-subtitle">
                  Click any query to ask the Copilot directly
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {domainQueryCategories.map((group) => (
                <div key={group.category}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--foreground-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.35rem' }}>
                    {group.category}
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {group.prompts.map((prompt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSendMessage(prompt)}
                        style={{
                          textAlign: 'left',
                          padding: '0.55rem 0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--surface-raised)',
                          border: '1px solid var(--border)',
                          color: 'var(--foreground-muted)',
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          transition: 'all 150ms ease',
                          lineHeight: 1.35,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--foreground)';
                          e.currentTarget.style.borderColor = 'var(--accent-emerald)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--foreground-muted)';
                          e.currentTarget.style.borderColor = 'var(--border)';
                        }}
                      >
                        &rarr; {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
