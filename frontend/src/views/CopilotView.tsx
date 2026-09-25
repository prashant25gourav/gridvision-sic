import { useState, useRef } from 'react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { mockCopilotInitialMessages } from '../mock/mockData';
import type { CopilotMessage } from '../types/energy';

export function CopilotView() {
  const [messages, setMessages] = useState<CopilotMessage[]>(mockCopilotInitialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const promptSuggestions = [
    'Explain the evening peak spike in Cluster 0',
    'Which households demonstrate the highest behavioral volatility?',
    'Summarize aggregate load differences vs baseline',
    'What factors typically trigger cluster migration in residential meters?',
  ];

  const nextIdRef = useRef(1);

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputValue.trim();
    if (!text) return;

    const currentId = nextIdRef.current++;
    const userMessage: CopilotMessage = {
      id: `usr-${currentId}`,
      sender: 'user',
      timestamp: 'Just now',
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInputValue('');
    setIsTyping(true);

    // Simulate smart AI response tailored to GridVision domain
    setTimeout(() => {
      let responseContent = '';
      const lower = text.toLowerCase();

      if (lower.includes('peak') || lower.includes('cluster 0')) {
        responseContent = `### Evening Peak Analysis (Cluster 0)
**Cluster 0 (Evening Peakers)** represents **38.0%** of monitored meters (2,115 households). 

Key telemetry indicators:
- **Observed Peak Window:** 18:00 – 21:30 UTC
- **Peak Amplitude:** 960 kW (vs 910 kW baseline, +5.5% deviation)
- **Primary Driver:** Simultaneous residential arrival, cooking, appliance activation, and entertainment loads.
- **Grid Risk:** Feeder loading approaches 88% capacity during 19:00 UTC. Recommended action is demand response incentive signaling for dynamic tariff participants.`;
      } else if (lower.includes('volatili') || lower.includes('drift') || lower.includes('household')) {
        responseContent = `### Behavioral Volatility Summary
Based on the latest observation window comparison (Window T vs T-1):

1. **MAC000045 (Cluster 1 \u2192 Cluster 3)**:
   - Stability Index: **0.65** (Flagged Shift)
   - Profile change: Sudden introduction of high nocturnal consumption (23:00 – 03:00 UTC, averaging 2.3 kW). Highly indicative of newly installed Level-2 EV charging or storage heating.
2. **MAC000234 (Cluster 0)**:
   - Stability Index: **0.72**
   - Shows elevated peak volatility (+18% evening amplitude variance) without full cluster migration.`;
      } else if (lower.includes('baseline') || lower.includes('aggregate')) {
        responseContent = `### Aggregate Grid Demand vs 24h Baseline
- **Current Active Demand:** 842.6 kW
- **Baseline Expectation:** 814.8 kW
- **Net Deviation:** +27.8 kW (+3.4%)
- **Daytime Valley:** 230 kW recorded at 03:00 UTC
- **System Stability:** Overall behavioral stability stands at **0.84**, reflecting predictable aggregate load adherence across 74% of monitored meters.`;
      } else {
        responseContent = `### Telemetry Insights for: "${text}"
GridVision analyzes smart meter load curves across 4 behavioral archetypes:
- **Base Load Stability:** 26% of consumers maintain steady 24h consumption (avg 8.4 kWh/day).
- **Peak Concentration:** 38% concentrate energy demand in the evening band.
- **Methodological Flexibility:** As researchers finalize cluster alignment (e.g. Hungarian algorithm) and forecasting error thresholds, these analytical answers will be augmented with live retrieval over actual grid dispatch logs.`;
      }

      const assistantId = nextIdRef.current++;
      const assistantMessage: CopilotMessage = {
        id: `ast-${assistantId}`,
        sender: 'assistant',
        timestamp: 'Just now',
        content: responseContent,
        suggestions: [
          'What is the tariff breakdown for Cluster 0?',
          'How can demand response flatten the 19:00 peak?',
        ],
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 700);
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-highlight)' }}>
          GridVision AI Copilot
        </h1>
        <p style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Conversational intelligence assistant for grid operators, energy analysts, and researchers to query smart meter telemetry and behavioral trajectories.
        </p>
      </div>

      <div className="dashboard-split-grid">
        {/* Left Column: Chat Conversation */}
        <Card
          title="Interactive Energy Intelligence Dialogue"
          subtitle="Simulated copilot agent interface with telemetry context"
          action={<Badge variant="cyan" dot>Copilot Ready</Badge>}
        >
          {/* Messages Stream */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              minHeight: '380px',
              maxHeight: '520px',
              overflowY: 'auto',
              paddingRight: '0.5rem',
              marginBottom: '1rem',
            }}
          >
            {messages.map((msg) => {
              const isAssistant = msg.sender === 'assistant';
              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isAssistant ? 'flex-start' : 'flex-end',
                    maxWidth: '88%',
                    alignSelf: isAssistant ? 'flex-start' : 'flex-end',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.25rem',
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <span>{isAssistant ? 'GridVision AI' : 'You'}</span>
                    <span>&bull;</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <div
                    style={{
                      padding: '0.85rem 1.15rem',
                      borderRadius: isAssistant
                        ? '4px 16px 16px 16px'
                        : '16px 4px 16px 16px',
                      backgroundColor: isAssistant
                        ? 'rgba(255, 255, 255, 0.05)'
                        : 'linear-gradient(135deg, #0284c7, #0369a1)',
                      background: isAssistant
                        ? 'rgba(255, 255, 255, 0.05)'
                        : 'linear-gradient(135deg, #0284c7, #0369a1)',
                      border: `1px solid ${isAssistant ? 'var(--border-subtle)' : 'transparent'}`,
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem',
                      lineHeight: 1.6,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {msg.content}
                  </div>

                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.4rem',
                        marginTop: '0.5rem',
                      }}
                    >
                      {msg.suggestions.map((sug) => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => handleSendMessage(sug)}
                          style={{
                            padding: '0.25rem 0.6rem',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: 'rgba(6, 182, 212, 0.08)',
                            border: '1px solid var(--border-glow-cyan)',
                            color: 'var(--accent-cyan)',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            transition: 'all var(--transition-fast)',
                          }}
                        >
                          &rarr; {sug}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {isTyping && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                <span className="status-dot-pulse" />
                <span>GridVision Copilot is analyzing telemetry...</span>
              </div>
            )}
          </div>

          {/* Quick Prompt Chips */}
          <div style={{ marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
              Suggested Inquiries:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {promptSuggestions.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  style={{
                    padding: '0.3rem 0.65rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            style={{ display: 'flex', gap: '0.5rem' }}
          >
            <input
              type="text"
              className="text-input"
              placeholder="Ask GridVision Copilot about telemetry, demand peaks, or cluster drift..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!inputValue.trim()}
              style={{ opacity: inputValue.trim() ? 1 : 0.5 }}
            >
              Send
            </button>
          </form>
        </Card>

        {/* Right Column: Active Telemetry Context & Decoupling Guard */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Card title="Copilot Telemetry Context" subtitle="Active parameters provided to intelligence agent">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.825rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>System Active Demand:</span>
                <span style={{ fontWeight: 600, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>842.6 kW</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Behavioral Stability Index:</span>
                <span style={{ fontWeight: 600, color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>0.84</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Peak Load Window:</span>
                <span style={{ fontWeight: 600, color: 'var(--accent-amber)', fontFamily: 'var(--font-mono)' }}>18:00 – 21:30 UTC</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Cluster Segmentation:</span>
                <span style={{ color: 'var(--text-highlight)' }}>4 Archetypes</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Analyzed Sample:</span>
                <span style={{ color: 'var(--text-highlight)' }}>5,567 Smart Meters</span>
              </div>
            </div>
          </Card>

          <Card title="RAG &amp; Tool Contracts Guard" subtitle="Safeguarding future research specifications" glow="cyan">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.825rem' }}>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                This Copilot view serves as an interactive demonstration of how generative intelligence interfaces with smart meter telemetry.
              </p>

              <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(6, 182, 212, 0.08)', border: '1px solid var(--border-glow-cyan)' }}>
                <strong style={{ color: 'var(--accent-cyan)' }}>Pending Specifications:</strong>
                <ul style={{ margin: '0.4rem 0 0 1.25rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <li>RAG vector retrieval contracts &amp; chunking strategy</li>
                  <li>Copilot function-calling tools schema</li>
                  <li>Live LLM backend integration (FastAPI streaming endpoint)</li>
                </ul>
              </div>

              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                By keeping tool contracts uncommitted, the backend and frontend remain flexible for the finalized methodology.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
