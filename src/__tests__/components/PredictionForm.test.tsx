import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PredictionForm from '@/components/prediction/prediction-form';
import * as api from '@/lib/api/api';

vi.mock('@/lib/api/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/api')>();
  return { ...actual, checkPayment: vi.fn() };
});

const RESULT: api.PreflightResult = {
  decision: 'caution',
  summary: 'Marginal on: liquidity. Pay with care or use an alternative corridor.',
  score: 83,
  corridor: {
    id: 'USDC->NGN',
    source_asset: 'USDC',
    destination_asset: 'NGN',
    success_rate: 97,
    total_attempts: 212,
    successful_payments: 206,
    health_score: 83,
  },
  checks: [
    { name: 'success_rate', status: 'pass', detail: '97.0% of recent payments succeeded' },
    { name: 'liquidity', status: 'warn', detail: 'payment is 15.0% of observed liquidity' },
  ],
  alternatives: [
    {
      id: 'XLM->NGN',
      source_asset: 'XLM',
      destination_asset: 'NGN',
      success_rate: 99.1,
      total_attempts: 300,
      successful_payments: 297,
      health_score: 91,
    },
  ],
  evaluated_at: '2026-10-10T00:00:00Z',
};

describe('PredictionForm (Check a payment)', () => {
  beforeEach(() => {
    vi.mocked(api.checkPayment).mockReset();
  });

  it('explains the four possible answers before a check runs', () => {
    render(<PredictionForm />);
    for (const label of ['Proceed', 'Caution', 'Hold', 'Unknown']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('runs the check and shows the decision, checks and healthier routes', async () => {
    vi.mocked(api.checkPayment).mockResolvedValue(RESULT);
    render(<PredictionForm />);

    fireEvent.click(screen.getByRole('button', { name: /run check/i }));

    expect(await screen.findByTestId('preflight-result')).toBeInTheDocument();
    expect(api.checkPayment).toHaveBeenCalledWith({
      source_asset: 'USDC',
      destination_asset: 'NGN',
      amount_usd: 2500,
    });
    expect(screen.getByText(RESULT.summary)).toBeInTheDocument();
    expect(screen.getByText('payment is 15.0% of observed liquidity')).toBeInTheDocument();
    expect(screen.getByText('XLM → NGN')).toBeInTheDocument();
    expect(screen.getByText(/GET \/api\/v1\/preflight\?source_asset=USDC&destination_asset=NGN&amount_usd=2500/)).toBeInTheDocument();
  });

  it('skips the amount when it is empty', async () => {
    vi.mocked(api.checkPayment).mockResolvedValue(RESULT);
    render(<PredictionForm />);

    fireEvent.change(screen.getByLabelText(/amount in usd/i), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /run check/i }));

    await screen.findByTestId('preflight-result');
    expect(api.checkPayment).toHaveBeenCalledWith({
      source_asset: 'USDC',
      destination_asset: 'NGN',
      amount_usd: undefined,
    });
  });

  it('swaps assets and blocks a same-asset check', () => {
    render(<PredictionForm />);
    fireEvent.click(screen.getByRole('button', { name: /swap assets/i }));
    expect(screen.getByLabelText('Sending')).toHaveValue('NGN');
    expect(screen.getByLabelText('Receiving')).toHaveValue('USDC');

    fireEvent.change(screen.getByLabelText('Receiving'), { target: { value: 'NGN' } });
    expect(screen.getByRole('button', { name: /run check/i })).toBeDisabled();
  });

  it('shows an error when the API cannot be reached', async () => {
    vi.mocked(api.checkPayment).mockImplementation(async () => {
      throw new Error('network');
    });
    render(<PredictionForm />);

    fireEvent.click(screen.getByRole('button', { name: /run check/i }));

    const alerts = await screen.findAllByRole('alert');
    expect(alerts.map((a) => a.textContent).join(' ')).toMatch(/could not reach the payraider api/i);
    expect(screen.queryByTestId('preflight-result')).not.toBeInTheDocument();
  });
});
