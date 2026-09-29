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

  const addToContacts = (contact: {
    firstName: string;
    lastName: string;
    tel?: string;
    email?: string;
  }) => {
    // Build standard vCard 3.0 lines
    const vcardLines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `N:${contact.lastName};${contact.firstName};;;`,
      `FN:${contact.firstName} ${contact.lastName}`,
      `TEL;TYPE=CELL:${contact.tel}`,
      `EMAIL;TYPE=INTERNET:${contact.email}`,
      'END:VCARD',
    ];

    // Join lines with CRLF line endings required by vCard specification
    const vcardData = vcardLines.join('\r\n');

    // Create a Blob with the appropriate MIME type
    const blob = new Blob([vcardData], { type: 'text/vcard;charset=utf-8;' });
    const blobUrl = URL.createObjectURL(blob);

    // Programmatically create an anchor element to trigger the download
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute(
      'download',
      `${contact.firstName}_${contact.lastName}.vcf`,
    );

    document.body.appendChild(link);
    link.click();

    // Clean up the DOM and memory
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  };

  return {
    callNumber,
    textNumber,
    emailAddress,
    addToContacts,
  };
}
