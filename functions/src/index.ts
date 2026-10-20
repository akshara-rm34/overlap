import { initializeApp } from 'firebase-admin/app';

initializeApp();

export { computeMatches } from './matching';
export { approveOfferLetter, listOfferLetters, rejectOfferLetter } from './offerLetters';
export { confirmVerificationCode, sendVerificationCode } from './verification';
