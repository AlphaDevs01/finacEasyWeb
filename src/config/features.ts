export const OPENFINANCE_ENABLED =
  String(import.meta.env.VITE_OPENFINANCE_ENABLED ?? 'false').toLowerCase() === 'true';

export const OPENFINANCE_MODE =
  String(import.meta.env.VITE_OPENFINANCE_MODE ?? 'disabled').toLowerCase();

export const isOpenFinanceTrialMode = OPENFINANCE_MODE === 'trial' || OPENFINANCE_MODE === 'sandbox';
