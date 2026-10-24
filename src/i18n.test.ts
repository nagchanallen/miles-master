import { describe, expect, it } from 'vitest';
import en from './locales/en.json';
import ja from './locales/ja.json';
import i18n from './i18n';

describe('Japanese and English translations', () => {
  it('provides matching keys and interpolation placeholders', () => {
    expect(Object.keys(ja).sort()).toEqual(Object.keys(en).sort());
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      expect(ja[key].trim()).not.toBe('');
      expect(ja[key].match(/{{\w+}}/g)).toEqual(en[key].match(/{{\w+}}/g));
    }
  });
  it('translates numbered option controls in both languages', () => {
    expect(i18n.t('removeOption', { lng: 'en', number: 2 })).toBe('Remove comparison 2');
    expect(i18n.t('removeOption', { lng: 'ja', number: 2 })).toBe('比較2を削除');
  });
});
