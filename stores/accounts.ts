import type { Database } from "@/types/supabase";
import type { Payment, Girl } from "@/types/types";

/*
ref()s become state properties
computed()s become getters
function()s become actions
*/

export interface AccountBalance {
  girl: Girl;
  distributedValue: number;
  paymentsReceived: number;
  balance: number;
  status: string;
  cookieTotals: Record<string, number>;
  estimatedSales: Record<string, number>;
}

export interface TroopAccountSummary {
  totalDistributedValue: number;
  totalPaymentsReceived: number;
  troopBalance: number;
  estimatedTotalSales: Record<string, number>;
  activeAccounts: number;
}

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
    if (!girlsStore.allGirls || !cookiesStore.allCookies || !ordersStore.allOrders) {
      return [];
    }

    return girlsStore.allGirls.map((girl) => {
      // Calculate distributed value from completed orders to this girl
      const distributedOrders = ordersStore.allOrders.filter(
        (order) => order.to === girl.id && order.status === "complete"
      );
      
      let distributedValue = 0;
      const cookieTotals: Record<string, number> = {};
      let numCookiesDistributed = 0;
      distributedOrders.forEach((order) => {
        if (order.cookies) {
          cookiesStore.allCookies.forEach((cookie) => {
            const cookieAbbr = cookie.abbreviation;
            const cookieValue = order.cookies![cookieAbbr];
            const quantity = typeof cookieValue === 'number' ? cookieValue : 0;
            if (quantity !== 0) {
                const value = (quantity * (cookie.price || 0))*-1;
                numCookiesDistributed += (quantity * -1);
                distributedValue += value;
                cookieTotals[cookieAbbr] = (cookieTotals[cookieAbbr] || 0) + quantity;
            }
          });
        }
      });

      // Calculate payments received for this girl
      const girlPayments = allPayments.value.filter(p => p.seller_id === girl.id);
      const paymentsReceived = girlPayments.reduce((sum, payment) => sum + payment.amount, 0);

      // Calculate balance
      const balance = paymentsReceived - distributedValue;

      // Determine status
      let status = "";
      if (balance < -0.01) {
        status = `Owes $${Math.abs(balance).toFixed(2)}`;
      } else if (balance > 0.01) {
        status = "Overpaid";
      } else {
        status = "Paid in Full";
      }

      // Calculate estimated sales based on average prices
      const estimatedSales = Math.round((paymentsReceived / cookiesStore.averageCookiePrice) * 10) / 10;

      return {
        girl,
        distributedValue,
        paymentsReceived,
        balance,
        status,
        numCookiesDistributed,
        cookieTotals,
        estimatedSales,
      };
    });
  });

  const troopAccountSummary = computed((): TroopAccountSummary => {
    const balances = girlAccountBalances.value;
    
    const totalDistributedValue = balances.reduce((sum, balance) => sum + balance.distributedValue, 0);
    const totalPaymentsReceived = balances.reduce((sum, balance) => sum + balance.paymentsReceived, 0);
    const troopBalance = totalPaymentsReceived - totalDistributedValue;
    
    // Calculate estimated total sales
    const estimatedTotalSales =  Math.round((totalPaymentsReceived / cookiesStore.averageCookiePrice) * 10) / 10;
    
    // Count active accounts (accounts with any activity)
    const activeAccounts = balances.filter(
      balance => balance.distributedValue > 0 || balance.paymentsReceived > 0
    ).length;

    return {
      totalDistributedValue,
      totalPaymentsReceived,
      troopBalance,
      estimatedTotalSales,
      activeAccounts,
      numCookiesDistributed: balances.reduce((sum, balance) => sum + (balance.numCookiesDistributed || 0), 0),
      numCookiesRemaining: cookiesStore.allCookiesWithInventoryTotals.reduce((sum, cookie) => sum + (cookie.onHand || 0), 0),
    };
  });

  /* Private Functions */

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

  /* Actions */

  const fetchPayments = async () => {
    try {
      if (!profileStore.currentProfile?.id || !seasonsStore.currentSeason?.id)
        return;

      const { data, error } = await supabaseClient
        .from("payments")
        .select(`*`)
        .eq("profile", profileStore.currentProfile.id)
        .eq("season", seasonsStore.currentSeason.id)
        .order("payment_date", { ascending: false });
      if (error) throw error;
      allPayments.value = data ?? [];
    } catch (error) {
      toast.add({
        severity: "error",
        summary: "Error",
        detail: (error as Error).message,
        life: 3000,
      });
    }
  };

  const insertNewPayment = async (payment: Omit<Payment, 'id' | 'created_at'>) => {
    if (!profileStore.currentProfile) return;
    payment.profile = profileStore.currentProfile.id;
    payment.season =
      profileStore.currentProfile.season || seasonsStore.allSeasons[0].id;

    try {
      const { data, error } = await supabaseClient
        .from("payments")
        .insert(payment)
        .select()
        .single();

      if (error) throw error;

      _addPayment(data);

      toast.add({
        severity: "success",
        summary: "Successful",
        detail: "Payment Added",
        life: 3000,
      });
    } catch (error) {
      toast.add({
        severity: "error",
        summary: "Error",
        detail: (error as Error).message,
        life: 3000,
      });
    }
  };

  const upsertPayment = async (payment: Payment) => {
    try {
      const { data, error } = await supabaseClient
        .from("payments")
        .upsert(payment)
        .select()
        .single();

      if (error) throw error;

      _updatePayment(data);

      toast.add({
        severity: "success",
        summary: "Successful",
        detail: "Payment Updated",
        life: 3000,
      });
    } catch (error) {
      toast.add({
        severity: "error",
        summary: "Error",
        detail: (error as Error).message,
        life: 3000,
      });
    }
  };

  const deletePayment = async (payment: Payment) => {
    try {
      const { error } = await supabaseClient
        .from("payments")
        .delete()
        .eq("id", payment.id);

      if (error) throw error;

      _removePayment(payment);

      toast.add({
        severity: "success",
        summary: "Successful",
        detail: "Payment Deleted",
        life: 3000,
      });
    } catch (error) {
      toast.add({
        severity: "error",
        summary: "Error",
        detail: (error as Error).message,
        life: 3000,
      });
    }
  };


  function getGirlAccountById(id: number) {
    for (let i = 0; i < girlAccountBalances.value.length; i++) {
      if (girlAccountBalances.value[i].girl.id === id) {
        return girlAccountBalances.value[i]
      }
    }
  }

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