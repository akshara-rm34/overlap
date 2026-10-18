import { createHash, randomInt, timingSafeEqual } from 'node:crypto';

import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { HttpsError, onCall } from 'firebase-functions/https';

import { BLOCK_EDU, COMPANY_NAMES, PERSONAL_EMAIL_DOMAINS, VERIFICATION } from './config';
import { EMAIL_SECRET, isConsoleEmail, sendEmail } from './email';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function hashCode(uid: string, code: string): string {
  return createHash('sha256').update(`${uid}:${code}`).digest('hex');
}

function domainOf(email: string): string {
  return email.split('@')[1];
}

// Checks the full domain first, then the last two parts (so "us.ibm.com" matches "ibm.com").
export function companyFor(domain: string): string {
  const parts = domain.split('.');
  const base = parts.slice(-2).join('.');
  return COMPANY_NAMES[domain] ?? COMPANY_NAMES[base] ?? domain;
}

function requireUid(auth: { uid: string } | undefined): string {
  if (!auth) throw new HttpsError('unauthenticated', 'Please sign in first.');
  return auth.uid;
}

export const sendVerificationCode = onCall({ secrets: [EMAIL_SECRET] }, async (req) => {
  const uid = requireUid(req.auth);
  const raw = (req.data as { workEmail?: unknown })?.workEmail;
  const workEmail = typeof raw === 'string' ? raw.trim().toLowerCase() : '';

  if (!EMAIL_RE.test(workEmail)) {
    throw new HttpsError('invalid-argument', 'That email address doesn’t look right.');
  }
  const domain = domainOf(workEmail);
  if (PERSONAL_EMAIL_DOMAINS.includes(domain)) {
    throw new HttpsError('invalid-argument', 'Please use your work email, not a personal one.');
  }
  if (BLOCK_EDU && domain.endsWith('.edu')) {
    throw new HttpsError(
      'invalid-argument',
      'School emails can’t be used. Use your work email, or upload your offer letter instead.',
    );
  }

  const db = getFirestore();
  const userRef = db.doc(`users/${uid}`);
  const codeRef = db.doc(`verificationCodes/${uid}`);
  const privateRef = db.doc(`private/${uid}`);
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  const now = Timestamp.now();
  const hourAgo = now.toMillis() - 60 * 60 * 1000;

  await db.runTransaction(async (tx) => {
    const [user, existing, priv] = await Promise.all([
      tx.get(userRef),
      tx.get(codeRef),
      tx.get(privateRef),
    ]);
    if (user.get('verified') === true) {
      throw new HttpsError('failed-precondition', 'You’re already verified.');
    }
    const recentSends = ((existing.get('sentAt') as Timestamp[] | undefined) ?? []).filter(
      (t) => t.toMillis() > hourAgo,
    );
    if (recentSends.length >= VERIFICATION.maxSendsPerHour) {
      throw new HttpsError('resource-exhausted', 'Too many codes sent. Try again in an hour.');
    }
    tx.set(codeRef, {
      codeHash: hashCode(uid, code),
      workEmail,
      expiresAt: Timestamp.fromMillis(now.toMillis() + VERIFICATION.codeTtlMinutes * 60 * 1000),
      attempts: 0,
      sentAt: [...recentSends, now], // send times in the last hour, for the rate limit
    });
    if (priv.exists) {
      tx.update(privateRef, { workEmail, updatedAt: FieldValue.serverTimestamp() });
    } else {
      tx.set(privateRef, {
        workEmail,
        offerLetterPath: null,
        offerLetterStatus: 'none',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  });

  try {
    await sendEmail({
      to: workEmail,
      subject: `${code} is your Overlap code`,
      text:
        `Your Overlap verification code is ${code}.\n\n` +
        `It expires in ${VERIFICATION.codeTtlMinutes} minutes. ` +
        `If you didn't ask for this, you can ignore this email.`,
    });
  } catch (err) {
    logger.error('sendVerificationCode: email failed', { uid, err: String(err) });
    throw new HttpsError('internal', 'We couldn’t send the email. Please try again.');
  }

  // Emulator only: hand the code back so it can be shown on screen while testing.
  return isConsoleEmail() ? { ok: true, devCode: code } : { ok: true };
});

type ConfirmResult =
  | { ok: true; company: string }
  | {
      ok: false;
      code: 'not-found' | 'deadline-exceeded' | 'resource-exhausted' | 'invalid-argument';
      message: string;
    };

export const confirmVerificationCode = onCall(async (req) => {
  const uid = requireUid(req.auth);
  const raw = (req.data as { code?: unknown })?.code;
  const code = typeof raw === 'string' ? raw.trim() : '';
  if (!/^\d{6}$/.test(code)) {
    throw new HttpsError('invalid-argument', 'Enter the 6-digit code from the email.');
  }

  const db = getFirestore();
  const codeRef = db.doc(`verificationCodes/${uid}`);
  const userRef = db.doc(`users/${uid}`);

  // Return (not throw) on a wrong code so the attempt counter update still commits.
  const result = await db.runTransaction<ConfirmResult>(async (tx) => {
    const snap = await tx.get(codeRef);
    if (!snap.exists) {
      return { ok: false, code: 'not-found', message: 'No code found. Request a new one.' };
    }
    const attempts = snap.get('attempts') as number;
    const expiresAt = snap.get('expiresAt') as Timestamp;
    if (expiresAt.toMillis() < Date.now()) {
      return { ok: false, code: 'deadline-exceeded', message: 'That code expired. Request a new one.' };
    }
    if (attempts >= VERIFICATION.maxAttempts) {
      return {
        ok: false,
        code: 'resource-exhausted',
        message: 'Too many wrong tries. Request a new code.',
      };
    }

    const expected = Buffer.from(snap.get('codeHash') as string, 'hex');
    const actual = Buffer.from(hashCode(uid, code), 'hex');
    if (!timingSafeEqual(expected, actual)) {
      tx.update(codeRef, { attempts: attempts + 1 });
      const left = VERIFICATION.maxAttempts - attempts - 1;
      if (left === 0) {
        return {
          ok: false,
          code: 'resource-exhausted',
          message: 'Too many wrong tries. Request a new code.',
        };
      }
      return {
        ok: false,
        code: 'invalid-argument',
        message: `Wrong code. ${left} ${left === 1 ? 'try' : 'tries'} left.`,
      };
    }

    const company = companyFor(domainOf(snap.get('workEmail') as string));
    tx.set(
      userRef,
      {
        verified: true,
        verificationMethod: 'work_email',
        company,
        verifiedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    tx.delete(codeRef);
    return { ok: true, company };
  });

  if (!result.ok) throw new HttpsError(result.code, result.message);
  return { company: result.company };
});
