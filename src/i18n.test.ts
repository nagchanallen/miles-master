import { describe, expect, it } from 'vitest';
import en from './locales/en.json';
import ja from './locales/ja.json';
import zhHK from './locales/zh-HK.json';
import i18n from './i18n';

describe('supported translations', () => {
  it.each([
    ['ja', ja],
    ['zh-HK', zhHK],
  ] as const)('%s provides matching keys and interpolation placeholders', (_, translation) => {
    expect(Object.keys(translation).sort()).toEqual(Object.keys(en).sort());
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      expect(translation[key].trim()).not.toBe('');
      expect(translation[key].match(/{{\w+}}/g)).toEqual(en[key].match(/{{\w+}}/g));
    }
  });
  it('translates numbered option controls in all languages', () => {
    expect(i18n.t('removeOption', { lng: 'en', number: 2 })).toBe('Remove comparison 2');
    expect(i18n.t('removeOption', { lng: 'ja', number: 2 })).toBe('比較2を削除');
    expect(i18n.t('removeOption', { lng: 'zh-HK', number: 2 })).toBe('刪除比較 2');
  });
});
