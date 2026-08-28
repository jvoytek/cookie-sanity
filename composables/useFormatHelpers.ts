export const useFormatHelpers = () => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatCurrencyAccounting = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      currencySign: 'accounting',
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });
  };

  const formatTime = (timeString: string): string => {
    const [hours, minutes] = timeString.split(':');
    const time = new Date();
    time.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Convert 12-hour format time to 24-hour format
  const convert12to24Hour = (time12: string | null): string | null => {
    if (!time12) return null;

    const match = time12.match(
      /^(0?[1-9]|1[0-2]):([0-5][0-9])\s?(AM|PM|am|pm)$/i,
    );
    if (!match) return null;

    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const period = match[3].toUpperCase();

    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }

    return `${String(hours).padStart(2, '0')}:${minutes}`;
  };

  // Convert 24-hour format time to 12-hour format
  const convert24to12Hour = (time24: string | null): string | null => {
    if (!time24) return null;

    const [hours, minutes] = time24.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return null;

    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12; // Convert 0 to 12

    return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
  };

  const returnMonthName = (monthNumber: number): string => {
    const date = new Date();
    date.setMonth(monthNumber - 1); // monthNumber is 1-based
    return date.toLocaleString('en-US', { month: 'short' });
  };

  return {
    formatCurrency,
    formatCurrencyAccounting,
    formatDate,
    formatTime,
    convert12to24Hour,
    convert24to12Hour,
    returnMonthName,
  };
};
