import React, { useCallback, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Play,
  RefreshCw,
  ShieldCheck,
  Wrench,
  XCircle,
} from 'lucide-react';
import { auth } from '../utils/firebase';
import { useLanguage } from '../utils/i18n';

interface DiagnosticEvent {
  id: string;
  timestamp: string;
  stage: string;
  channel: string;
  eventId?: string;
  pageId?: string;
  success: boolean;
  durationMs?: number;
  detail?: string;
  errorCode?: string;
  errorSubcode?: string;
  fbtraceId?: string;
}

interface DiagnosticsPayload {
  checkedAt: string;
  envStatus: Record<string, boolean | string>;
  pageTokenCheck: {
    status: string;
    source: string;
    pageId: string | null;
    pageName: string | null;
    tokenValid: boolean;
    tokenType: string | null;
    expiresAt: string | null;
    scopes: string[];
    hasPagesMessaging: boolean;
    hasPagesManageMetadata: boolean;
    error: { code?: number; subcode?: number; message?: string; fbtraceId?: string } | null;
  };
  subscriptionCheck: {
    status: string;
    pageId: string | null;
    appSubscribed: boolean;
    messagesSubscribed: boolean;
    postbacksSubscribed: boolean;
    feedSubscribed: boolean;
    subscribedApps: Array<{ id: string; name: string; subscribedFields: string[] }>;
    error: { code?: number; subcode?: number; message?: string; fbtraceId?: string } | null;
  };
  geminiCheck: {
    status: string;
    model: string;
    liveChecked: boolean;
    latencyMs: number | null;
    sampleReplyPreview?: string | null;
    error: string | null;
  };
  externalUserRequirementNote: string;
  diagnosticEvents: DiagnosticEvent[];
}

export const MirrorBotAdminDiagnostics: React.FC = () => {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resubscribing, setResubscribing] = useState(false);
  const [testingPipeline, setTestingPipeline] = useState(false);
  const [data, setData] = useState<DiagnosticsPayload | null>(null);
  const [notice, setNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const runDiagnostics = useCallback(async (checkGemini = true) => {
    const idToken = await auth.currentUser?.getIdToken().catch(() => null);
    if (!idToken) return;
    setLoading(true);
    setNotice(null);
    try {
      const res = await fetch(
        `/api/mirrorbot/meta-diagnostics${checkGemini ? '?checkGemini=1' : ''}`,
        {
          headers: { Authorization: `Bearer ${idToken}` },
        }
      );
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setData(json as DiagnosticsPayload);
      } else {
        setNotice({ type: 'err', text: json?.error || 'Could not load diagnostics.' });
      }
    } catch {
      setNotice({ type: 'err', text: 'Network error while fetching diagnostics.' });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleToggleOpen = () => {
    const next = !expanded;
    setExpanded(next);
    if (next && !data && !loading) {
      void runDiagnostics(false);
    }
  };

  const handleResubscribe = async () => {
    const idToken = await auth.currentUser?.getIdToken().catch(() => null);
    if (!idToken) return;
    setResubscribing(true);
    setNotice(null);
    try {
      const res = await fetch('/api/mirrorbot/meta-diagnostics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ action: 'resubscribe_page' }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setNotice({
          type: 'ok',
          text: `Page webhook re-subscribed (${Array.isArray(json.fields) ? json.fields.join(', ') : 'messages'}).`,
        });
        await runDiagnostics(false);
      } else {
        setNotice({
          type: 'err',
          text: json?.errorMessage || json?.error || 'Re-subscribe failed.',
        });
      }
    } catch {
      setNotice({ type: 'err', text: 'Network error during Page webhook re-subscription.' });
    } finally {
      setResubscribing(false);
    }
  };

  const handlePipelineTest = async () => {
    const idToken = await auth.currentUser?.getIdToken().catch(() => null);
    if (!idToken) return;
    setTestingPipeline(true);
    setNotice(null);
    try {
      const res = await fetch('/api/mirrorbot/meta-diagnostics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          action: 'test_pipeline',
          message: 'হ্যালো, MirrorBook-এর সার্ভিস সম্পর্কে জানতে চাই।',
        }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setNotice({
          type: 'ok',
          text: `AI pipeline passed in ${json.latencyMs || 0}ms (${json.modelUsed || 'Gemini'}): "${String(json.replies?.[0] || '').slice(0, 120)}"`,
        });
        await runDiagnostics(false);
      } else {
        setNotice({ type: 'err', text: json?.error || 'AI pipeline test failed.' });
      }
    } catch {
      setNotice({ type: 'err', text: 'Network error running AI pipeline test.' });
    } finally {
      setTestingPipeline(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    if (status === 'PASS') {
      return (
        <span className="inline-flex items-center gap-1 rounded-md border border-[#4ADE80]/35 bg-[#4ADE80]/10 px-2 py-0.5 text-[11px] font-bold text-[#4ADE80]">
          <CheckCircle2 size={12} />
          PASS
        </span>
      );
    }
    if (status === 'CONFIGURED' || status === 'SKIPPED') {
      return (
        <span className="inline-flex items-center gap-1 rounded-md border border-amber-400/35 bg-amber-400/10 px-2 py-0.5 text-[11px] font-bold text-amber-300">
          <AlertTriangle size={12} />
          {status}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-red-500/35 bg-red-500/10 px-2 py-0.5 text-[11px] font-bold text-red-400">
        <XCircle size={12} />
        FAIL
      </span>
    );
  };

  return (
    <section className="rounded-2xl border border-[#B7F34A]/20 bg-[#121614] overflow-hidden">
      <button
        type="button"
        onClick={handleToggleOpen}
        className="w-full flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#B7F34A]/30 bg-[#B7F34A]/10 text-[#B7F34A]">
            <Activity size={16} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#F5F7F2]">
                {t('Admin Messenger Webhook Diagnostics', 'অ্যাডমিন মেসেঞ্জার ওয়েবহুক ডায়াগনস্টিকস')}
              </h3>
              <span className="inline-flex items-center gap-1 rounded border border-[#B7F34A]/30 bg-[#B7F34A]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#B7F34A]">
                <ShieldCheck size={10} />
                Admin Only
              </span>
            </div>
            <p className="text-xs text-[#A1AAA2]">
              {t(
                'Inspect live Meta Page Token, subscribed_apps, Gemini AI readiness, and 10-stage Messenger trace logs.',
                'লাইভ Meta পেজ টোকেন, subscribed_apps, Gemini AI এবং ১০-ধাপের মেসেঞ্জার ট্রেস লগ দেখুন।'
              )}
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold text-[#B7F34A]">
          {expanded ? t('Hide', 'লুকান') : t('Open Diagnostics', 'ডায়াগনস্টিকস খুলুন')}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-white/[0.08] px-5 py-5 space-y-5">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => runDiagnostics(true)}
              disabled={loading}
              className="inline-flex min-h-[38px] items-center gap-2 rounded-lg bg-[#B7F34A] px-3.5 py-2 text-xs font-bold text-[#0B0D0C] hover:opacity-90 disabled:opacity-50 cursor-pointer"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              <span>{t('Run Full Live Check', 'ফুল লাইভ চেক চালান')}</span>
            </button>

            <button
              type="button"
              onClick={handleResubscribe}
              disabled={resubscribing}
              className="inline-flex min-h-[38px] items-center gap-2 rounded-lg border border-white/[0.14] bg-[#0B0D0C] px-3.5 py-2 text-xs font-semibold text-[#F5F7F2] hover:border-[#B7F34A]/50 disabled:opacity-50 cursor-pointer"
            >
              {resubscribing ? <Loader2 size={14} className="animate-spin" /> : <Wrench size={14} />}
              <span>{t('Re-Subscribe Page Webhook', 'পেজ ওয়েবহুক রি-সাবস্ক্রাইব')}</span>
            </button>

            <button
              type="button"
              onClick={handlePipelineTest}
              disabled={testingPipeline}
              className="inline-flex min-h-[38px] items-center gap-2 rounded-lg border border-white/[0.14] bg-[#0B0D0C] px-3.5 py-2 text-xs font-semibold text-[#F5F7F2] hover:border-[#B7F34A]/50 disabled:opacity-50 cursor-pointer"
            >
              {testingPipeline ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
              <span>{t('Test Bangla AI Pipeline', 'বাংলা AI পাইপলাইন টেস্ট')}</span>
            </button>
          </div>

          {notice && (
            <div
              className={`rounded-xl border px-3.5 py-2.5 text-xs ${
                notice.type === 'ok'
                  ? 'border-[#4ADE80]/30 bg-[#4ADE80]/10 text-[#C6F6D5]'
                  : 'border-red-500/35 bg-red-500/10 text-red-200'
              }`}
            >
              {notice.text}
            </div>
          )}

          {data && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-xl border border-white/[0.08] bg-[#0B0D0C] p-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#F5F7F2]">Page Access Token</span>
                    {renderStatusBadge(data.pageTokenCheck.status)}
                  </div>
                  <div className="text-[11px] text-[#A1AAA2] space-y-1">
                    <p>Source: {data.pageTokenCheck.source}</p>
                    <p>Page ID: {data.pageTokenCheck.pageId || 'Not set'}</p>
                    <p>Type: {data.pageTokenCheck.tokenType || 'Unknown'}</p>
                    <p>pages_messaging: {data.pageTokenCheck.hasPagesMessaging ? 'Granted' : 'Missing/Unverified'}</p>
                    {data.pageTokenCheck.error?.message && (
                      <p className="text-red-300 break-words">
                        Error {data.pageTokenCheck.error.code ? `#${data.pageTokenCheck.error.code}` : ''}:{' '}
                        {data.pageTokenCheck.error.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-white/[0.08] bg-[#0B0D0C] p-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#F5F7F2]">Page Webhook Subscription</span>
                    {renderStatusBadge(data.subscriptionCheck.status)}
                  </div>
                  <div className="text-[11px] text-[#A1AAA2] space-y-1">
                    <p>App Subscribed: {data.subscriptionCheck.appSubscribed ? 'Yes' : 'No'}</p>
                    <p>messages: {data.subscriptionCheck.messagesSubscribed ? 'Active' : 'Missing'}</p>
                    <p>postbacks: {data.subscriptionCheck.postbacksSubscribed ? 'Active' : 'Missing'}</p>
                    <p>feed: {data.subscriptionCheck.feedSubscribed ? 'Active' : 'Optional/Off'}</p>
                    {data.subscriptionCheck.error?.message && (
                      <p className="text-red-300 break-words">{data.subscriptionCheck.error.message}</p>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-white/[0.08] bg-[#0B0D0C] p-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#F5F7F2]">Gemini AI & Env</span>
                    {renderStatusBadge(data.geminiCheck.status)}
                  </div>
                  <div className="text-[11px] text-[#A1AAA2] space-y-1">
                    <p>Model: {data.geminiCheck.model}</p>
                    <p>Graph API: {String(data.envStatus.GRAPH_API_VERSION || 'v21.0')}</p>
                    <p>
                      Firebase Admin: {data.envStatus.FIREBASE_SERVICE_ACCOUNT_KEY ? 'Configured' : 'Missing'}
                    </p>
                    {data.geminiCheck.latencyMs !== null && (
                      <p>Latency: {data.geminiCheck.latencyMs}ms</p>
                    )}
                    {data.geminiCheck.error && (
                      <p className="text-red-300 break-words">{data.geminiCheck.error}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-amber-400/25 bg-amber-400/[0.06] px-3.5 py-2.5 text-[11px] text-amber-200 leading-relaxed">
                <strong>External Facebook Accounts Note:</strong> {data.externalUserRequirementNote}
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#F5F7F2]">
                  Recent 10-Stage Messenger Trace Logs ({data.diagnosticEvents.length})
                </h4>
                {data.diagnosticEvents.length === 0 ? (
                  <p className="text-xs text-[#707A72]">
                    No webhook trace events recorded yet on this server instance.
                  </p>
                ) : (
                  <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
                    {data.diagnosticEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className="rounded-lg border border-white/[0.07] bg-[#0B0D0C] px-3 py-2 text-[11px] flex flex-wrap items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`font-mono font-bold ${
                                ev.success ? 'text-[#B7F34A]' : 'text-red-400'
                              }`}
                            >
                              {ev.stage}
                            </span>
                            {ev.pageId && (
                              <span className="text-[#707A72] font-mono">page:{ev.pageId}</span>
                            )}
                            {typeof ev.durationMs === 'number' && (
                              <span className="text-[#707A72]">{ev.durationMs}ms</span>
                            )}
                            {ev.errorCode && (
                              <span className="text-red-300 font-mono">
                                code:{ev.errorCode}
                                {ev.errorSubcode ? `/${ev.errorSubcode}` : ''}
                              </span>
                            )}
                          </div>
                          {ev.detail && <p className="text-[#A1AAA2] break-words">{ev.detail}</p>}
                        </div>
                        <span className="text-[10px] text-[#707A72] shrink-0">
                          {new Date(ev.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
};
