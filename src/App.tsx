import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Form, Message } from 'semantic-ui-react';
import './i18n';
import {
  initialState,
  MAX_BACKUP_BYTES,
  MAX_ITEMS,
  newComparison,
  newOption,
  parseBackup,
  serializeBackup,
  type AppState,
  type Language,
} from './domain/model';
import { loadState, saveState } from './storage';
import OptionCard from './components/OptionCard';
import TargetSettings from './components/TargetSettings';

export function downloadBackup(contents: string, filename: string) {
  const url = URL.createObjectURL(new Blob([contents], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
// FileReader also works in browsers without File.text().
function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

export default function App() {
  const [loaded] = useState(loadState);
  const [state, setState] = useState<AppState>(loaded.state);
  const [recovery, setRecovery] = useState(loaded.recovery);
  const [saveError, setSaveError] = useState(loaded.error === 'unavailable');
  const [status, setStatus] = useState('');
  const [generation, setGeneration] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const { t, i18n } = useTranslation();
  const group = state.groups.find((g) => g.id === state.selected)!;

  useEffect(() => {
    void i18n.changeLanguage(state.language);
    document.documentElement.lang = state.language;
  }, [state.language, i18n]);
  useEffect(() => {
    if (recovery === null) setSaveError(!saveState(state));
  }, [state, recovery]);

  function updateGroup(change: Partial<typeof group>) {
    setState((previous) => ({
      ...previous,
      groups: previous.groups.map((g) => (g.id === group.id ? { ...g, ...change } : g)),
    }));
  }
  function addGroup() {
    if (state.groups.length >= MAX_ITEMS) {
      setStatus(t('groupLimit'));
      return;
    }
    const next = newComparison();
    setState({ ...state, groups: [...state.groups, next], selected: next.id });
  }
  function deleteGroup() {
    if (!window.confirm(t('confirmGroup'))) return;
    const remaining = state.groups.filter((g) => g.id !== group.id);
    const groups = remaining.length ? remaining : [newComparison()];
    setState({ ...state, groups, selected: groups[0].id });
  }
  async function importFile(file: File) {
    try {
      if (file.size > MAX_BACKUP_BYTES) throw Error('Too large');
      const next = parseBackup(await readFile(file));
      if (!window.confirm(t('confirmImport'))) return;
      setRecovery(null);
      setState(next);
      setGeneration((n) => n + 1);
      setStatus(t('imported'));
    } catch {
      setStatus(t('invalid'));
    }
  }

  return (
    <div className="miles-app">
      <header className="topbar">
        <a className="brand" href="./">
          <span className="brand-icon" aria-hidden="true">
            ↗
          </span>{' '}
          Miles Master
        </a>
        <label className="language">
          <span className="sr-only">Language / 言語 / 語言</span>
          <select
            value={state.language}
            onChange={(e) => setState({ ...state, language: e.target.value as Language })}
          >
            <option value="ja">日本語</option>
            <option value="en">English</option>
            <option value="zh-HK">繁體中文（香港）</option>
          </select>
        </label>
      </header>
      <main>
        <div className="eyebrow">{t('eyebrow')}</div>
        <h1>{t('title')}</h1>
        <p className="intro">{t('intro')}</p>
        {recovery !== null && (
          <Message warning>
            <p>{t('corrupt')}</p>
            <Button
              type="button"
              size="small"
              onClick={() => downloadBackup(recovery, 'miles-master-recovery.json')}
            >
              {t('recovery')}
            </Button>
            <Button
              type="button"
              size="small"
              onClick={() => {
                if (window.confirm(t('confirmReset'))) {
                  setRecovery(null);
                  setState(initialState());
                  setGeneration((n) => n + 1);
                }
              }}
            >
              {t('reset')}
            </Button>
          </Message>
        )}
        {saveError && (
          <Message warning role="alert">
            {t('storage')}
          </Message>
        )}
        <TargetSettings
          key={`targets-${generation}`}
          targets={state.targets}
          onChange={(targets) => setState({ ...state, targets })}
        />
        <div className="workspace">
          <aside className="sidebar">
            <h2>{t('groups')}</h2>
            <nav aria-label={t('groups')} className="group-list">
              {state.groups.map((g, index) => (
                <Button
                  type="button"
                  key={g.id}
                  className={`group-button ${g.id === state.selected ? 'active' : ''}`}
                  aria-current={g.id === state.selected ? 'true' : undefined}
                  onClick={() => setState({ ...state, selected: g.id })}
                >
                  {g.name || `${t('unnamed')} ${index + 1}`}
                </Button>
              ))}
            </nav>
            <Button type="button" basic className="add-group" onClick={addGroup}>
              {t('newGroup')}
            </Button>
            <div className="backup">
              <p className="hint">{saveError || recovery !== null ? t('storage') : t('backup')}</p>
              <Button
                type="button"
                basic
                size="small"
                onClick={() =>
                  downloadBackup(
                    serializeBackup(state),
                    `miles-master-${new Date().toISOString().slice(0, 10)}.json`,
                  )
                }
              >
                {t('export')}
              </Button>
              <Button type="button" basic size="small" onClick={() => input.current?.click()}>
                {t('import')}
              </Button>
              <p className="hint">{t('backupHint')}</p>
            </div>
          </aside>
          <section aria-label={t('groups')}>
            <div className="workspace-top">
              <Form onSubmit={(e) => e.preventDefault()}>
                <Form.Field>
                  <label htmlFor="comparison-name">{t('comparisonName')}</label>
                  <input
                    id="comparison-name"
                    className="group-name"
                    maxLength={200}
                    value={group.name}
                    placeholder={t('unnamed')}
                    onChange={(e) => updateGroup({ name: e.target.value })}
                  />
                </Form.Field>
              </Form>
              <div className="actions">
                <Button type="button" basic size="small" color="red" onClick={deleteGroup}>
                  {t('deleteGroup')}
                </Button>
                <Button
                  type="button"
                  color="teal"
                  onClick={() => {
                    if (group.options.length >= MAX_ITEMS) setStatus(t('groupLimit'));
                    else updateGroup({ options: [...group.options, newOption()] });
                  }}
                >
                  {t('add')}
                </Button>
              </div>
            </div>
            <p className="hint">{t('perPerson')}</p>
            <div className="cards">
              {group.options.map((option, index) => (
                <OptionCard
                  key={`${generation}-${option.id}`}
                  option={option}
                  index={index}
                  targets={state.targets}
                  onChange={(next) =>
                    updateGroup({
                      options: group.options.map((o) => (o.id === next.id ? next : o)),
                    })
                  }
                  onRemove={() => {
                    if (window.confirm(t('confirmOption')))
                      updateGroup({ options: group.options.filter((o) => o.id !== option.id) });
                  }}
                />
              ))}
              {group.options.length === 0 && <div className="empty">{t('empty')}</div>}
            </div>
            <div className="formula">
              <p>{t('formula1')}</p>
              <p>{t('formula2')}</p>
            </div>
          </section>
        </div>
        <footer className="footer">{t('footer')}</footer>
        <div className="status" role="status" aria-live="polite">
          {status && <Message onDismiss={() => setStatus('')}>{status}</Message>}
        </div>
        <input
          ref={input}
          type="file"
          aria-label={t('importFile')}
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void importFile(file);
            e.target.value = '';
          }}
        />
      </main>
    </div>
  );
}
