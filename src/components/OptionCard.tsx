import { useState } from 'react';
import AwardMileageLookup from './AwardMileageLookup';
import FlightDetailsFields from './FlightDetailsFields';
import { useTranslation } from 'react-i18next';
import { Button, Card, Form, Message } from 'semantic-ui-react';
import {
  calculate,
  cabinsFor,
  cabinLabel,
  normalizeCabin,
  targetFor,
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
  const locale = i18n.resolvedLanguage ?? 'en';
  const money = (n: number | null, maximumFractionDigits = 0) =>
    n === null
      ? '—'
      : new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: 'JPY',
          maximumFractionDigits,
        }).format(n);
  const decimal = (n: number | null) =>
    n === null
      ? '—'
      : new Intl.NumberFormat(locale, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(n);
  const target = targetFor(option, targets);
  const result = calculate(option, target);
  const status = result.recommendation ?? (result.estimated === null ? 'incomplete' : 'needCash');
  const update = <K extends keyof FlightOption>(key: K, value: FlightOption[K]) =>
    onChange(normalizeCabin({ ...option, [key]: value }));
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
  function selectField<K extends 'airline' | 'cashAirline' | 'region' | 'trip' | 'awardCabin'>(
    key: K,
    values: readonly FlightOption[K][],
  ) {
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
              {value === ''
                ? t('notSpecified')
                : value === 'JAL' || value === 'ANA'
                  ? value
                  : key === 'awardCabin'
                    ? t(
                        cabinLabel(
                          option.airline,
                          option.region,
                          value as FlightOption['awardCabin'],
                        ),
                      )
                    : t(value)}
            </option>
          ))}
        </select>
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
      <Card.Content
        className={`result ${status === 'useCash' ? 'cash' : status === 'useMiles' ? 'miles' : 'neutral'}`}
        aria-live="polite"
        aria-atomic="true"
      >
        <h2 className="decision-title">{t(status)}</h2>
        {result.difference !== null && result.recommendation !== 'equal' && (
          <p className="decision-difference">
            {t('difference', { amount: money(Math.abs(result.difference), 2) })}
          </p>
        )}
        {result.recommendation !== null && <p className="hint">{t('valuationNote')}</p>}
        <dl className="decision-metrics">
          <div>
            <dt>{t('estimated')}</dt>
            <dd>{money(result.estimated)}</dd>
          </div>
          <div>
            <dt>{t('value')}</dt>
            <dd>
              <span>{decimal(result.value)}</span> <small>{t('unit')}</small>
            </dd>
          </div>
          <div>
            <dt>{t('targetUsed')}</dt>
            <dd>
              {decimal(target)} <small>{t('unit')}</small>
            </dd>
            <span className="hint">
              {option.airline} · {t(option.region)} ·{' '}
              {t(cabinLabel(option.airline, option.region, option.awardCabin))}
            </span>
          </div>
        </dl>
      </Card.Content>
      <Card.Content>
        <Form onSubmit={(e) => e.preventDefault()}>
          <div className="field-grid itinerary-fields">
            {selectField('trip', ['one', 'round'])}
            {selectField('region', ['domestic', 'international'])}
          </div>
          <p className="hint comparison-hint">{t('comparisonHint')}</p>
          <div className="ticket-choices">
            <section className="ticket-choice" aria-labelledby={`${option.id}-cash-heading`}>
              <h3 id={`${option.id}-cash-heading`}>{t('payCash')}</h3>
              <div className="field-grid">
                {numberField('cash', true)}
                <div className="full">{selectField('cashAirline', ['', 'JAL', 'ANA'])}</div>
              </div>
              <FlightDetailsFields
                id={`${option.id}-cash`}
                details={option.cashFlight}
                roundTrip={option.trip === 'round'}
                onChange={(details) => update('cashFlight', details)}
              />
            </section>
            <section className="ticket-choice" aria-labelledby={`${option.id}-award-heading`}>
              <h3 id={`${option.id}-award-heading`}>{t('redeemMiles')}</h3>
              <div className="field-grid">
                <div className="full">{selectField('airline', ['JAL', 'ANA'])}</div>
                <div className="full">
                  {selectField('awardCabin', cabinsFor(option.airline, option.region))}
                </div>
                <div className="full">
                  <AwardMileageLookup
                    option={option}
                    onChange={(next) => {
                      setInvalid((previous) => {
                        const result = { ...previous };
                        delete result.miles;
                        return result;
                      });
                      onChange(next);
                    }}
                  />
                </div>
                {numberField('miles', true)}
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
              <p className="hint">{t('feeHint')}</p>
              {option.feeMode === 'detail' && option.total !== '' && (
                <p className="hint">{t('splitHint')}</p>
              )}
              <FlightDetailsFields
                id={`${option.id}-award`}
                details={option.awardFlight}
                roundTrip={option.trip === 'round'}
                onChange={(details) => update('awardFlight', details)}
              />
            </section>
          </div>
          {Object.keys(invalid).length > 0 && (
            <Message negative size="tiny" id={`${option.id}-error`}>
              {t('numberError')}
            </Message>
          )}
        </Form>
      </Card.Content>
    </Card>
  );
}
