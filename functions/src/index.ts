import { initializeApp } from 'firebase-admin/app';

initializeApp();

export { confirmVerificationCode, sendVerificationCode } from './verification';
