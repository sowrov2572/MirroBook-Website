export interface ParsedBkashSms {
  valid: boolean;
  reason?: string;
  gateway: 'bKash';
  transactionType: 'Send Money Received' | 'Cash In' | 'Payment Received' | 'bKash Credit';
  trxId: string;
  amount: number;
  sender: string;
  recipientAccount: string;
  smsTimestamp: string;
  fee: number;
  balance?: number;
}

/**
 * Normalizes Transaction IDs consistently: uppercase alphanumeric only.
 */
export function normalizeTrxId(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Validates that a normalized Transaction ID has realistic length and format.
 */
export function isValidTrxIdFormat(trxId: string): boolean {
  return /^[A-Z0-9]{6,20}$/.test(trxId);
}

/**
 * Normalizes Bangladeshi mobile numbers to 11-digit 01XXXXXXXXX format for comparison.
 */
export function normalizeBdPhone(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  let digits = raw.replace(/[^0-9]/g, '');
  if (digits.startsWith('8801') && digits.length === 13) {
    digits = digits.slice(2);
  } else if (digits.startsWith('008801') && digits.length === 15) {
    digits = digits.slice(4);
  }
  return digits;
}

function parseAmountNumber(rawNum: string): number {
  const cleaned = rawNum.replace(/,/g, '').trim();
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 100) / 100 : 0;
}

function parseSmsTimestamp(rawText: string): string {
  // Match "at 16/11/2026 14:30" or "at 16/11/2026 14:30:15"
  const match = rawText.match(/\bat\s+(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/i);
  if (!match) return '';
  const [, dd, mm, yyyy, hh = '00', min = '00', ss = '00'] = match;
  return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}T${hh.padStart(2, '0')}:${min}:${ss}+06:00`;
}

/**
 * Strictly parses incoming Personal bKash SMS messages.
 * - Accepts ONLY received credit notifications (Send Money Received, Cash In, Payment Received).
 * - Rejects outgoing transactions (Send Money to, Cash Out, Mobile Recharge, Paid to), OTPs, or malformed text.
 * - Never reads Fee/Balance figures as the received transaction amount.
 */
export function parseBkashSms(
  rawInput: unknown,
  options?: { expectedOwnerNumber?: string; smsSenderAddress?: string }
): ParsedBkashSms {
  const invalid = (reason: string): ParsedBkashSms => ({
    valid: false,
    reason,
    gateway: 'bKash',
    transactionType: 'bKash Credit',
    trxId: '',
    amount: 0,
    sender: '',
    recipientAccount: '',
    smsTimestamp: '',
    fee: 0,
  });

  if (typeof rawInput !== 'string') {
    return invalid('SMS text must be a non-empty string.');
  }

  const text = rawInput.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
  if (!text || text.length < 15 || text.length > 1500) {
    return invalid('SMS text length is outside valid bounds.');
  }

  // Optional SMS sender address check (when provided by iPhone Shortcut)
  if (options?.smsSenderAddress && options.smsSenderAddress.trim()) {
    const senderLabel = options.smsSenderAddress.trim().toLowerCase();
    const isRecognizedSender =
      senderLabel.includes('bkash') || senderLabel === '16247' || senderLabel === '016247';
    if (!isRecognizedSender) {
      return invalid(`Unrecognized SMS sender address: ${options.smsSenderAddress}`);
    }
  }

  // Reject non-credit / outgoing bKash alerts, OTPs, and Balance checks
  const isOutgoingOrNonCredit =
    /\b(?:you\s+have\s+sent|send\s+money\s+(?:of\s+)?tk|cash\s+out\s+tk|mobile\s+recharge|paid\s+tk|payment\s+of\s+tk[\d,.]+\s+to|your\s+bkash\s+verification\s+code|one\s+time\s+password|\botp\b)\b/i.test(
      text
    );
  const explicitlyReceived = /\b(?:you\s+have\s+received|received\s+payment|cash\s+in)\b/i.test(text);

  if (isOutgoingOrNonCredit && !explicitlyReceived) {
    return invalid('SMS is an outgoing transaction or OTP notice, not an incoming credit.');
  }

  if (!explicitlyReceived) {
    return invalid('SMS does not match an incoming bKash payment receipt format.');
  }

  // Extract TrxID
  const trxMatch = text.match(/\bTrxID\s*[:#=\-]?\s*([A-Za-z0-9]{6,20})\b/i);
  if (!trxMatch) {
    return invalid('Missing valid bKash TrxID in SMS.');
  }
  const trxId = normalizeTrxId(trxMatch[1]);
  if (!isValidTrxIdFormat(trxId)) {
    return invalid('Normalized TrxID failed format validation.');
  }

  // Extract received credit type & exact amount (excluding Fee & Balance)
  let transactionType: ParsedBkashSms['transactionType'] = 'bKash Credit';
  let amount = 0;

  const paymentReceivedMatch = text.match(
    /You\s+have\s+received\s+payment\s+(?:of\s+)?(?:Tk\.?|BDT)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i
  );
  const sendMoneyReceivedMatch = text.match(
    /You\s+have\s+received\s+(?:Tk\.?|BDT)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i
  );
  const cashInMatch = text.match(
    /Cash\s+In\s+(?:Tk\.?|BDT)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i
  );

  if (paymentReceivedMatch) {
    transactionType = 'Payment Received';
    amount = parseAmountNumber(paymentReceivedMatch[1]);
  } else if (sendMoneyReceivedMatch) {
    transactionType = 'Send Money Received';
    amount = parseAmountNumber(sendMoneyReceivedMatch[1]);
  } else if (cashInMatch) {
    transactionType = 'Cash In';
    amount = parseAmountNumber(cashInMatch[1]);
  }

  if (!amount || amount <= 0) {
    return invalid('Could not extract a positive received bKash amount.');
  }

  // Extract sender number ("from 017XXXXXXXX")
  const senderMatch = text.match(/\bfrom\s+(?:Agent\s+|Customer\s+|A\/C\s+)?(\+?8801[3-9]\d{8}|01[3-9]\d{8})\b/i);
  const sender = senderMatch ? normalizeBdPhone(senderMatch[1]) : 'Unknown';

  // Extract recipient account if present ("to 017XXXXXXXX" or "to A/C 017XXXXXXXX")
  const recipientMatch = text.match(
    /\bto\s+(?:A\/C\s+|Account\s+)?(\+?8801[3-9]\d{8}|01[3-9]\d{8})\b/i
  );
  const recipientAccount = recipientMatch ? normalizeBdPhone(recipientMatch[1]) : '';

  if (recipientAccount && options?.expectedOwnerNumber) {
    const normalizedOwner = normalizeBdPhone(options.expectedOwnerNumber);
    if (normalizedOwner && recipientAccount !== normalizedOwner) {
      return invalid('Recipient account in SMS does not match owner bKash number.');
    }
  }

  // Optional Fee & Balance extraction
  const feeMatch = text.match(/\bFee\s+(?:Tk\.?|BDT)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i);
  const balanceMatch = text.match(/\bBalance\s+(?:Tk\.?|BDT)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i);

  return {
    valid: true,
    gateway: 'bKash',
    transactionType,
    trxId,
    amount,
    sender,
    recipientAccount: recipientAccount || normalizeBdPhone(options?.expectedOwnerNumber || ''),
    smsTimestamp: parseSmsTimestamp(text),
    fee: feeMatch ? parseAmountNumber(feeMatch[1]) : 0,
    balance: balanceMatch ? parseAmountNumber(balanceMatch[1]) : undefined,
  };
}
