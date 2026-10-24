import { Form } from 'semantic-ui-react';
import { useTranslation } from 'react-i18next';
import type { FlightDetails } from '../domain/model';

interface Props {
  id: string;
  details: FlightDetails;
  roundTrip: boolean;
  onChange: (details: FlightDetails) => void;
}

export default function FlightDetailsFields({ id, details, roundTrip, onChange }: Props) {
  const { t } = useTranslation();
  const field = (key: keyof FlightDetails, type = 'text', wide = false) => (
    <Form.Field className={wide ? 'full' : ''}>
      <label htmlFor={`${id}-${key}`}>{t(key)}</label>
      <input
        id={`${id}-${key}`}
        type={type}
        maxLength={300}
        value={details[key]}
        onChange={(event) => onChange({ ...details, [key]: event.target.value })}
      />
    </Form.Field>
  );
  return (
    <details className="labels">
      <summary>{t('labels')}</summary>
      <div className="field-grid">
        {field('route', 'text', true)}
        {field('flightNumbers', 'text', true)}
        {field('departure', 'date')}
        {roundTrip && field('returning', 'date')}
        {field('cabin', 'text', true)}
      </div>
    </details>
  );
}
