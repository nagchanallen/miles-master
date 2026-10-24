import { useTranslation } from 'react-i18next';
import { Button, Form } from 'semantic-ui-react';
import {
  CITIES,
  CHART_CHECKED,
  CHART_SOURCES,
  estimateAward,
  needsSeason,
  type AwardLookup,
} from '../domain/awardChart';
import type { FlightOption } from '../domain/model';

export default function AwardMileageLookup({
  option,
  onChange,
}: {
  option: FlightOption;
  onChange: (option: FlightOption) => void;
}) {
  const { t, i18n } = useTranslation();
  const lookup = option.awardLookup;
  const estimate = estimateAward({
    ...lookup,
    airline: option.airline,
    region: option.region,
    cabin: option.awardCabin,
    trip: option.trip,
  });
  const select = (key: keyof AwardLookup, values: readonly string[]) => (
    <Form.Field className={key === 'origin' || key === 'destination' ? 'full' : ''}>
      <label htmlFor={`${option.id}-lookup-${key}`}>{t(`lookup_${key}`)}</label>
      <select
        id={`${option.id}-lookup-${key}`}
        value={lookup[key]}
        onChange={(e) => onChange({ ...option, awardLookup: { ...lookup, [key]: e.target.value } })}
      >
        <option value="">{t('choose')}</option>
        {values.map((value) => (
          <option key={value} value={value}>
            {t(value)}
          </option>
        ))}
      </select>
    </Form.Field>
  );
  return (
    <details className="labels mileage-lookup">
      <summary>{t('lookupTitle')}</summary>
      <p className="hint">{t('lookupScope')}</p>
      {option.region === 'international' ? (
        <>
          <div className="field-grid">
            {select('origin', CITIES)}
            {select('destination', CITIES)}
            {needsSeason(option.airline, option.awardCabin) && (
              <>
                {select('outbound', ['low', 'regular', 'high'])}
                {option.trip === 'round' && select('inbound', ['low', 'regular', 'high'])}
              </>
            )}
          </div>
          <p className="hint">{t('lookupSeasonHint')}</p>
          <p role="status">
            {estimate === null
              ? t('lookupUnavailable')
              : t('lookupEstimate', {
                  miles: new Intl.NumberFormat(i18n.resolvedLanguage).format(estimate),
                })}
          </p>
          <Button
            type="button"
            size="small"
            disabled={estimate === null}
            onClick={() => {
              if (estimate !== null)
                onChange({
                  ...option,
                  miles: estimate,
                  awardFlight: {
                    ...option.awardFlight,
                    route: `${lookup.origin} → ${lookup.destination}`,
                  },
                });
            }}
          >
            {t('applyMiles')}
          </Button>
        </>
      ) : (
        <p>{t('lookupUnavailable')}</p>
      )}
      <p className="hint">{t(option.airline === 'JAL' ? 'jalChartHint' : 'anaChartHint')}</p>
      <p className="hint">{t('lookupEditHint')}</p>
      <a href={CHART_SOURCES[option.airline]} target="_blank" rel="noreferrer">
        {t('officialChart', { airline: option.airline })}
      </a>
      <p className="hint">{t('chartChecked', { date: CHART_CHECKED })}</p>
    </details>
  );
}
