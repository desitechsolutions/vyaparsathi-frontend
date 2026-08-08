/**
 * Converts a numeric value into Indian Rupee Words (Lakhs, Crores, Thousands, Hundreds).
 * Example: 45250.50 -> "Rupees Forty Five Thousand Two Hundred Fifty and Paise Fifty Only"
 */
export const numberToWords = (num) => {
  if (num === null || num === undefined || isNaN(num)) return 'Rupees Zero Only';

  const numericValue = Number(num);
  if (numericValue === 0) return 'Rupees Zero Only';

  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const formatLessThanThousand = (n) => {
    let str = '';
    if (n >= 100) {
      str += units[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      str += units[n] + ' ';
    }
    return str.trim();
  };

  const integerPart = Math.floor(Math.abs(numericValue));
  const decimalPart = Math.round((Math.abs(numericValue) - integerPart) * 100);

  let words = '';

  let crore = Math.floor(integerPart / 10000000);
  let remainder = integerPart % 10000000;

  let lakh = Math.floor(remainder / 100000);
  remainder %= 100000;

  let thousand = Math.floor(remainder / 1000);
  remainder %= 1000;

  if (crore > 0) {
    words += formatLessThanThousand(crore) + ' Crore ';
  }
  if (lakh > 0) {
    words += formatLessThanThousand(lakh) + ' Lakh ';
  }
  if (thousand > 0) {
    words += formatLessThanThousand(thousand) + ' Thousand ';
  }
  if (remainder > 0) {
    words += formatLessThanThousand(remainder);
  }

  words = words.trim();
  let result = 'Rupees ' + (words || 'Zero');

  if (decimalPart > 0) {
    result += ' and Paise ' + formatLessThanThousand(decimalPart);
  }

  return result + ' Only';
};

export default numberToWords;
