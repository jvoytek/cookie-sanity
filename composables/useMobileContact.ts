export function useMobileContact() {
  const toast = useToast();

  function callNumber(number?: string) {
    if (number) {
      window.location.href = `tel:${number}`;
    } else {
      toast.add({
        severity: 'warn',
        summary: 'No Phone Number',
        detail: 'This person does not have a phone number listed.',
        life: 3000,
      });
    }
  }

  function textNumber(number?: string) {
    if (number) {
      window.location.href = `sms:${number}`;
    } else {
      toast.add({
        severity: 'warn',
        summary: 'No Phone Number',
        detail: 'This person does not have a phone number listed.',
        life: 3000,
      });
    }
  }

  function emailAddress(email?: string) {
    if (email) {
      window.location.href = `mailto:${email}`;
    } else {
      toast.add({
        severity: 'warn',
        summary: 'No Email Address',
        detail: 'This person does not have an email address listed.',
        life: 3000,
      });
    }
  }

  return {
    callNumber,
    textNumber,
    emailAddress,
  };
}
