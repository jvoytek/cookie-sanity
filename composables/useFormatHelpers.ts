export const useFormatHelpers = () => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  };

  const formatTime = (timeString: string): string => {
    const [hours, minutes] = timeString.split(":");
    const time = new Date();
    time.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return time.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return {
    formatCurrency,
    formatDate,
    formatTime,
  };
};
