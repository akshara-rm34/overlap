import { initializeApp } from 'firebase-admin/app';

initializeApp();

export { computeMatches } from './matching';
export { confirmVerificationCode, sendVerificationCode } from './verification';
