import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import i18n from './i18n';
import { initialState, parseBackup, serializeBackup } from './domain/model';
import { STORAGE_KEY } from './storage';

beforeEach(async () => {
  await i18n.changeLanguage('en');
});
const startEnglish = () => {
  const state = initialState();
  state.language = 'en';
  state.targets.JAL.domestic.economy = 1.5;
  localStorage.setItem(STORAGE_KEY, serializeBackup(state));
  return render(<App />);
};
function enter(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label, { exact: true }), { target: { value } });
}

describe('comparison workflow', () => {
  it('supports Hong Kong Traditional Chinese throughout the UI, reloads, and backups', async () => {
    const user = userEvent.setup();
    const view = startEnglish();
    enter('Miles required', '20000');
    enter('Award ticket cash payment', '5000');
    await user.selectOptions(screen.getByLabelText(/Language.*言語/), 'zh-HK');
    expect(
      await screen.findByRole('heading', { name: '這個行程，用現金還是里數？' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('region', { name: '現金購票' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: '里數換票' })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('zh-HK');
    const price = new Intl.NumberFormat('zh-HK', { style: 'currency', currency: 'JPY' }).format(
      35000,
    );
    expect(screen.getByText(price)).toBeInTheDocument();
    const backup = localStorage.getItem(STORAGE_KEY)!;
    expect(parseBackup(backup).language).toBe('zh-HK');
    view.unmount();
    render(<App />);
    expect(screen.getByRole('heading', { name: '這個行程，用現金還是里數？' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Language.*言語/)).toHaveValue('zh-HK');
  });
  it('calculates a redemption and switches the applicable target', async () => {
    startEnglish();
    enter('Cash fare (optional)', '50000');
    enter('Miles required', '20000');
    enter('Award ticket cash payment', '5000');
    expect(screen.getByText('2.25')).toBeInTheDocument();
    expect(screen.getByText('¥35,000')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Flight type'), { target: { value: 'international' } });
    expect(screen.getByText('¥45,000')).toBeInTheDocument();
    expect(screen.getByText('Miles favored')).toBeInTheDocument();
    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).groups[0].options[0].miles).toBe(20000),
    );
  });
  it('supports comparison groups, multiple options, and labels', async () => {
    const user = userEvent.setup();
    startEnglish();
    enter('Trip name', 'Sapporo winter');
    await user.click(screen.getByRole('button', { name: 'Add comparison' }));
    expect(screen.getAllByRole('article')).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: 'New trip' }));
    expect(screen.getAllByRole('article')).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: 'Sapporo winter' }));
    expect(screen.getAllByRole('article')).toHaveLength(2);
  });
  it('changes both the UI language and the document language', async () => {
    const user = userEvent.setup();
    startEnglish();
    await user.selectOptions(screen.getByLabelText(/Language.*言語/), 'ja');
    expect(
      await screen.findByRole('heading', { name: 'この旅、現金とマイルどちらがお得？' }),
    ).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('ja');
  });
  it('can estimate without cash and supports detailed fuel charges', async () => {
    const user = userEvent.setup();
    startEnglish();
    enter('Miles required', '20000');
    enter('Award ticket cash payment', '5000');
    expect(screen.getByText('¥35,000')).toBeInTheDocument();
    expect(screen.getByText('Add a cash fare to compare')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Enter a detailed fee breakdown' }));
    enter('Fuel surcharge', '3000');
    enter('Taxes', '1500');
    enter('Other fees', '500');
    expect(screen.getByText('¥35,000')).toBeInTheDocument();
    enter('Cash fare (optional)', '50000');
    expect(screen.getByText('2.25')).toBeInTheDocument();
  });
  it('clears results for invalid values instead of showing stale recommendations', () => {
    startEnglish();
    enter('Cash fare (optional)', '50000');
    enter('Miles required', '20000');
    enter('Award ticket cash payment', '5000');
    enter('Miles required', '-1');
    expect(screen.queryByText('2.25')).not.toBeInTheDocument();
    expect(screen.queryByText('Miles favored')).not.toBeInTheDocument();
  });
  it('confirms deletion and keeps a usable comparison after deleting the final group', async () => {
    const user = userEvent.setup();
    startEnglish();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    await user.click(screen.getByRole('button', { name: 'Remove comparison 1' }));
    expect(screen.queryAllByRole('article')).toHaveLength(0);
    await user.click(screen.getByRole('button', { name: 'Delete trip' }));
    expect(screen.getAllByRole('article')).toHaveLength(1);
  });
  it('imports a backup only after confirmation and rejects invalid JSON', async () => {
    const user = userEvent.setup();
    startEnglish();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const state = initialState();
    state.language = 'en';
    state.groups[0].name = 'Imported trip';
    const input = screen.getByLabelText('Import backup file');
    await user.upload(
      input,
      new File([serializeBackup(state)], 'backup.json', { type: 'application/json' }),
    );
    expect(await screen.findByRole('button', { name: 'Imported trip' })).toBeInTheDocument();
    await user.upload(input, new File(['{}'], 'bad.json', { type: 'application/json' }));
    expect(
      await screen.findByText('Invalid backup. Choose a supported JSON backup file.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Imported trip' })).toBeInTheDocument();
  });
  it('restores saved options and target edits on reload', async () => {
    const view = startEnglish();
    enter('JAL · Domestic · Economy', '2.5');
    enter('Miles required', '10000');
    enter('Award ticket cash payment', '0');
    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).targets.JAL.domestic.economy).toBe(2.5),
    );
    view.unmount();
    render(<App />);
    expect(screen.getByText('¥25,000')).toBeInTheDocument();
    expect(screen.getByLabelText('JAL · Domestic · Economy')).toHaveValue(2.5);
  });
  it('does not overwrite unreadable saved data', async () => {
    localStorage.setItem(STORAGE_KEY, 'broken');
    render(<App />);
    expect(screen.getByRole('button', { name: /復旧用コピー|recovery copy/ })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/旅行名|Trip name/), {
      target: { value: 'Temporary' },
    });
    expect(localStorage.getItem(STORAGE_KEY)).toBe('broken');
  });
  it('leaves current comparisons intact when an import is cancelled', async () => {
    const user = userEvent.setup();
    startEnglish();
    enter('Trip name', 'Keep this trip');
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const state = initialState();
    state.language = 'en';
    state.groups[0].name = 'Replacement';
    await user.upload(
      screen.getByLabelText('Import backup file'),
      new File([serializeBackup(state)], 'backup.json', { type: 'application/json' }),
    );
    await waitFor(() => expect(window.confirm).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: 'Keep this trip' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Replacement' })).not.toBeInTheDocument();
  });
  it('shows storage failure while preserving in-memory calculations', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw Error('full');
    });
    const state = initialState();
    state.language = 'en';
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(serializeBackup(state));
    render(<App />);
    expect(screen.getByRole('alert')).toHaveTextContent('Browser saving is unavailable.');
    enter('Miles required', '10000');
    enter('Award ticket cash payment', '0');
    expect(screen.getByText('¥20,000')).toBeInTheDocument();
  });
  it('exports the current comparison as a versioned JSON download', async () => {
    const user = userEvent.setup();
    startEnglish();
    enter('Trip name', 'Exported trip');
    const createUrl = vi.fn((_blob: Blob) => 'blob:test');
    vi.stubGlobal('URL', { createObjectURL: createUrl, revokeObjectURL: vi.fn() });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    try {
      await user.click(screen.getByRole('button', { name: 'Export backup' }));
      expect(createUrl).toHaveBeenCalledWith(expect.any(Blob));
      const blob = createUrl.mock.calls[0][0] as Blob;
      const text = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.readAsText(blob);
      });
      expect(JSON.parse(text)).toMatchObject({ version: 3, groups: [{ name: 'Exported trip' }] });
      expect(click).toHaveBeenCalledOnce();
    } finally {
      await new Promise((resolve) => setTimeout(resolve, 1100));
      vi.unstubAllGlobals();
    }
  });
});
