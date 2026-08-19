import React, { useState } from 'react';
import {
  Bot,
  Clock3,
  Sparkles,
  LayoutDashboard,
  MessageSquare,
  UserRound,
  Send,
  Info,
  Search,
  AlertTriangle,
  Target,
  CheckCircle2,
} from 'lucide-react';
import { clampPct } from '@/lib/formatters';
import { type User } from '@/store/authStore';
import {
  useAiDashboard,
  useAiChat,
  type AiFocus,
  type AiPriority,
  type AiChatResponse,
  type AiSkillArea,
  type AiBlocker,
  type AiRiskPerson,
  type AiStrength,
  type AiRecommendation,
} from '@/hooks/useAiDashboard';
import { useChartColors } from '@/lib/chartColors';
import { hasPermission } from '@/types/rbac';
import { SkillAreaNameFilterSelect } from '@/components/filters/TaxonomyFilterSelects';
import { formatPct } from '@/lib/formatters';
import { InfoTip } from '../layout/InfoTip';
import { TabType } from '../types';

const priorityStyles = (priority: AiPriority, c: ReturnType<typeof useChartColors>) => {
  if (priority === 'critical') return { color: c.danger, bg: 'rgb(var(--danger-soft))', icon: AlertTriangle };
  if (priority === 'warning') return { color: c.warning, bg: 'rgb(var(--warning-soft))', icon: Target };
  if (priority === 'positive') return { color: c.success, bg: 'rgb(var(--success-soft))', icon: CheckCircle2 };
  return { color: c.accent, bg: 'rgb(var(--accent-soft))', icon: Sparkles };
};

const PRIORITY_MEANING: Record<AiPriority, { label: string; meaning: string; action: string }> = {
  critical: {
    label: 'Critical',
    meaning: 'Immediate risk. A person, skill, or team result is far below the needed target and can block readiness.',
    action: 'Assign an owner, review the listed resources, and plan intervention this week.',
  },
  warning: {
    label: 'Warning',
    meaning: 'Needs attention. The gap is meaningful but usually recoverable with focused coaching or training.',
    action: 'Schedule follow-up, track progress, and review again in the next cycle.',
  },
  positive: {
    label: 'Positive',
    meaning: 'Good signal. This area is healthy or improving and can be used as a benchmark for others.',
    action: 'Recognize it, keep it stable, and reuse the learning pattern where helpful.',
  },
  neutral: {
    label: 'Neutral',
    meaning: 'Informational signal. There is no immediate risk, but the item still adds context for planning.',
    action: 'Monitor it and use it to support balanced planning decisions.',
  },
};

type AiChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  response?: AiChatResponse;
};

export interface AIInsightsTabProps {
  user: User | null;
  onNavigate: (t: TabType) => void;
}

export const AIInsightsTab: React.FC<AIInsightsTabProps> = ({ user, onNavigate }) => {
  const c = useChartColors();
  const [focus, setFocus] = useState<AiFocus>('executive');
  const [aiView, setAiView] = useState<'overview' | 'ask'>('overview');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<AiChatMessage[]>([]);
  const [showBlockers, setShowBlockers] = useState(false);
  const [blockerSearch, setBlockerSearch] = useState('');
  const [blockerDomain, setBlockerDomain] = useState('all');
  const [blockerSeverity, setBlockerSeverity] = useState<'all' | 'critical' | 'warning' | 'watch'>('all');
  const [selectedPriority, setSelectedPriority] = useState<AiPriority>('critical');
  const canViewReports = hasPermission(user?.permissions, 'reports.view');
  const { data: analysis, isLoading, isFetching, isError, refetch } = useAiDashboard(focus);
  const aiChat = useAiChat();
  const generatedAt = analysis?.generatedAt
    ? new Date(analysis.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'not available';
  const maxSkill = Math.max(...(analysis?.skillAreas ?? []).map((d: AiSkillArea) => d.averagePct), 10);
  const readinessPct = analysis?.kpis.readinessRatePct ?? 0;
  const blockerSeverityFor = (gapPct: number): 'critical' | 'warning' | 'watch' =>
    gapPct >= 30 ? 'critical' : gapPct >= 12 ? 'warning' : 'watch';
  const priorityMix = (['critical', 'warning', 'positive', 'neutral'] as AiPriority[]).map((priority) => ({
    priority,
    count: analysis?.recommendations.filter((item: AiRecommendation) => item.priority === priority).length ?? 0,
    ...priorityStyles(priority, c),
  }));
  const maxPriority = Math.max(...priorityMix.map((item) => item.count), 1);
  const selectedPriorityStyle = priorityStyles(selectedPriority, c);
  const SelectedPriorityIcon = selectedPriorityStyle.icon;
  const selectedPriorityMeta = PRIORITY_MEANING[selectedPriority];
  const selectedRecommendations =
    analysis?.recommendations.filter((item: AiRecommendation) => item.priority === selectedPriority) ?? [];
  const selectedSkillAreas = analysis?.skillAreas.filter((item: AiSkillArea) => item.priority === selectedPriority) ?? [];
  const selectedBlockers = (analysis?.blockers ?? []).filter((blocker: AiBlocker) => {
    const severity = blockerSeverityFor(blocker.gapPct);
    if (selectedPriority === 'critical') return severity === 'critical';
    if (selectedPriority === 'warning') return severity === 'warning';
    if (selectedPriority === 'neutral') return severity === 'watch';
    return false;
  });
  const selectedPeople = (analysis?.riskPeople ?? []).filter((person: AiRiskPerson) => {
    if (selectedPriority === 'critical') return person.gapPct >= 30;
    if (selectedPriority === 'warning') return person.gapPct >= 12 && person.gapPct < 30;
    if (selectedPriority === 'neutral') return person.gapPct < 12;
    return false;
  });
  const selectedStrengths = selectedPriority === 'positive' ? analysis?.strengths ?? [] : [];
  const focusLabels: Record<AiFocus, string> = {
    executive: 'Executive command view',
    risk: 'Risk and intervention view',
    skills: 'Skill-area strategy view',
    readiness: 'Promotion readiness view',
  };
  const blockerDomains: string[] = Array.from(new Set((analysis?.blockers ?? []).map((blocker: AiBlocker) => blocker.domain))).sort();
  const filteredBlockers = (analysis?.blockers ?? []).filter((blocker: AiBlocker) => {
    const q = blockerSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      blocker.employee.toLowerCase().includes(q) ||
      blocker.competency.toLowerCase().includes(q) ||
      blocker.domain.toLowerCase().includes(q);
    const matchesDomain = blockerDomain === 'all' || blocker.domain === blockerDomain;
    const matchesSeverity = blockerSeverity === 'all' || blockerSeverityFor(blocker.gapPct) === blockerSeverity;
    return matchesSearch && matchesDomain && matchesSeverity;
  });

  if (isLoading) {
    return (
      <div className="card p-8">
        <div className="flex items-center justify-center py-12 gap-3" style={{ color: 'rgb(var(--text-2))' }}>
          <div
            className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: 'rgb(var(--accent))', borderTopColor: 'transparent' }}
          />
          <span className="text-sm">Analyzing readiness data…</span>
        </div>
      </div>
    );
  }

  if (isError || !analysis) {
    return (
      <div className="card p-8">
        <div className="max-w-xl mx-auto text-center">
          <div
            className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center mb-4"
            style={{ backgroundColor: 'rgb(var(--danger-soft))', color: 'rgb(var(--danger))' }}
          >
            <AlertTriangle size={22} />
          </div>
          <p className="font-bold mb-1" style={{ color: 'rgb(var(--text-1))' }}>
            AI dashboard could not load
          </p>
          <p className="text-sm mb-4" style={{ color: 'rgb(var(--text-2))' }}>
            The AI data could not load. Please check the backend report APIs and AI setup.
          </p>
          <button type="button" className="btn-primary text-sm" onClick={() => refetch()}>
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  const topWeakArea = analysis.skillAreas[0];
  const topRiskPerson = analysis.riskPeople[0];
  const topRecommendation = analysis.recommendations[0];
  const dynamicSuggestions = [
    analysis.kpis.criticalBlockerCount > 0
      ? `Which ${analysis.kpis.criticalBlockerCount} critical gaps need action first?`
      : 'Where is the team strongest?',
    topWeakArea ? `Why is ${topWeakArea.domain} weak?` : 'Which skill areas should we watch?',
    topRiskPerson ? `How can we help ${topRiskPerson.name}?` : 'Who is closest to being ready?',
    `How can we improve readiness from ${readinessPct}%?`,
    topRecommendation ? `Explain: ${topRecommendation.title}` : 'What should leaders do this week?',
  ].filter(Boolean);

  const askAi = async (question: string) => {
    const cleanQuestion = question.trim();
    if (!cleanQuestion) return;

    const requestId = Date.now();
    setChatInput('');
    setChatMessages((messages) => [...messages, { id: `user-${requestId}`, role: 'user', text: cleanQuestion }]);

    try {
      const response = await aiChat.mutateAsync({ question: cleanQuestion, focus });
      setChatMessages((messages) => [
        ...messages,
        { id: `assistant-${requestId}`, role: 'assistant', text: response.answer, response },
      ]);
    } catch {
      setChatMessages((messages) => [
        ...messages,
        {
          id: `assistant-${requestId}`,
          role: 'assistant',
          text: 'I could not get the AI answer right now. Please try again after checking the backend AI service.',
        },
      ]);
    }
  };

  const visibleChatMessages =
    chatMessages.length > 0
      ? chatMessages
      : [
          {
            id: 'welcome',
            role: 'assistant' as const,
            text: 'Ask me about readiness, critical gaps, weak skill areas, people needing help, or what leaders should do next.',
          },
        ];
  const latestChatResponse = [...chatMessages].reverse().find((message) => message.response)?.response;
  const currentSuggestions = latestChatResponse?.suggestedQuestions?.length
    ? latestChatResponse.suggestedQuestions
    : dynamicSuggestions;
  const toneStyle = (tone: 'danger' | 'warning' | 'success' | 'info' | 'neutral') => {
    if (tone === 'danger') return { color: c.danger, bg: 'rgb(var(--danger-soft))' };
    if (tone === 'warning') return { color: c.warning, bg: 'rgb(var(--warning-soft))' };
    if (tone === 'success') return { color: c.success, bg: 'rgb(var(--success-soft))' };
    if (tone === 'info') return { color: c.accent, bg: 'rgb(var(--accent-soft))' };
    return { color: 'rgb(var(--text-2))', bg: 'rgb(var(--surface-2))' };
  };
  const renderAssistantAnswer = (_text: string, response?: AiChatResponse) => {
    if (response) {
      return (
        <div className="space-y-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide mb-1" style={{ color: 'rgb(var(--text-3))' }}>
              Answer
            </p>
            <p className="text-sm font-semibold leading-relaxed" style={{ color: 'rgb(var(--text-1))' }}>
              {response.answer}
            </p>
          </div>

          <div
            className="rounded-lg border px-3 py-2"
            style={{
              borderColor: 'rgb(var(--border))',
              backgroundColor: 'rgb(var(--accent-soft))',
              color: 'rgb(var(--accent-txt))',
            }}
          >
            <p className="text-[11px] font-bold uppercase tracking-wide mb-1">Why it matters</p>
            <p className="text-xs leading-relaxed">{response.explanation}</p>
          </div>

          {response.evidence.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: 'rgb(var(--text-3))' }}>
                Evidence
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {response.evidence.map((item, index: number) => {
                  const style = toneStyle(item.tone);
                  return (
                    <div
                      key={`${item.label}-${index}`}
                      className="rounded-lg px-3 py-2"
                      style={{ backgroundColor: style.bg }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold" style={{ color: 'rgb(var(--text-1))' }}>
                          {item.label}
                        </p>
                        <p className="text-xs font-bold shrink-0" style={{ color: style.color }}>
                          {item.value}
                        </p>
                      </div>
                      <p className="text-[11px] mt-1 leading-relaxed" style={{ color: 'rgb(var(--text-2))' }}>
                        {item.detail}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {response.actions.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: 'rgb(var(--text-3))' }}>
                Recommended Actions
              </p>
              <div className="space-y-2">
                {response.actions.map((item, index: number) => {
                  const style = priorityStyles(item.priority, c);
                  return (
                    <div
                      key={`${item.title}-${index}`}
                      className="rounded-lg border px-3 py-2"
                      style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface-2))' }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold" style={{ color: style.color }}>
                          {item.title}
                        </p>
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0 capitalize"
                          style={{ color: style.color, backgroundColor: style.bg }}
                        >
                          {item.priority}
                        </span>
                      </div>
                      <p className="text-xs mt-1 leading-relaxed" style={{ color: 'rgb(var(--text-2))' }}>
                        {item.detail}
                      </p>
                      <p className="text-[11px] mt-2 font-semibold" style={{ color: 'rgb(var(--text-3))' }}>
                        {item.owner} · {item.timeframe}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {(response.relatedPeople.length > 0 || response.relatedSkills.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {response.relatedPeople.length > 0 && (
                <div className="rounded-lg border p-3" style={{ borderColor: 'rgb(var(--border))' }}>
                  <p
                    className="text-[11px] font-bold uppercase tracking-wide mb-2"
                    style={{ color: 'rgb(var(--text-3))' }}
                  >
                    People to Review
                  </p>
                  <div className="space-y-1.5">
                    {response.relatedPeople.slice(0, 3).map((person: AiRiskPerson) => (
                      <div
                        key={`${person.empCode}-${person.name}`}
                        className="flex items-center justify-between gap-2 text-xs"
                      >
                        <span className="truncate" style={{ color: 'rgb(var(--text-2))' }}>
                          {person.name}
                        </span>
                        <span className="font-bold shrink-0" style={{ color: c.danger }}>
                          {person.gapPct} pts
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {response.relatedSkills.length > 0 && (
                <div className="rounded-lg border p-3" style={{ borderColor: 'rgb(var(--border))' }}>
                  <p
                    className="text-[11px] font-bold uppercase tracking-wide mb-2"
                    style={{ color: 'rgb(var(--text-3))' }}
                  >
                    Skill Areas
                  </p>
                  <div className="space-y-1.5">
                    {response.relatedSkills.slice(0, 3).map((skill: AiSkillArea) => (
                      <div key={skill.domain} className="flex items-center justify-between gap-2 text-xs">
                        <span className="truncate" style={{ color: 'rgb(var(--text-2))' }}>
                          {skill.domain}
                        </span>
                        <span
                          className="font-bold shrink-0"
                          style={{
                            color:
                              skill.priority === 'critical'
                                ? c.danger
                                : skill.priority === 'warning'
                                  ? c.warning
                                  : c.accent,
                          }}
                        >
                          {skill.averagePct}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    const blocks = _text.split('\n').filter((line) => line.trim().length > 0);

    return (
      <div className="space-y-2">
        {blocks.map((line, index) => {
          const lower = line.toLowerCase();
          const isAction =
            lower.startsWith('action:') ||
            lower.includes('next step') ||
            lower.includes('simple action') ||
            lower.includes('suggested action');
          const isRisk =
            lower.includes('critical') ||
            lower.includes('gap:') ||
            lower.includes('short by') ||
            lower.includes('weakest');
          const isMetric =
            lower.includes('readiness') ||
            lower.includes('average score') ||
            lower.includes('needed score') ||
            lower.includes('ready.');
          const isOwner = lower.startsWith('owner:') || lower.startsWith('time:');
          const isListItem = line.includes(':') && (line.includes('points') || line.includes('short by'));
          const color = isAction
            ? c.success
            : isRisk
              ? c.danger
              : isMetric
                ? c.accent
                : isOwner
                  ? c.warning
                  : 'rgb(var(--text-1))';
          const bg = isAction
            ? 'rgb(var(--success-soft))'
            : isRisk
              ? 'rgb(var(--danger-soft))'
              : isMetric
                ? 'rgb(var(--accent-soft))'
                : isOwner
                  ? 'rgb(var(--warning-soft))'
                  : 'transparent';

          if (index === 0 && !isListItem) {
            return (
              <p key={`${line}-${index}`} className="text-sm font-semibold leading-relaxed" style={{ color }}>
                {line}
              </p>
            );
          }

          return (
            <div
              key={`${line}-${index}`}
              className="rounded-lg border px-3 py-2 text-xs leading-relaxed"
              style={{
                borderColor: isAction || isRisk || isMetric || isOwner ? 'transparent' : 'rgb(var(--border))',
                backgroundColor: bg,
                color,
              }}
            >
              {line}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="card p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'rgb(var(--accent-soft))', color: 'rgb(var(--accent))' }}
            >
              <Bot size={22} />
            </div>
            <div>
              <p className="text-lg font-bold" style={{ color: 'rgb(var(--text-1))' }}>
                AI Dashboard
              </p>
              <p className="text-sm mt-1 max-w-2xl" style={{ color: 'rgb(var(--text-2))' }}>
                AI uses readiness, skills, and gaps to show risks, strengths, and next steps.
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs flex-wrap" style={{ color: 'rgb(var(--text-3))' }}>
                <Clock3 size={13} />
                <span>Last analyzed {generatedAt}</span>
                <span>·</span>
                <span>{analysis.aiEnabled ? 'AI analysis ready' : 'Basic analysis ready'}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn-primary text-sm inline-flex items-center gap-2"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <Sparkles size={14} /> {isFetching ? 'Analyzing…' : 'Re-analyze'}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { id: 'overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'ask', label: 'Ask AI', icon: MessageSquare },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setAiView(id as typeof aiView)}
            className="px-3 py-2 rounded-lg text-xs font-semibold border transition-colors inline-flex items-center gap-2"
            style={{
              borderColor: aiView === id ? 'rgb(var(--accent))' : 'rgb(var(--border))',
              backgroundColor: aiView === id ? 'rgb(var(--accent-soft))' : 'rgb(var(--surface))',
              color: aiView === id ? 'rgb(var(--accent-txt))' : 'rgb(var(--text-2))',
            }}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {aiView === 'ask' ? (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)] gap-5">
          <div className="card p-0 overflow-hidden">
            <div
              className="px-5 py-4 border-b flex items-start justify-between gap-3 flex-wrap"
              style={{ borderColor: 'rgb(var(--border))' }}
            >
              <div>
                <p className="text-sm font-bold" style={{ color: 'rgb(var(--text-1))' }}>
                  Ask AI
                </p>
                <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-3))' }}>
                  Ask simple questions about readiness, gaps, and next actions.
                </p>
              </div>
              <span
                className="rounded-full px-3 py-1 text-xs font-bold"
                style={{ backgroundColor: 'rgb(var(--accent-soft))', color: 'rgb(var(--accent-txt))' }}
              >
                Uses current dashboard data
              </span>
            </div>

            <div className="p-5 space-y-4">
              <div
                className="min-h-[320px] max-h-[460px] overflow-y-auto rounded-xl border p-4 space-y-3"
                style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface-2))' }}
              >
                {visibleChatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: 'rgb(var(--accent-soft))', color: 'rgb(var(--accent))' }}
                      >
                        <Bot size={17} />
                      </div>
                    )}
                    <div
                      className={`max-w-[88%] flex flex-col gap-1.5 ${
                        message.role === 'user' ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div className="text-[11px] font-semibold" style={{ color: 'rgb(var(--text-3))' }}>
                        {message.role === 'user' ? 'You' : 'AI Assistant'}
                      </div>
                      <div
                        className="rounded-xl px-4 py-3 text-sm"
                        style={{
                          backgroundColor: message.role === 'user' ? 'rgb(var(--accent))' : 'rgb(var(--surface))',
                          color: message.role === 'user' ? 'white' : 'rgb(var(--text-1))',
                          border:
                            message.role === 'user'
                              ? '1px solid rgb(var(--accent))'
                              : '1px solid rgb(var(--border))',
                          boxShadow: message.role === 'assistant' ? '0 10px 30px rgba(0,0,0,0.08)' : 'none',
                        }}
                      >
                        {message.role === 'assistant'
                          ? renderAssistantAnswer(message.text, message.response)
                          : message.text}
                      </div>
                    </div>
                    {message.role === 'user' && (
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: 'rgb(var(--accent))', color: 'white' }}
                      >
                        <UserRound size={17} />
                      </div>
                    )}
                  </div>
                ))}
                {aiChat.isPending && (
                  <div className="flex gap-3 justify-start">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: 'rgb(var(--accent-soft))', color: 'rgb(var(--accent))' }}
                    >
                      <Bot size={17} />
                    </div>
                    <div
                      className="rounded-xl px-4 py-3 text-sm border"
                      style={{
                        borderColor: 'rgb(var(--border))',
                        backgroundColor: 'rgb(var(--surface))',
                        color: 'rgb(var(--text-2))',
                      }}
                    >
                      Building answer with evidence and actions...
                    </div>
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: 'rgb(var(--text-3))' }}>
                  Suggested questions
                </p>
                <div className="flex flex-wrap gap-2">
                  {currentSuggestions.map((question: string) => (
                    <button
                      key={question}
                      type="button"
                      onClick={() => askAi(question)}
                      className="rounded-full border px-3 py-1.5 text-xs text-left"
                      style={{
                        borderColor: 'rgb(var(--border))',
                        backgroundColor: 'rgb(var(--surface))',
                        color: 'rgb(var(--text-2))',
                      }}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>

              <form
                className="flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  askAi(chatInput);
                }}
              >
                <input
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  placeholder="Ask about gaps, readiness, weak areas, or next steps..."
                  disabled={aiChat.isPending}
                  className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none"
                  style={{
                    borderColor: 'rgb(var(--border))',
                    backgroundColor: 'rgb(var(--surface))',
                    color: 'rgb(var(--text-1))',
                  }}
                />
                <button
                  type="submit"
                  disabled={aiChat.isPending}
                  className="btn-primary px-3 py-2 inline-flex items-center gap-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Send size={14} /> {aiChat.isPending ? 'Asking...' : 'Ask'}
                </button>
              </form>
            </div>
          </div>

          <div className="space-y-5">
            <div className="card p-5">
              <p className="text-sm font-bold mb-3" style={{ color: 'rgb(var(--text-1))' }}>
                Live Data Snapshot
              </p>
              <div className="space-y-3">
                {[
                  {
                    label: 'Readiness',
                    value: `${readinessPct}%`,
                    color: c.success,
                    help: 'The share of people who meet the required skill level for their next grade. Higher means fewer people need immediate support.',
                  },
                  {
                    label: 'Ready People',
                    value: `${analysis.kpis.readyResources}/${analysis.kpis.totalResources}`,
                    color: c.success,
                    help: 'How many people are currently ready compared with everyone included in this dashboard view.',
                  },
                  {
                    label: 'Critical Gaps',
                    value: String(analysis.kpis.criticalBlockerCount),
                    color: c.danger,
                    help: 'High-priority missing skills that may block promotion readiness or delivery capability. These should be reviewed first.',
                  },
                  {
                    label: 'Average Score',
                    value: formatPct(analysis.kpis.avgAchievedPct),
                    color: c.accent,
                    help: 'The average current skill achievement across the selected people and assessed skills.',
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-3 rounded-lg border p-3"
                    style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface-2))' }}
                  >
                    <span
                      className="flex items-center gap-1 text-xs font-semibold"
                      style={{ color: 'rgb(var(--text-3))' }}
                    >
                      {item.label}
                      <InfoTip text={item.help} />
                    </span>
                    <span className="text-sm font-bold" style={{ color: item.color }}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <p className="text-sm font-bold mb-3" style={{ color: 'rgb(var(--text-1))' }}>
                Good Questions to Ask
              </p>
              <div className="space-y-2">
                {[
                  'Who needs help first?',
                  'What should we fix this week?',
                  'Which skill area is weakest?',
                  'How do we improve readiness?',
                ].map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => askAi(question)}
                    className="w-full rounded-lg border px-3 py-2 text-xs text-left"
                    style={{
                      borderColor: 'rgb(var(--border))',
                      backgroundColor: 'rgb(var(--surface-2))',
                      color: 'rgb(var(--text-2))',
                    }}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)] gap-5">
            <div
              className="rounded-xl border p-5 min-h-[260px] flex flex-col justify-between"
              style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface))' }}
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                  <div>
                    <p
                      className="text-xs font-semibold uppercase tracking-wide"
                      style={{ color: 'rgb(var(--text-3))' }}
                    >
                      AI Command Brief
                    </p>
                    <p className="text-lg font-bold mt-1" style={{ color: 'rgb(var(--text-1))' }}>
                      {focusLabels[focus]}
                    </p>
                  </div>
                  <span
                    className="rounded-full px-3 py-1 text-xs font-bold"
                    style={{
                      backgroundColor: analysis.aiEnabled
                        ? 'rgb(var(--success-soft))'
                        : 'rgb(var(--warning-soft))',
                      color: analysis.aiEnabled ? 'rgb(var(--success))' : 'rgb(var(--warning))',
                    }}
                  >
                    {analysis.source === 'openai' ? 'Made by AI' : 'Basic analysis'}
                  </span>
                </div>
                <p className="text-base leading-relaxed mb-4" style={{ color: 'rgb(var(--text-1))' }}>
                  {analysis.executiveNarrative}
                </p>
                <div
                  className="rounded-lg p-4 border"
                  style={{
                    borderColor: 'rgb(var(--border))',
                    backgroundColor: 'rgb(var(--accent-soft))',
                    color: 'rgb(var(--accent-txt))',
                  }}
                >
                  <p className="text-xs font-bold uppercase tracking-wide mb-1">Focus Answer</p>
                  <p className="text-sm leading-relaxed">{analysis.focusAnswer}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
                <div className="rounded-lg p-3" style={{ backgroundColor: 'rgb(var(--surface-2))' }}>
                  <div className="flex items-center gap-1">
                    <p
                      className="text-[11px] font-semibold uppercase tracking-wide"
                      style={{ color: 'rgb(var(--text-3))' }}
                    >
                      Dataset
                    </p>
                    <InfoTip text="The number of people included in this AI dashboard view. All readiness and gap numbers are calculated from this group." />
                  </div>
                  <p className="text-sm font-bold mt-1" style={{ color: 'rgb(var(--text-1))' }}>
                    {analysis.kpis.totalResources} people
                  </p>
                </div>
                <div className="rounded-lg p-3" style={{ backgroundColor: 'rgb(var(--surface-2))' }}>
                  <div className="flex items-center gap-1">
                    <p
                      className="text-[11px] font-semibold uppercase tracking-wide"
                      style={{ color: 'rgb(var(--text-3))' }}
                    >
                      Analysis
                    </p>
                    <InfoTip text="Shows whether the explanation came from AI or from the built-in fallback rules. The numbers still come from live dashboard data." />
                  </div>
                  <p className="text-sm font-bold mt-1 truncate" style={{ color: 'rgb(var(--text-1))' }}>
                    {analysis.aiEnabled ? 'AI ready' : 'Basic ready'}
                  </p>
                </div>
                <div className="rounded-lg p-3" style={{ backgroundColor: 'rgb(var(--surface-2))' }}>
                  <div className="flex items-center gap-1">
                    <p
                      className="text-[11px] font-semibold uppercase tracking-wide"
                      style={{ color: 'rgb(var(--text-3))' }}
                    >
                      Critical Gaps
                    </p>
                    <InfoTip text="Skills where the gap is serious enough to need leadership attention, coaching, training, or reassignment planning." />
                  </div>
                  <p className="text-sm font-bold mt-1" style={{ color: c.danger }}>
                    {analysis.kpis.criticalBlockerCount} critical gaps
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-5 min-h-[260px]">
              <div className="mb-4">
                <div className="flex items-center gap-1">
                  <p className="text-sm font-bold" style={{ color: 'rgb(var(--text-1))' }}>
                    Readiness Gauge
                  </p>
                  <InfoTip text="A quick health indicator for promotion readiness. Green progress means more people already meet their next-grade expectations." />
                </div>
                <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-3))' }}>
                  Promotion readiness across the current dataset.
                </p>
              </div>
              <div className="flex items-center justify-center">
                <div
                  className="w-40 h-40 rounded-full flex items-center justify-center"
                  style={{
                    background: `conic-gradient(${c.success} ${readinessPct * 3.6}deg, rgb(var(--surface-3)) 0deg)`,
                  }}
                >
                  <div
                    className="w-28 h-28 rounded-full flex flex-col items-center justify-center"
                    style={{ backgroundColor: 'rgb(var(--surface))' }}
                  >
                    <span className="text-3xl font-bold leading-none" style={{ color: c.success }}>
                      {readinessPct}%
                    </span>
                    <span className="text-[11px] font-semibold mt-1" style={{ color: 'rgb(var(--text-3))' }}>
                      READY
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-5">
                <div>
                  <p
                    className="text-[11px] uppercase tracking-wide font-semibold"
                    style={{ color: 'rgb(var(--text-3))' }}
                  >
                    Ready
                  </p>
                  <p className="text-xl font-bold" style={{ color: c.success }}>
                    {analysis.kpis.readyResources}
                  </p>
                </div>
                <div>
                  <p
                    className="text-[11px] uppercase tracking-wide font-semibold"
                    style={{ color: 'rgb(var(--text-3))' }}
                  >
                    Needs Action
                  </p>
                  <p className="text-xl font-bold" style={{ color: c.warning }}>
                    {Math.max(0, analysis.kpis.totalResources - analysis.kpis.readyResources)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                label: 'Avg Score',
                value: formatPct(analysis.kpis.avgAchievedPct),
                detail: 'Current score',
                color: c.accent,
                help: 'The average current assessment score. Think of it as where the team stands today.',
              },
              {
                label: 'Avg Required',
                value: formatPct(analysis.kpis.avgRequiredPct),
                detail: 'Needed score',
                color: c.warning,
                help: 'The average target score people need for their next grade or expected capability level.',
              },
              {
                label: 'Ready People',
                value: `${analysis.kpis.readyResources}/${analysis.kpis.totalResources}`,
                detail: `${readinessPct}% ready`,
                color: c.success,
                help: 'People who meet all measured expectations in this view. This number improves when skill gaps are closed.',
              },
              {
                label: 'Critical Gaps',
                value: analysis.kpis.criticalBlockerCount,
                detail: 'Immediate actions',
                color: c.danger,
                help: 'The number of serious skill gaps that need action first. Click the critical gap list below to see who and what is affected.',
              },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-xl border p-4 min-h-[112px]"
                style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface))' }}
              >
                <div className="flex items-center gap-1">
                  <p
                    className="text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'rgb(var(--text-3))' }}
                  >
                    {kpi.label}
                  </p>
                  <InfoTip text={kpi.help} />
                </div>
                <p className="text-2xl font-bold mt-1 leading-none" style={{ color: kpi.color }}>
                  {kpi.value}
                </p>
                <p className="text-xs mt-2" style={{ color: 'rgb(var(--text-2))' }}>
                  {kpi.detail}
                </p>
                <div
                  className="h-1.5 rounded-full overflow-hidden mt-3"
                  style={{ backgroundColor: 'rgb(var(--surface-3))' }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${clampPct(Number.parseInt(String(kpi.value), 10) || 18)}%`,
                      backgroundColor: kpi.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              ['executive', 'Executive View'],
              ['risk', 'Risk'],
              ['skills', 'Skill Areas'],
              ['readiness', 'Readiness'],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFocus(id as typeof focus)}
                className="px-3 py-2 rounded-lg text-xs font-semibold border transition-colors"
                style={{
                  borderColor: focus === id ? 'rgb(var(--accent))' : 'rgb(var(--border))',
                  backgroundColor: focus === id ? 'rgb(var(--accent-soft))' : 'rgb(var(--surface))',
                  color: focus === id ? 'rgb(var(--accent-txt))' : 'rgb(var(--text-2))',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <div className="xl:col-span-2 card p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <p className="text-sm font-bold" style={{ color: 'rgb(var(--text-1))' }}>
                    AI Recommendations
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-3))' }}>
                    Most important notes from current data.
                  </p>
                </div>
                {canViewReports && (
                  <button
                    type="button"
                    onClick={() => onNavigate('reports')}
                    className="btn-ghost text-xs px-3 py-2"
                  >
                    Open Reports
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {analysis.recommendations.map((item: AiRecommendation) => {
                  const style = priorityStyles(item.priority, c);
                  const Icon = style.icon;
                  return (
                    <div
                      key={item.title}
                      className="rounded-xl border p-4 flex gap-3"
                      style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface-2))' }}
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: style.bg, color: style.color }}
                      >
                        <Icon size={17} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'rgb(var(--text-1))' }}>
                          {item.title}
                        </p>
                        <p className="text-sm mt-1 leading-relaxed" style={{ color: 'rgb(var(--text-2))' }}>
                          {item.insight}
                        </p>
                        <p className="text-sm mt-2 font-medium" style={{ color: style.color }}>
                          {item.action}
                        </p>
                        <p
                          className="text-[11px] mt-2 uppercase tracking-wide"
                          style={{ color: 'rgb(var(--text-3))' }}
                        >
                          {item.owner} · {item.timeframe}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card p-5">
              <p className="text-sm font-bold mb-1" style={{ color: 'rgb(var(--text-1))' }}>
                AI Query Console
              </p>
              <p className="text-xs mb-4" style={{ color: 'rgb(var(--text-3))' }}>
                Choose a question to change the advice.
              </p>
              <div className="space-y-2">
                {analysis.suggestedQuestions.map((question: string, index: number) => {
                  const ids: AiFocus[] = ['executive', 'risk', 'skills', 'readiness'];
                  const prompt = { id: ids[index % ids.length], q: question };
                  return (
                    <button
                      key={`${prompt.id}-${index}-${prompt.q}`}
                      type="button"
                      onClick={() => setFocus(prompt.id as typeof focus)}
                      className="w-full text-left rounded-lg border px-3 py-2 text-xs transition-colors"
                      style={{
                        borderColor: focus === prompt.id ? 'rgb(var(--accent))' : 'rgb(var(--border))',
                        backgroundColor: focus === prompt.id ? 'rgb(var(--accent-soft))' : 'transparent',
                        color: focus === prompt.id ? 'rgb(var(--accent-txt))' : 'rgb(var(--text-2))',
                      }}
                    >
                      {prompt.q}
                    </button>
                  );
                })}
              </div>
              <div className="mt-5 pt-4 border-t" style={{ borderColor: 'rgb(var(--border))' }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'rgb(var(--text-1))' }}>
                      Priority Mix
                    </p>
                    <p className="text-xs mt-1 mb-3" style={{ color: 'rgb(var(--text-3))' }}>
                      Select a priority to see meaning and related resources.
                    </p>
                  </div>
                  <Info size={14} className="mt-0.5 shrink-0" style={{ color: 'rgb(var(--text-3))' }} />
                </div>
                <div className="space-y-3">
                  {priorityMix.map((item) => {
                    const active = selectedPriority === item.priority;
                    return (
                      <button
                        key={item.priority}
                        type="button"
                        onClick={() => setSelectedPriority(item.priority)}
                        className="w-full text-left rounded-lg border p-2 transition-colors"
                        style={{
                          borderColor: active ? item.color : 'transparent',
                          backgroundColor: active ? item.bg : 'transparent',
                        }}
                      >
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-semibold capitalize" style={{ color: item.color }}>
                            {item.priority}
                          </span>
                          <span style={{ color: 'rgb(var(--text-3))' }}>{item.count}</span>
                        </div>
                        <div
                          className="h-1.5 rounded-full overflow-hidden"
                          style={{ backgroundColor: 'rgb(var(--surface-3))' }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.max(4, (item.count / maxPriority) * 100)}%`,
                              backgroundColor: item.color,
                            }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div
                  className="mt-4 rounded-xl border p-3"
                  style={{ borderColor: selectedPriorityStyle.color, backgroundColor: selectedPriorityStyle.bg }}
                >
                  <div className="flex items-start gap-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: 'rgb(var(--surface))',
                        color: selectedPriorityStyle.color,
                      }}
                    >
                      <SelectedPriorityIcon size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold" style={{ color: 'rgb(var(--text-1))' }}>
                        {selectedPriorityMeta.label}
                      </p>
                      <p className="text-xs mt-1 leading-relaxed" style={{ color: 'rgb(var(--text-2))' }}>
                        {selectedPriorityMeta.meaning}
                      </p>
                      <p className="text-xs mt-2 font-semibold" style={{ color: selectedPriorityStyle.color }}>
                        {selectedPriorityMeta.action}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    {selectedRecommendations.slice(0, 3).map((item: AiRecommendation) => (
                      <div
                        key={`rec-${item.title}`}
                        className="w-full rounded-lg border px-3 py-2 text-left"
                        style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface))' }}
                      >
                        <p className="text-xs font-semibold" style={{ color: 'rgb(var(--text-1))' }}>
                          {item.title}
                        </p>
                        <p className="text-[11px] mt-1" style={{ color: 'rgb(var(--text-3))' }}>
                          {item.owner} · {item.timeframe}
                        </p>
                      </div>
                    ))}

                    {selectedBlockers.slice(0, 3).map((item: AiBlocker) => (
                      <button
                        key={`blocker-${item.employee}-${item.competency}`}
                        type="button"
                        onClick={() => {
                          setShowBlockers(true);
                          setBlockerSeverity(
                            selectedPriority === 'critical'
                              ? 'critical'
                              : selectedPriority === 'warning'
                                ? 'warning'
                                : 'watch'
                          );
                          setBlockerSearch(item.employee);
                        }}
                        className="w-full rounded-lg border px-3 py-2 text-left"
                        style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface))' }}
                      >
                        <p className="text-xs font-semibold" style={{ color: 'rgb(var(--text-1))' }}>
                          {item.employee}
                        </p>
                        <p className="text-[11px] mt-1" style={{ color: 'rgb(var(--text-3))' }}>
                          {item.competency} · {item.domain} · -{item.gapPct} pts
                        </p>
                      </button>
                    ))}

                    {selectedSkillAreas.slice(0, 3).map((item: AiSkillArea) => (
                      <div
                        key={`skill-${item.domain}`}
                        className="rounded-lg border px-3 py-2"
                        style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface))' }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold truncate" style={{ color: 'rgb(var(--text-1))' }}>
                            {item.domain}
                          </p>
                          <span
                            className="text-[11px] font-bold"
                            style={{ color: selectedPriorityStyle.color }}
                          >
                            {item.averagePct}%
                          </span>
                        </div>
                        <p className="text-[11px] mt-1" style={{ color: 'rgb(var(--text-3))' }}>
                          {item.recommendation}
                        </p>
                      </div>
                    ))}

                    {selectedPeople.slice(0, 3).map((item: AiRiskPerson) => (
                      <div
                        key={`person-${item.empCode}`}
                        className="rounded-lg border px-3 py-2"
                        style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface))' }}
                      >
                        <p className="text-xs font-semibold" style={{ color: 'rgb(var(--text-1))' }}>
                          {item.name}
                        </p>
                        <p className="text-[11px] mt-1" style={{ color: 'rgb(var(--text-3))' }}>
                          ID {item.empCode} · {item.currentGrade} to {item.targetGrade} · -{item.gapPct} pts
                        </p>
                      </div>
                    ))}

                    {selectedStrengths.slice(0, 3).map((item: AiStrength) => (
                      <div
                        key={`strength-${item.domain}`}
                        className="rounded-lg border px-3 py-2"
                        style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface))' }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold truncate" style={{ color: 'rgb(var(--text-1))' }}>
                            {item.domain}
                          </p>
                          <span className="text-[11px] font-bold" style={{ color: c.success }}>
                            {item.averagePct}%
                          </span>
                        </div>
                        <p className="text-[11px] mt-1" style={{ color: 'rgb(var(--text-3))' }}>
                          {item.recommendation}
                        </p>
                      </div>
                    ))}

                    {selectedRecommendations.length === 0 &&
                      selectedBlockers.length === 0 &&
                      selectedSkillAreas.length === 0 &&
                      selectedPeople.length === 0 &&
                      selectedStrengths.length === 0 && (
                        <p className="text-xs py-3 text-center" style={{ color: 'rgb(var(--text-3))' }}>
                          No associated resources for this priority right now.
                        </p>
                      )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <div className="card p-5">
              <p className="text-sm font-bold mb-1" style={{ color: 'rgb(var(--text-1))' }}>
                Weakest Skill Areas
              </p>
              <p className="text-xs mb-4" style={{ color: 'rgb(var(--text-3))' }}>
                Skill areas with the lowest scores.
              </p>
              <div className="space-y-3">
                {analysis.skillAreas.length === 0 ? (
                  <p className="text-sm py-8 text-center" style={{ color: 'rgb(var(--text-3))' }}>
                    No skill area scores available yet.
                  </p>
                ) : (
                  analysis.skillAreas.map((d: AiSkillArea) => (
                    <div key={d.domain}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span
                          className="font-semibold truncate pr-2"
                          style={{ color: 'rgb(var(--text-1))' }}
                        >
                          {d.domain}
                        </span>
                        <span style={{ color: 'rgb(var(--text-2))' }}>{d.averagePct}%</span>
                      </div>
                      <div
                        className="h-2 rounded-full overflow-hidden"
                        style={{ backgroundColor: 'rgb(var(--surface-3))' }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.max(4, (d.averagePct / maxSkill) * 100)}%`,
                            backgroundColor:
                              d.priority === 'critical'
                                ? c.danger
                                : d.priority === 'warning'
                                  ? c.warning
                                  : c.accent,
                          }}
                        />
                      </div>
                      <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-2))' }}>
                        {d.recommendation}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="card p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="text-sm font-bold mb-1" style={{ color: 'rgb(var(--text-1))' }}>
                    Critical Gaps
                  </p>
                  <p className="text-xs" style={{ color: 'rgb(var(--text-3))' }}>
                    The biggest missing skills for the next grade.
                  </p>
                </div>
                {analysis.blockers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowBlockers((value) => !value)}
                    className="btn-secondary text-xs px-3 py-2 shrink-0"
                  >
                    {showBlockers
                      ? 'Hide Critical Gaps'
                      : `View All Critical Gaps (${analysis.blockers.length})`}
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {analysis.blockers.length === 0 ? (
                  <p className="text-sm py-8 text-center" style={{ color: 'rgb(var(--text-3))' }}>
                    No critical gaps found.
                  </p>
                ) : (
                  analysis.blockers.slice(0, showBlockers ? 3 : 6).map((b: AiBlocker) => (
                    <div
                      key={`${b.employee}-${b.competency}`}
                      className="rounded-lg border p-3"
                      style={{
                        borderColor: 'rgba(248, 113, 113, 0.28)',
                        backgroundColor: 'rgba(127, 29, 29, 0.18)',
                      }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold truncate" style={{ color: 'rgb(var(--text-1))' }}>
                          {b.competency}
                        </p>
                        <span className="text-xs font-bold shrink-0" style={{ color: c.danger }}>
                          -{b.gapPct} pts
                        </span>
                      </div>
                      <p className="text-xs mt-1 truncate" style={{ color: 'rgb(var(--text-2))' }}>
                        {b.employee} · {b.domain}
                      </p>
                      <p className="text-[11px] mt-1 font-semibold" style={{ color: 'rgb(var(--warning))' }}>
                        {b.action}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {showBlockers && analysis.blockers.length > 0 && (
            <div className="card p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                <div>
                  <p className="text-sm font-bold" style={{ color: 'rgb(var(--text-1))' }}>
                    Critical Gap Explorer
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-3))' }}>
                    Full list of missing skills, people, gap size, and AI action.
                  </p>
                </div>
                <div className="text-xs font-semibold" style={{ color: 'rgb(var(--text-2))' }}>
                  Showing {filteredBlockers.length} of {analysis.blockers.length} critical gaps
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_180px_150px] gap-3 mb-4">
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'rgb(var(--text-3))' }}
                  />
                  <input
                    value={blockerSearch}
                    onChange={(event) => setBlockerSearch(event.target.value)}
                    placeholder="Search employee, skill, or skill area"
                    className="w-full rounded-lg border pl-9 pr-3 py-2 text-sm outline-none"
                    style={{
                      borderColor: 'rgb(var(--border))',
                      backgroundColor: 'rgb(var(--surface-2))',
                      color: 'rgb(var(--text-1))',
                    }}
                  />
                </div>
                <SkillAreaNameFilterSelect
                  value={blockerDomain}
                  onChange={setBlockerDomain}
                  skillAreas={blockerDomains}
                />
                <select
                  value={blockerSeverity}
                  onChange={(event) => setBlockerSeverity(event.target.value as typeof blockerSeverity)}
                  className="rounded-lg border px-3 py-2 text-sm outline-none"
                  style={{
                    borderColor: 'rgb(var(--border))',
                    backgroundColor: 'rgb(var(--surface-2))',
                    color: 'rgb(var(--text-1))',
                  }}
                >
                  <option value="all">All urgency</option>
                  <option value="critical">Critical</option>
                  <option value="warning">Warning</option>
                  <option value="watch">Watch</option>
                </select>
              </div>

              <div
                className="overflow-x-auto rounded-lg border"
                style={{ borderColor: 'rgb(var(--border))' }}
              >
                <table className="w-full min-w-[860px] text-sm">
                  <thead style={{ backgroundColor: 'rgb(var(--surface-2))' }}>
                    <tr>
                      {['Employee', 'Skill', 'Skill Area', 'Gap', 'Urgency', 'AI Action'].map((header) => (
                        <th
                          key={header}
                          className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide"
                          style={{ color: 'rgb(var(--text-3))' }}
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBlockers.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-8 text-center"
                          style={{ color: 'rgb(var(--text-3))' }}
                        >
                          No critical gaps match the selected filters.
                        </td>
                      </tr>
                    ) : (
                      filteredBlockers.map((blocker: AiBlocker) => {
                        const severity = blockerSeverityFor(blocker.gapPct);
                        const sevColor =
                          severity === 'critical'
                            ? c.danger
                            : severity === 'warning'
                              ? c.warning
                              : c.accent;
                        const sevBg =
                          severity === 'critical'
                            ? 'rgb(var(--danger-soft))'
                            : severity === 'warning'
                              ? 'rgb(var(--warning-soft))'
                              : 'rgb(var(--accent-soft))';
                        return (
                          <tr
                            key={`${blocker.employee}-${blocker.competency}-${blocker.domain}`}
                            className="border-t"
                            style={{ borderColor: 'rgb(var(--border))' }}
                          >
                            <td className="px-4 py-3 font-semibold" style={{ color: 'rgb(var(--text-1))' }}>
                              {blocker.employee}
                            </td>
                            <td className="px-4 py-3" style={{ color: 'rgb(var(--text-2))' }}>
                              {blocker.competency}
                            </td>
                            <td className="px-4 py-3" style={{ color: 'rgb(var(--text-2))' }}>
                              {blocker.domain}
                            </td>
                            <td className="px-4 py-3 font-bold" style={{ color: c.danger }}>
                              -{blocker.gapPct} pts
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className="rounded-full px-2.5 py-1 text-xs font-bold capitalize"
                                style={{ color: sevColor, backgroundColor: sevBg }}
                              >
                                {severity}
                              </span>
                            </td>
                            <td className="px-4 py-3 max-w-[320px]" style={{ color: 'rgb(var(--text-2))' }}>
                              {blocker.action}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {analysis.riskPeople.length > 0 && (
            <div className="card p-5">
              <div className="mb-4">
                <p className="text-sm font-bold" style={{ color: 'rgb(var(--text-1))' }}>
                  People Needing Attention
                </p>
                <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-3))' }}>
                  People who may need help next.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {analysis.riskPeople.map((person: AiRiskPerson) => (
                  <div
                    key={`${person.empCode}-${person.name}`}
                    className="rounded-xl border p-4"
                    style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface))' }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: 'rgb(var(--text-1))' }}>
                          {person.name}
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-3))' }}>
                          {person.currentGrade} → {person.targetGrade} · {person.meets} met
                        </p>
                      </div>
                      <span className="text-xs font-bold shrink-0" style={{ color: c.danger }}>
                        {person.gapPct} pts
                      </span>
                    </div>
                    <p className="text-xs mt-3 leading-relaxed" style={{ color: 'rgb(var(--text-2))' }}>
                      {person.action}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysis.strengths.length > 0 && (
            <div className="card p-5">
              <p className="text-sm font-bold mb-4" style={{ color: 'rgb(var(--text-1))' }}>
                Strengths to Reuse
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                {analysis.strengths.map((d: AiStrength) => (
                  <div
                    key={d.domain}
                    className="rounded-xl border p-4"
                    style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--success-soft))' }}
                  >
                    <p className="text-xs font-semibold truncate" style={{ color: 'rgb(var(--text-1))' }}>
                      {d.domain}
                    </p>
                    <p className="text-xl font-bold mt-1" style={{ color: c.success }}>
                      {d.averagePct}%
                    </p>
                    <p className="text-xs" style={{ color: 'rgb(var(--text-3))' }}>
                      {d.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
