export const useNotificationHelpers = () => {
  const toast = useToast();

  const addError = (error: Error) => {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: error.message,
      life: 3000,
    });
  };

  const addSuccess = (message: string) => {
    toast.add({
      severity: "success",
      summary: "Successful",
      detail: message,
      life: 3000,
    });
  };

  return {
    addError,
    addSuccess,
  };
};
