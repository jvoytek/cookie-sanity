import type { Database } from "@/types/supabase";
import type { Order, Payment, AccountBalance, TroopAccountSummary } from "@/types/types";

/*
ref()s become state properties
computed()s become getters
function()s become actions
*/

export const useAccountsStore = defineStore("accounts", () => {
  const supabaseClient = useSupabaseClient<Database>();
  const toast = useToast();
  const profileStore = useProfileStore();
  const seasonsStore = useSeasonsStore();
  const girlsStore = useGirlsStore();
  const cookiesStore = useCookiesStore();
  const ordersStore = useOrdersStore();

  /* State */
  const allPayments = ref<Payment[]>([]);
  const editPaymentDialogVisible: ref<boolean> = ref(false);
  const activePayment: ref<Payment> = ref({});
  const paymentDialogFormSchema = reactive([]);

  /* Computed */

  const girlAccountBalances = computed((): AccountBalance[] => {

    return girlsStore.allGirls.map((girl) => {

      const completedTransactions = _getCompletedTransactionsForGirl(girl.id);
      const {
        distributedValue,
        cookieTotals,
        numCookiesDistributed,
      } = _getTotalsFromTransactionList(completedTransactions);
      const girlPaymentsList = _getPaymentsForGirl(girl.id);
      const paymentsReceived = _getTotalofPayments(girlPaymentsList);
      const balance = paymentsReceived - distributedValue;
      const status = _getStatus(balance);
      const estimatedSales =
        balance >= 0
          ? numCookiesDistributed
          : Math.round(paymentsReceived / cookiesStore.averageCookiePrice);

      return {
        girl,
        distributedValue,
        paymentsReceived,
        balance,
        status,
        numCookiesDistributed,
        cookieTotals,
        estimatedSales,
        girlPaymentsList,
      };
    });
  });

  const troopAccountSummary = computed((): TroopAccountSummary => {
    const balances = girlAccountBalances.value;

    const totalDistributedValue = balances.reduce(
      (sum, balance) => sum + balance.distributedValue,
      0,
    );
    const totalPaymentsReceived = balances.reduce(
      (sum, balance) => sum + balance.paymentsReceived,
      0,
    );
    const troopBalance = totalPaymentsReceived - totalDistributedValue;

    const numCookiesDistributed = balances.reduce(
      (sum, balance) => sum + (balance.numCookiesDistributed || 0),
      0,
    );
    const estimatedTotalSales =
      troopBalance >= 0
        ? numCookiesDistributed
        : Math.round(totalPaymentsReceived / cookiesStore.averageCookiePrice);

    // Count active accounts (accounts with any activity)
    const activeAccounts = balances.filter(
      (balance) => balance.distributedValue > 0 || balance.paymentsReceived > 0,
    ).length;

    return {
      totalDistributedValue,
      totalPaymentsReceived,
      troopBalance,
      estimatedTotalSales,
      activeAccounts,
      numCookiesDistributed: numCookiesDistributed,
      numCookiesRemaining: cookiesStore.allCookiesWithInventoryTotals.reduce(
        (sum, cookie) => sum + (cookie.onHand || 0),
        0,
      ),
    };
  });

  /* Private Functions */

  const _getTotalofPayments = (payments: Payment[]) => {
    return payments.reduce(
      (sum, payment) => sum + payment.amount,
      0,
    );
  };

  const _getPaymentsForGirl = (girlId: number): Payment[] => {
    return allPayments.value.filter(
      (p) => p.seller_id === girlId,
    );
  };

  const _getCompletedTransactionsForGirl = (girlId: number): Order[] => {
    return ordersStore.allOrders.filter(
      (order) => order.to === girlId && order.status === "complete",
    );
  };

  const _getTotalsFromTransactionList = (transactionList: Order[]) => {
   return transactionList.reduce(
      (totals, { cookies }) => {
        for (const { abbreviation, price = 0 } of cookiesStore.allCookies) {
          const quantity = cookies[abbreviation] || 0;
          if (quantity) {
            totals.distributedValue -= quantity * price;
            totals.numCookiesDistributed -= quantity;
            totals.cookieTotals[abbreviation] = (totals.cookieTotals[abbreviation] || 0) + quantity;
          }
        }
        return totals;
      },
      {
        distributedValue: 0,
        numCookiesDistributed: 0,
        cookieTotals: {} as Record<string, number>,
      },
    );
  };

  const _getStatus = (balance: number): string => {
    if (balance < 0) {
      return `Balance Due`;
    } else if (balance > 0) {
      return "Overpaid";
    } else {
      return "Paid in Full";
    }
  };

  const _addPayment = (payment: Payment) => {
    allPayments.value.push(payment);
  };

  const _updatePayment = (payment: Payment) => {
    const index = allPayments.value.findIndex((p) => p.id === payment.id);
    if (index !== -1) {
      allPayments.value[index] = payment;
    }
  };

  const _removePayment = (payment: Payment) => {
    const index = allPayments.value.findIndex((p) => p.id === payment.id);
    if (index !== -1) {
      allPayments.value.splice(index, 1);
    }
  };

  const _supabaseGetPayments = async () => {
    return await supabaseClient
    .from("payments")
    .select(`*`)
    .eq("profile", profileStore.currentProfile.id)
    .eq("season", seasonsStore.currentSeason.id)
    .order("payment_date", { ascending: false });
  };

  const _supabaseInsertNewPayment = async (payment: Omit<Payment, "id" | "created_at" | "profile" | "season">) => {
    return await supabaseClient
        .from("payments")
        .insert(payment)
        .select()
        .single();
  };

  const _supabaseUpsertPayment = async (payment: Payment) => {
    return await supabaseClient
    .from("payments")
    .upsert(payment)
    .select()
    .single();
  };

  const _supabaseDeletePayment = async (payment: Payment) => {
    await supabaseClient
    .from("payments")
    .delete()
    .eq("id", payment.id);
  };

  const _toastAddError = (error: Error) => {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: error.message,
      life: 3000,
    });
  };

  const _toastSuccess = (message: string) => {
    toast.add({
      severity: "success",
      summary: "Successful",
      detail: message,
      life: 3000,
    });
  };

  /* Actions */

  const fetchPayments = async () => {
    try {
      if (!profileStore.currentProfile?.id || !seasonsStore.currentSeason?.id) return;
      const { data, error } = await _supabaseGetPayments();
      if (error) throw error;
      allPayments.value = data ?? [];
    } catch (error) {
      _toastAddError(error);
    }
  };

  const insertNewPayment = async (
    payment: Omit<Payment, "id" | "created_at" | "profile" | "season">,
  ) => {
    if (!profileStore.currentProfile) return;
    payment.profile = profileStore.currentProfile.id;
    payment.season =
      profileStore.currentProfile.season || seasonsStore.allSeasons[0].id;

    try {
      const { data, error } = await _supabaseInsertNewPayment(payment);

      if (error) throw error;
      _addPayment(data);
      _toastSuccess("Payment Added");
    } catch (error) {
      _toastAddError(error);
    }
  };

  const upsertPayment = async (payment: Payment) => {
    try {
      const { data, error } = await _supabaseUpsertPayment(payment);

      if (error) throw error;

      _updatePayment(data);
      _toastSuccess("Payment Updated");
    } catch (error) {
      _toastAddError(error);
    }
  };

  const deletePayment = async (payment: Payment) => {
    try {
      const error = await _supabaseDeletePayment(payment);

      if (error) throw error;

      _removePayment(payment);
      _toastSuccess("Payment Deleted");
    } catch (error) {
      _toastAddError(error);
    }
  };

  const getGirlAccountById = (id: number) => {
    return girlAccountBalances.value.find((account) => account.girl.id === id);
  };

  return {
    allPayments,
    girlAccountBalances,
    editPaymentDialogVisible,
    activePayment,
    paymentDialogFormSchema,
    troopAccountSummary,
    fetchPayments,
    insertNewPayment,
    upsertPayment,
    deletePayment,
    getGirlAccountById,
  };
});
