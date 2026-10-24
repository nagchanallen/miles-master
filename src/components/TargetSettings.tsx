import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Form } from 'semantic-ui-react';
import { validTarget, type Airline, type Region, type Targets } from '../domain/model';

export default function TargetSettings({
  targets,
  onChange,
}: {
  targets: Targets;
  onChange: (targets: Targets) => void;
}) {
  const { t } = useTranslation();
  const [invalid, setInvalid] = useState<Record<string, string>>({});
  return (
    <details className="settings">
      <summary>
        {t('targets')} <span className="optional">· JPY / mile</span>
      </summary>
      <Form className="targets" onSubmit={(e) => e.preventDefault()}>
        {(['JAL', 'ANA'] as Airline[]).flatMap((airline) =>
          (['domestic', 'international'] as Region[]).map((region) => {
            const key = `${airline}-${region}`;
            return (
              <Form.Field key={key} error={key in invalid}>
                <label htmlFor={key}>
                  {airline} · {t(region)}
                </label>
                <input
                  id={key}
                  type="number"
                  min="0.01"
                  max="10000"
                  step="0.01"
                  inputMode="decimal"
                  value={invalid[key] ?? targets[airline][region]}
                  aria-invalid={key in invalid}
                  aria-describedby={key in invalid ? 'target-error' : undefined}
                  onChange={(e) => {
                    const raw = e.target.value,
                      value = Number(raw);
                    if (!raw || !validTarget(value) || !e.target.validity.valid)
                      setInvalid((previous) => ({ ...previous, [key]: raw }));
                    else {
                      setInvalid((previous) => {
                        const next = { ...previous };
                        delete next[key];
                        return next;
                      });
                      onChange({ ...targets, [airline]: { ...targets[airline], [region]: value } });
                    }
                  }}
                />
              </Form.Field>
            );
          }),
        )}
      </Form>
      <p className="hint">{t('examples')}</p>
      {Object.keys(invalid).length > 0 && (
        <p role="alert" id="target-error">
          {t('targetError')}
        </p>
      )}
    </details>
  );
}
