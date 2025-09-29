import type { Database } from "@/types/supabase";
import type { Order, SCOrder2025, NewOrder } from "@/types/types";

/*
ref()s become state properties
computed()s become getters
function()s become actions
*/

export const useOrdersStore = defineStore("orders", () => {
  const supabaseClient = useSupabaseClient<Database>();
  const toast = useToast();
  const profileStore = useProfileStore();
  const seasonsStore = useSeasonsStore();
  const girlsStore = useGirlsStore();

  /* State */
  const allOrders: Ref<Order[]> = ref([]);
  const transactionDialogFormSchema = reactive([]);

  const activeTransaction: ref<Json> = ref({});
  const editTransactionDialogVisible: ref<boolean> = ref(false);
  const deleteTransactionDialogVisible: ref<boolean> = ref(false);

  const transactionTypeOptions = [
    { value: "T2G", label: "Troop to Girl" },
    { value: "G2G", label: "Girl to Girl" },
    { value: "G2T", label: "Girl to Troop" },
    { value: "T2T", label: "Troop to Troop" },
    { value: "C2T", label: "Council to Troop" },
  ];

  /* Computed */

  const totalTransactionsByStatusAndCookie: number = computed(
    () =>
      (status: string, transactionType: string, cookieAbbreviation: string) => {
        return allOrders.value
          .filter(
            (order) =>
              order.status === status &&
              order.cookies &&
              (transactionType === "girl"
                ? _isGirlOrderType(order.type)
                : _isTroopOrderType(order.type)),
          )
          .reduce((total, order) => {
            const quantity = order.cookies
              ? order.cookies[cookieAbbreviation]
              : 0;
            if (typeof quantity === "number") {
              return total + quantity;
            }
            return total;
          }, 0);
      },
  );

  const sumOrdersByCookie: number = computed(
    () =>
      (cookieAbbreviation: string): number => {
        let sum = 0;

        allOrders.value
          .filter((order) => order.cookies && order.status == "complete")
          .forEach((order) => {
            const quantity = order.cookies
              ? order.cookies[cookieAbbreviation]
              : 0;
            if (typeof quantity === "number") {
              sum += quantity;
            }
          });
        return sum;
      },
  );

  const completedOrderList: Ref<Order[]> = computed(() => {
    return allOrders.value.filter(
      (order) => order.status === "complete" && _isGirlOrderType(order.type),
    );
  });

  const completedOrderListCount: number = computed(() => {
    return completedOrderList.value.length;
  });

  const pendingOrderList: Ref<Order[]> = computed(() => {
    return allOrders.value.filter(
      (order) => order.status === "pending" && _isGirlOrderType(order.type),
    );
  });

  const pendingOrderListCount: number = computed(() => {
    return pendingOrderList.value.length;
  });

  const requestedOrderList: Ref<Order[]> = computed(() => {
    return allOrders.value.filter(
      (order) => order.status === "requested" && _isGirlOrderType(order.type),
    );
  });

  const requestedOrderListCount: number = computed(() => {
    return requestedOrderList.value.length;
  });

  const rejectedOrderList: Ref<Order[]> = computed(() => {
    return allOrders.value.filter(
      (order) => order.status === "rejected" && _isGirlOrderType(order.type),
    );
  });

  const rejectedOrderListCount: number = computed(() => {
    return rejectedOrderList.value.length;
  });

  const pendingRestockList: Ref<Order[]> = computed(() => {
    return allOrders.value.filter(
      (order) => order.status === "pending" && _isTroopOrderType(order.type),
    );
  });

  const pendingRestockListCount: number = computed(() => {
    return pendingRestockList.value.length;
  });

  const completedRestockList: Ref<Order[]> = computed(() => {
    return allOrders.value.filter(
      (order) => order.status === "complete" && _isTroopOrderType(order.type),
    );
  });

  const completedRestockListCount: number = computed(() => {
    return completedRestockList.value.length;
  });

  /* Private Functions */

  const _isGirlOrderType = (type: string): boolean => {
    return (
      ["T2G", "G2G", "G2T"].includes(type.slice(0, 3)) ||
      type.slice(0, 12) === "COOKIE_SHARE"
    );
  };

  const _isTroopOrderType = (type: string): boolean => {
    return ["T2T", "C2T"].includes(type.slice(0, 3));
  };

  const _updateOrder = (order: Order) => {
    //
    const index = allOrders.value.findIndex((o) => o.id === order.id);
    if (index !== -1) {
      allOrders.value[index] = order;
    }
  };

  const _sortOrders = () => {
    allOrders.value.sort((a, b) => a.order_date - b.order_date);
  };

  const _addOrder = (order: Order) => {
    allOrders.value.unshift(order);
  };

  const _removeOrder = (order: Order | number) => {
    const orderId: number = typeof order === "number" ? order : order.id;

    if (!orderId) {
      toast.add({
        severity: "error",
        summary: "Error",
        detail: "Order ID is required to delete an order.",
        life: 3000,
      });
      return;
    }

    const index = allOrders.value.findIndex((o) => o.id === orderId);
    if (index !== -1) {
      allOrders.value.splice(index, 1);
    }
  };

  function _getGirlId(name: string): number | null {
    try {
      const first_name = name.split(" ")[0];
      const last_name = name.split(" ")[1];
      const matchingGirls = girlsStore.allGirls
        ? girlsStore.allGirls.filter(
            (girl) =>
              girl.first_name === first_name && girl.last_name === last_name,
          )
        : [];
      return matchingGirls[0]?.id ?? null;
    } catch (error) {
      toast.add({
        severity: "error",
        summary: "Error",
        detail: (error as Error).message,
        life: 3000,
      });
      return null;
    }
  }

  function _returnDateStringOrNull(date: Date | string | null) {
    if (!date || typeof date === "string") {
      return date;
    } else {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  }

  const _invertCookieQuantities = (cookies: Json | null): Json | null => {
    if (!cookies) return cookies;
    const invertedCookies: Json = {};
    Object.keys(cookies).forEach((key) => {
      const value = cookies[key];
      if (value === 0) {
        invertedCookies[key] = null;
      } else if (typeof value === "number") {
        invertedCookies[key] = value * -1;
      } else {
        invertedCookies[key] = value;
      }
    });
    return invertedCookies;
  };

  /* Actions */
  
  const friendlyTransactionTypes = (type: string): string => {
    switch (type) {
      case "T2G":
        return "Troop to Girl";
      case "G2G":
        return "Girl to Girl";
      case "G2T":
        return "Girl to Troop";
      case "T2T":
        return "Troop to Troop";
      case "C2T":
        return "Council to Troop";
      case "COOKIE_SHARE":
        return "Cookie Share";
      default:
        return type;
    }
  };

  const fetchOrders = async () => {
    try {
      if (!profileStore.currentProfile?.id || !seasonsStore.currentSeason?.id)
        return;
      const { data, error } = await supabaseClient
        .from("orders")
        .select(`*`)
        .eq("profile", profileStore.currentProfile.id)
        .eq("season", seasonsStore.currentSeason.id)
        .neq("type", "DIRECT_SHIP")
        .order("order_date", { ascending: false });
      if (error) throw error;
      allOrders.value =
        data.map((order) => {
          order.cookies = _invertCookieQuantities(order.cookies);
          return order;
        }) ?? [];
    } catch (error) {
      toast.add({
        severity: "error",
        summary: "Error",
        detail: (error as Error).message,
        life: 3000,
      });
    }
  };

  const insertNewOrderFromOrdersList = async (
    order: Omit<NewOrder, "season"> & { season: number },
  ) => {
    if (!profileStore.currentProfile) return;
    order.profile = profileStore.currentProfile.id;
    order.season =
      profileStore.currentProfile.season || seasonsStore.allSeasons[0].id;
    order.order_date = _returnDateStringOrNull(order.order_date);
    order.cookies = _invertCookieQuantities(order.cookies);

    try {
      const { data, error } = await supabaseClient
        .from("orders")
        .insert(order)
        .select()
        .single();

      if (error) throw error;

      data.cookies = _invertCookieQuantities(data.cookies);
      _addOrder(data);
      _sortOrders();

      toast.add({
        severity: "success",
        summary: "Successful",
        detail: "Order Created",
        life: 3000,
      });
    } catch (error) {
      toast.add({
        severity: "error",
        summary: "Error",
        detail: error.message,
        life: 3000,
      });
    }
  };

  const insertOrders = async (ordersList: NewOrder[]) => {
    const { error } = await supabaseClient
      .from("orders")
      .insert(ordersList)
      .select();
    if (error) throw error;
  };

  const upsertOrder = async (order: Order) => {
    order.cookies = _invertCookieQuantities(order.cookies);

    try {
      const { data, error } = await supabaseClient
        .from("orders")
        .upsert(order)
        .select()
        .single();

      if (error) throw error;

      data.cookies = _invertCookieQuantities(data.cookies);

      _updateOrder(data);
      _sortOrders();

      toast.add({
        severity: "success",
        summary: "Successful",
        detail: "Product Updated",
        life: 3000,
      });
    } catch (error) {
      toast.add({
        severity: "error",
        summary: "Error",
        detail: error.message,
        life: 3000,
      });
    }
  };

  const deleteOrder = async (order: Order | number) => {
    const orderId: number = typeof order === "number" ? order : order.id;

    if (!orderId) {
      toast.add({
        severity: "error",
        summary: "Error",
        detail: "Order ID is required to delete an order.",
        life: 3000,
      });
      return;
    }

    try {
      const { error } = await supabaseClient
        .from("orders")
        .delete()
        .eq("id", orderId);

      if (error) throw error;

      _removeOrder(orderId);

      toast.add({
        severity: "success",
        summary: "Successful",
        detail: "Order Deleted",
        life: 3000,
      });
    } catch (error) {
      if (error instanceof Error) {
        toast.add({
          severity: "error",
          summary: "Error",
          detail: error.message,
          life: 3000,
        });
      }
    }
  };

  const convertSCOrderToNewOrder = (obj: SCOrder2025): NewOrder | undefined => {
    if (!profileStore.currentProfile?.id) return;
    const toGirlId = _getGirlId(obj.TO);
    const fromGirlId = _getGirlId(obj.FROM);
    return {
      profile: profileStore.currentProfile?.id,
      order_date: _returnDateStringOrNull(obj.DATE),
      order_num: obj["ORDER #"].toString(),
      to: toGirlId || null,
      from: fromGirlId || null,
      cookies: obj,
      season: profileStore.currentProfile?.season ?? null,
      type: obj.TYPE,
      status: "complete",
    };
  };

  const updateOrderStatus = async (orderId: number, status: string) => {
    try {
      const { data, error } = await supabaseClient
        .from("orders")
        .update({ status: status })
        .eq("id", orderId)
        .select()
        .single();
      if (error) throw error;
      data.cookies = _invertCookieQuantities(data.cookies);
      _updateOrder(data);
      _sortOrders();
      toast.add({
        severity: "success",
        summary: "Successful",
        detail: `Order Marked ${status.charAt(0).toUpperCase() + status.slice(1)}`,
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

  return {
    allOrders,
    sumOrdersByCookie,
    activeTransaction,
    transactionDialogFormSchema,
    editTransactionDialogVisible,
    deleteTransactionDialogVisible,
    completedOrderList,
    completedOrderListCount,
    pendingOrderList,
    pendingOrderListCount,
    requestedOrderList,
    requestedOrderListCount,
    rejectedOrderList,
    rejectedOrderListCount,
    pendingRestockList,
    pendingRestockListCount,
    completedRestockList,
    completedRestockListCount,
    totalTransactionsByStatusAndCookie,
    fetchOrders,
    insertOrders,
    insertNewOrderFromOrdersList,
    upsertOrder,
    deleteOrder,
    convertSCOrderToNewOrder,
    updateOrderStatus,
    friendlyTransactionTypes,
    transactionTypeOptions,
  };
});
