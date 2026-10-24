import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, Form, Message } from 'semantic-ui-react';
import {
  calculate,
  switchFeeMode,
  validAmount,
  type FlightOption,
  type Targets,
} from '../domain/model';

type NumberKey = 'cash' | 'miles' | 'total' | 'fuel' | 'taxes' | 'other';
interface Props {
  option: FlightOption;
  index: number;
  targets: Targets;
  onChange: (option: FlightOption) => void;
  onRemove: () => void;
}

export default function OptionCard({ option, index, targets, onChange, onRemove }: Props) {
  const { t, i18n } = useTranslation();
  const [invalid, setInvalid] = useState<Partial<Record<NumberKey, string>>>({});
  const locale = i18n.language === 'ja' ? 'ja-JP' : 'en-US';
  const money = (n: number | null) =>
    n === null
      ? '—'
      : new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: 'JPY',
          maximumFractionDigits: 0,
        }).format(n);
  const decimal = (n: number | null) =>
    n === null
      ? '—'
      : new Intl.NumberFormat(locale, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(n);
  const target = targets[option.airline][option.region];
  const result = calculate(option, target);
  const status = result.recommendation ?? (result.estimated === null ? 'incomplete' : 'needCash');
  const update = <K extends keyof FlightOption>(key: K, value: FlightOption[K]) =>
    onChange({ ...option, [key]: value });
  function numberField(key: NumberKey, wide = false) {
    const inputId = `${option.id}-${key}`;
    return (
      <Form.Field className={wide ? 'full' : ''} error={invalid[key] !== undefined}>
        <label htmlFor={inputId}>{t(key)}</label>
        <input
          id={inputId}
          type="number"
          inputMode="numeric"
          min="0"
          max="1000000000000"
          step="1"
          value={invalid[key] ?? option[key]}
          aria-invalid={invalid[key] !== undefined}
          aria-describedby={invalid[key] !== undefined ? `${option.id}-error` : undefined}
          onChange={(e) => {
            const raw = e.target.value,
              numeric = Number(raw),
              valid = !e.target.validity.badInput && (raw === '' || validAmount(numeric));
            setInvalid((previous) => {
              const next = { ...previous };
              if (valid) delete next[key];
              else next[key] = raw;
              return next;
            });
            update(key, valid && raw !== '' ? numeric : '');
          }}
        />
      </Form.Field>
    );
  }
  function selectField<K extends 'airline' | 'region' | 'trip'>(key: K, values: FlightOption[K][]) {
    return (
      <Form.Field>
        <label htmlFor={`${option.id}-${key}`}>{t(key)}</label>
        <select
          id={`${option.id}-${key}`}
          value={option[key]}
          onChange={(e) => update(key, e.target.value as FlightOption[K])}
        >
          {values.map((value) => (
            <option key={value} value={value}>
              {value === 'JAL' || value === 'ANA' ? value : t(value)}
            </option>
          ))}
        </select>
      </Form.Field>
    );
  }
  function labelField(
    key: 'route' | 'departure' | 'returning' | 'cabin',
    type = 'text',
    wide = false,
  ) {
    return (
      <Form.Field className={wide ? 'full' : ''}>
        <label htmlFor={`${option.id}-${key}`}>{t(key)}</label>
        <input
          id={`${option.id}-${key}`}
          type={type}
          maxLength={300}
          value={option[key]}
          onChange={(e) => update(key, e.target.value)}
        />
      </Form.Field>
    );
  }
  return (
    <Card as="article" fluid className="flight-card" aria-label={`${t('option')} ${index + 1}`}>
      <Card.Content className="card-heading">
        <span className="option-number">
          {t('option')} {String(index + 1).padStart(2, '0')}
        </span>
        <Button
          type="button"
          basic
          size="mini"
          color="red"
          aria-label={t('removeOption', { number: index + 1 })}
          onClick={onRemove}
        >
          {t('remove')}
        </Button>
      </Card.Content>
      <Card.Content>
        <Form onSubmit={(e) => e.preventDefault()}>
          <div className="field-grid">
            {selectField('airline', ['JAL', 'ANA'])}
            {selectField('region', ['domestic', 'international'])}
            {selectField('trip', ['one', 'round'])}
          </div>
          <div className="section-label">{t('pricing')} · JPY</div>
          <div className="field-grid">
            {numberField('cash')}
            {numberField('miles')}
            {option.feeMode === 'total' ? (
              numberField('total', true)
            ) : (
              <>
                {numberField('fuel')}
                {numberField('taxes')}
                {numberField('other', true)}
              </>
            )}
          </div>
          <button
            type="button"
            className="fee-toggle"
            onClick={() => {
              setInvalid({});
              onChange(switchFeeMode(option));
            }}
          >
            {t(option.feeMode === 'total' ? 'detail' : 'simple')}
          </button>
          <p className="hint">{t(option.feeMode === 'detail' ? 'splitHint' : 'feeHint')}</p>
          {Object.keys(invalid).length > 0 && (
            <Message negative size="tiny" id={`${option.id}-error`}>
              {t('numberError')}
            </Message>
          )}
          <details className="labels">
            <summary>{t('labels')}</summary>
            <div className="field-grid">
              {labelField('route', 'text', true)}
              {labelField('departure', 'date')}
              {option.trip === 'round' && labelField('returning', 'date')}
              {labelField('cabin', 'text', true)}
            </div>
          </details>
        </Form>
      </Card.Content>
      <Card.Content className="result" aria-live="polite" aria-atomic="true">
        <div className="metric-label">{t('value')}</div>
        <div className="value">
          <span>{decimal(result.value)}</span> <small>{t('unit')}</small>
        </div>
        <div className="result-row">
          <span>{t('estimated')}</span>
          <strong>{money(result.estimated)}</strong>
        </div>
        <div className="result-row">
          <span>{t('targetUsed')}</span>
          <span>
            {decimal(target)} {t('unit')}
          </span>
        </div>
        <div className="result-row">
          <span>{t('feeTotal')}</span>
          <span>{money(result.fees)}</span>
        </div>
        <div
          className={`recommendation ${status === 'useCash' ? 'cash' : status === 'useMiles' ? 'miles' : 'neutral'}`}
        >
          {t(status)}
        </div>
      </Card.Content>
    </Card>
  );
}
