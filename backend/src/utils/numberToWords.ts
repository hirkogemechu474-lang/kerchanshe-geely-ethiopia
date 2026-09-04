const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
const SCALES = ['', 'Thousand', 'Million', 'Billion'];

function threeDigitsToWords(n: number): string {
  const parts: string[] = [];
  if (n >= 100) {
    parts.push(`${ONES[Math.floor(n / 100)]} Hundred`);
    n %= 100;
  }
  if (n >= 20) {
    const tens = TENS[Math.floor(n / 10)];
    const ones = n % 10;
    parts.push(ones ? `${tens}-${ONES[ones]}` : tens);
  } else if (n > 0) {
    parts.push(ONES[n]);
  }
  return parts.join(' ');
}

function integerToWords(n: number): string {
  if (n === 0) return 'Zero';
  const groups: string[] = [];
  let scaleIndex = 0;
  while (n > 0) {
    const group = n % 1000;
    if (group > 0) {
      groups.unshift(`${threeDigitsToWords(group)}${SCALES[scaleIndex] ? ` ${SCALES[scaleIndex]}` : ''}`);
    }
    n = Math.floor(n / 1000);
    scaleIndex += 1;
  }
  return groups.join(' ');
}

// Renders an ETB amount as words for the Sales Invoice's "Amount in words"
// line, e.g. 1250075.5 -> "Ethiopian Birr One Million Two Hundred Fifty
// Thousand Seventy-Five and 50/100".
export function amountToWordsETB(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? Math.max(0, amount) : 0;
  const whole = Math.floor(safeAmount);
  const cents = Math.round((safeAmount - whole) * 100);
  const wholeWords = integerToWords(whole);
  return `Ethiopian Birr ${wholeWords} and ${String(cents).padStart(2, '0')}/100`;
}
