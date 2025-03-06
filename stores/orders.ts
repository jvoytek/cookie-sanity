import type { Database } from '@/types/supabase';
import type { Order, SCOrder2025, NewOrder } from "@/types/types";

/*
ref()s become state properties
computed()s become getters
function()s become actions
*/

export const useOrdersStore = defineStore('orders', () => {

    const supabaseClient = useSupabaseClient<Database>();
    const toast = useToast();
    const profileStore = useProfileStore();
    const seasonsStore = useSeasonsStore();
    const girlsStore = useGirlsStore();
    const cookiesStore = useCookiesStore();

    const emptyOrder: Order = {season: -1, profile: "", id: -1, created_at: "", order_date: returnDateStringOrNull(new Date()), order_num: "", to: 0, cookies: {}}

    /* State */
    const allOrders: Ref<Order[]> = ref([]);
    const editingRows: Ref<Order[]> = ref([]);
    
    const activeTransaction: ref<Json> = ref({});
    const editTransactionDialogVisible: ref<boolean> = ref(false);
    const deleteTransactionDialogVisible: ref<boolean> = ref(false);

    /* Computed */
    const currentStock = computed(() => {
        const stock: { [key: string]: number } = {};
        if (!seasonsStore.currentSeason) return stock;
        cookiesStore.allCookies.forEach(cookie => {
            stock[cookie.abbreviation] = _sumOrders(cookie.abbreviation);
        });
        return stock;
    })

    const completedOrderList: Ref<Order[]> = computed(() => {
        return allOrders.value.filter(order => order.status === 'complete' && (order.type === 'request' || order.type === 'distribution' || order.type === 'return'));
    })

    const completedOrderListCount: number = computed(() => {
        return completedOrderList.value.length;
    })

    const pendingRestockList: Ref<Order[]> = computed(() => {
        return allOrders.value.filter(order => order.status === 'pending' && (order.type === 'order'))
            .map(order => {
                if (!order.cookies) return order;
                order.troop_transaction_type = troopTransactionType(order);
                return order;
            });
    })

    const pendingRestockListCount: number = computed(() => {
        return pendingRestockList.value.length;
    })

    const completedRestockList: Ref<Order[]> = computed(() => {
        return allOrders.value.filter(order => order.status === 'complete' && (order.type === 'order'))
            .map(order => {
                if (!order.cookies) return order;
                order.troop_transaction_type = troopTransactionType(order);
                return order;
            });
    })

    const completedRestockListCount: number = computed(() => {
        return completedRestockList.value.length;
    })

    /* Private Functions */
    const troopTransactionType = (order: Order): string => {
        if (!order.cookies) return "unknown";
        // Determine in the order is a restock, transfer to another troop or trade with another troop based on the cookies field
        let hasPositive = false;
        let hasNegative = false;
        cookiesStore.allCookies.forEach((cookie: Cookie) => {
            if (order.cookies[cookie.abbreviation] > 0) {
            hasPositive = true;
            } else if (order.cookies[cookie.abbreviation] < 0) {
            hasNegative = true;
            }
        });
        if (hasPositive && hasNegative) {
            return "trade";
        } else if (hasPositive) {
            return "transfer";
        } else if (hasNegative) {
            return "restock";
        } else {
            return "unknown";
        }
    }

    const _sumOrders = (cookieAbbreviation: string): number => {
        let sum = 0;

        allOrders.value.filter(order => order.cookies && order.status == "complete").forEach(order => {
            const quantity = order.cookies ? order.cookies[cookieAbbreviation] : 0;
            if (typeof quantity === 'number') {
                sum -= quantity;
            }
        });
        return sum;
    }

    const _updateOrder = (order: Order) =>{
        //
        const index = allOrders.value.findIndex(o => o.id === order.id);
        if (index !== -1) {
            allOrders.value[index] = order;
        }
    }

    const _sortOrders = () => {
        allOrders.value.sort((a, b) => a.order_date - b.order_date);
    }

    const _addOrder = (order: Order) => {
        allOrders.value.unshift(order);
    }

    const _removeTemporaryOrder = () => {
        allOrders.value.splice(0, 1);
    }

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

        const index = allOrders.value.findIndex(o => o.id === orderId);
        if (index !== -1) {
            allOrders.value.splice(index, 1);
        }
    }

    function _getGirlId(name: string): number | null {
        try {
            const first_name = name.split(" ")[0];
            const last_name = name.split(" ")[1];
            const matchingGirls = girlsStore.allGirls ? girlsStore.allGirls.filter((girl) => girl.first_name === first_name && girl.last_name === last_name) : [];
            return matchingGirls[0]?.id ?? null;
        } catch(error) {
            toast.add({
                severity: "error",
                summary: "Error",
                detail: (error as Error).message,
                life: 3000,
            });
            return null;
        }
    }

    function returnDateStringOrNull(date: Date | string | null) {
        if (! date || typeof date === 'string') {
            return date
        } else {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
    }
    
    /* Actions */

    const fetchOrders = async () => {
        try {
            if (!profileStore.currentProfile?.id || !seasonsStore.currentSeason?.id) return;
            const { data, error } = await supabaseClient.from("orders").select(`*`).eq("profile", profileStore.currentProfile.id).eq("season", seasonsStore.currentSeason.id).order("order_date", { ascending: false });
            if (error) throw error;
            allOrders.value = data ?? [];
        } catch (error) {
            toast.add({
                severity: "error",
                summary: "Error",
                detail: (error as Error).message,
                life: 3000,
                });
        }

    }
    
    const insertNewOrderFromOrdersList = async (order: Omit<NewOrder, 'season'> & { season: number }) => {
        if (!profileStore.currentProfile) return;
        order.profile = profileStore.currentProfile.id;
        order.season = profileStore.currentProfile.season || seasonsStore.allSeasons[0].id;
        order.order_date = returnDateStringOrNull(order.order_date);
 
        //There's probably a better way to do this but that's a problem for another day
        delete order.troop_transaction_type;
        try {
            const { data, error } = await supabaseClient
            .from("orders")
            .insert(order).select().single();
    
            if (error) throw error;
            
            if(allOrders.value[0]?.id === -1) _removeTemporaryOrder();
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
    }

    const insertOrders = async (ordersList: NewOrder[]) => {
        //There's probably a better way to do this but that's a problem for another day
        delete order.troop_transaction_type;

        const { error } = await supabaseClient.from("orders").insert(ordersList).select();
        if (error) throw error;
    }

    const addTemporaryOrder = () => {
        const order = {...emptyOrder};
        _addOrder(order);
        editingRows.value.push(order);
    }

    const upsertOrder = async (order: Order) => {
        try {
            
            //There's probably a better way to do this but that's a problem for another day
            delete order.troop_transaction_type;

            const { data, error } = await supabaseClient.from("orders").upsert(order).select().single();
    
            if (error) throw error;
    
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
    }

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

    const convertSCOrderToNewOrder = (obj: SCOrder2025): NewOrder | undefined=> {
        if (!profileStore.currentProfile?.id) return;
        const toGirlId = _getGirlId(obj.TO);
        const fromGirlId = _getGirlId(obj.FROM);
        return {
            profile: profileStore.currentProfile?.id,
            order_date: returnDateStringOrNull(obj.DATE),
            order_num: obj["ORDER #"].toString(),
            to: toGirlId || null,
            from: fromGirlId || null,
            cookies: obj,
            season: profileStore.currentProfile?.season ?? null,
            type: obj.TYPE.slice(0,3) === "T2G" ? "distribution" : (obj.TYPE == "G2T" ? "return" : (obj.TYPE == "G2G" ? "transfer" : "other")),
            status: "complete"
        };
    }

    const markOrderComplete = async (orderId: number) => { 
        try {
            const { data, error } = await supabaseClient.from("orders").update({ status: "complete" }).eq("id", orderId).select().single();
            if (error) throw error;
            _updateOrder(data);
            _sortOrders();
            toast.add({
                severity: "success",
                summary: "Successful",
                detail: "Order Marked Complete",
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
    }

    const markOrderPending = async (orderId: number) => { 
        try {
            const { data, error } = await supabaseClient.from("orders").update({ status: "pending" }).eq("id", orderId).select().single();
            if (error) throw error;
            _updateOrder(data);
            _sortOrders();
            toast.add({
                severity: "success",
                summary: "Successful",
                detail: "Order Marked Pending",
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
    }

    //fetchOrders();
    
    return { allOrders, currentStock, editingRows, activeTransaction, editTransactionDialogVisible, deleteTransactionDialogVisible, completedOrderList, completedOrderListCount, pendingRestockList, pendingRestockListCount, completedRestockList, completedRestockListCount, fetchOrders, insertOrders, insertNewOrderFromOrdersList, upsertOrder, returnDateStringOrNull, addTemporaryOrder, deleteOrder, convertSCOrderToNewOrder, markOrderComplete, markOrderPending};
  });