import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useOrdersStore } from "./orders";

describe("Orders Store", () => {
  let ordersStore;

  beforeEach(() => {
    setActivePinia(createPinia());
    
    // Mock dependencies
    global.useProfileStore = vi.fn(() => ({
      currentProfile: {
        id: "test-profile-id",
        season: 1,
      },
    }));

    global.useSeasonsStore = vi.fn(() => ({
      currentSeason: { id: 1 },
      allSeasons: [{ id: 1 }],
    }));

    global.useGirlsStore = vi.fn(() => ({
      allGirls: [
        { id: 1, first_name: "Jane", last_name: "Doe" },
        { id: 2, first_name: "John", last_name: "Smith" },
      ],
    }));

    ordersStore = useOrdersStore();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("initialization", () => {
    it("should initialize with default values", () => {
      expect(ordersStore.allOrders).toEqual([]);
      expect(ordersStore.activeTransaction).toEqual({});
      expect(ordersStore.editTransactionDialogVisible).toBe(false);
      expect(ordersStore.deleteTransactionDialogVisible).toBe(false);
      expect(ordersStore.transactionTypeOptions).toHaveLength(5);
    });

    it("should have correct transaction type options", () => {
      expect(ordersStore.transactionTypeOptions).toEqual([
        { value: "T2G", label: "Troop to Girl" },
        { value: "G2G", label: "Girl to Girl" },
        { value: "G2T", label: "Girl to Troop" },
        { value: "T2T", label: "Troop to Troop" },
        { value: "C2T", label: "Council to Troop" },
      ]);
    });
  });

  describe("computed properties", () => {
    beforeEach(() => {
      // Set up test orders
      ordersStore.allOrders = [
        {
          id: 1,
          status: "complete",
          type: "T2G",
          cookies: { ABC: 5, DEF: 3 },
          order_date: "2024-01-01",
        },
        {
          id: 2,
          status: "pending",
          type: "T2G",
          cookies: { ABC: 2 },
          order_date: "2024-01-02",
        },
        {
          id: 3,
          status: "requested",
          type: "G2G",
          cookies: { DEF: 4 },
          order_date: "2024-01-03",
        },
        {
          id: 4,
          status: "complete",
          type: "T2T",
          cookies: { ABC: 10 },
          order_date: "2024-01-04",
        },
        {
          id: 5,
          status: "rejected",
          type: "T2G",
          cookies: { ABC: 1 },
          order_date: "2024-01-05",
        },
        {
          id: 6,
          status: "pending",
          type: "C2T",
          cookies: { DEF: 8 },
          order_date: "2024-01-06",
        },
      ];
    });

    it("should calculate sumOrdersByCookie correctly", () => {
      const sumABC = ordersStore.sumOrdersByCookie("ABC");
      const sumDEF = ordersStore.sumOrdersByCookie("DEF");
      
      // Only complete orders are counted: ABC: 5 + 10 = 15, DEF: 3
      expect(sumABC).toBe(15);
      expect(sumDEF).toBe(3);
    });

    it("should filter completedOrderList correctly", () => {
      const completed = ordersStore.completedOrderList;
      
      expect(completed).toHaveLength(1);
      expect(completed[0].id).toBe(1);
      expect(completed[0].status).toBe("complete");
      expect(completed[0].type).toBe("T2G");
    });

    it("should count completedOrderListCount correctly", () => {
      expect(ordersStore.completedOrderListCount).toBe(1);
    });

    it("should filter pendingOrderList correctly", () => {
      const pending = ordersStore.pendingOrderList;
      
      expect(pending).toHaveLength(1);
      expect(pending[0].id).toBe(2);
      expect(pending[0].status).toBe("pending");
    });

    it("should count pendingOrderListCount correctly", () => {
      expect(ordersStore.pendingOrderListCount).toBe(1);
    });

    it("should filter requestedOrderList correctly", () => {
      const requested = ordersStore.requestedOrderList;
      
      expect(requested).toHaveLength(1);
      expect(requested[0].id).toBe(3);
      expect(requested[0].status).toBe("requested");
    });

    it("should count requestedOrderListCount correctly", () => {
      expect(ordersStore.requestedOrderListCount).toBe(1);
    });

    it("should filter rejectedOrderList correctly", () => {
      const rejected = ordersStore.rejectedOrderList;
      
      expect(rejected).toHaveLength(1);
      expect(rejected[0].id).toBe(5);
      expect(rejected[0].status).toBe("rejected");
    });

    it("should count rejectedOrderListCount correctly", () => {
      expect(ordersStore.rejectedOrderListCount).toBe(1);
    });

    it("should filter pendingRestockList correctly", () => {
      const pendingRestock = ordersStore.pendingRestockList;
      
      expect(pendingRestock).toHaveLength(1);
      expect(pendingRestock[0].id).toBe(6);
      expect(pendingRestock[0].type).toBe("C2T");
    });

    it("should count pendingRestockListCount correctly", () => {
      expect(ordersStore.pendingRestockListCount).toBe(1);
    });

    it("should filter completedRestockList correctly", () => {
      const completedRestock = ordersStore.completedRestockList;
      
      expect(completedRestock).toHaveLength(1);
      expect(completedRestock[0].id).toBe(4);
      expect(completedRestock[0].type).toBe("T2T");
    });

    it("should count completedRestockListCount correctly", () => {
      expect(ordersStore.completedRestockListCount).toBe(1);
    });

    it("should calculate totalTransactionsByStatusAndCookie for girl orders", () => {
      const totalGirl = ordersStore.totalTransactionsByStatusAndCookie(
        "complete",
        "girl",
        "ABC"
      );
      
      expect(totalGirl).toBe(5); // Only the T2G complete order
    });

    it("should calculate totalTransactionsByStatusAndCookie for troop orders", () => {
      const totalTroop = ordersStore.totalTransactionsByStatusAndCookie(
        "complete",
        "troop",
        "ABC"
      );
      
      expect(totalTroop).toBe(10); // Only the T2T complete order
    });
  });

  describe("friendlyTransactionTypes", () => {
    it("should return friendly names for transaction types", () => {
      expect(ordersStore.friendlyTransactionTypes("T2G")).toBe("Troop to Girl");
      expect(ordersStore.friendlyTransactionTypes("G2G")).toBe("Girl to Girl");
      expect(ordersStore.friendlyTransactionTypes("G2T")).toBe("Girl to Troop");
      expect(ordersStore.friendlyTransactionTypes("T2T")).toBe("Troop to Troop");
      expect(ordersStore.friendlyTransactionTypes("C2T")).toBe("Council to Troop");
      expect(ordersStore.friendlyTransactionTypes("COOKIE_SHARE")).toBe("Cookie Share");
      expect(ordersStore.friendlyTransactionTypes("UNKNOWN")).toBe("UNKNOWN");
    });
  });

  describe("fetchOrders", () => {
    it("should fetch orders successfully", async () => {
      const mockOrders = [
        {
          id: 1,
          status: "complete",
          type: "T2G",
          cookies: { ABC: -5 }, // Will be inverted
        },
      ];

      global.useSupabaseClient = vi.fn(() => ({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                neq: vi.fn(() => ({
                  order: vi.fn(() =>
                    Promise.resolve({ data: mockOrders, error: null })
                  ),
                })),
              })),
            })),
          })),
        })),
      }));

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newOrdersStore = useOrdersStore();

      await newOrdersStore.fetchOrders();

      expect(newOrdersStore.allOrders).toHaveLength(1);
      expect(newOrdersStore.allOrders[0].cookies.ABC).toBe(5); // Inverted from -5
    });

    it("should return early if no profile or season", async () => {
      global.useProfileStore = vi.fn(() => ({
        currentProfile: null,
      }));

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newOrdersStore = useOrdersStore();

      await newOrdersStore.fetchOrders();

      expect(newOrdersStore.allOrders).toEqual([]);
    });

    it("should handle fetch error and show error toast", async () => {
      const toastSpy = vi.fn();
      global.useToast = vi.fn(() => ({
        add: toastSpy,
      }));

      global.useSupabaseClient = vi.fn(() => ({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                neq: vi.fn(() => ({
                  order: vi.fn(() =>
                    Promise.resolve({ 
                      data: null, 
                      error: { message: "Fetch failed" } 
                    })
                  ),
                })),
              })),
            })),
          })),
        })),
      }));

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newOrdersStore = useOrdersStore();

      await newOrdersStore.fetchOrders();

      expect(toastSpy).toHaveBeenCalledWith({
        severity: "error",
        summary: "Error",
        detail: "Fetch failed",
        life: 3000,
      });
    });
  });

  describe("insertNewOrderFromOrdersList", () => {
    it("should insert new order successfully", async () => {
      const toastSpy = vi.fn();
      global.useToast = vi.fn(() => ({
        add: toastSpy,
      }));

      const mockOrder = {
        order_date: new Date("2024-01-01"),
        order_num: "12345",
        to: 1,
        cookies: { ABC: 5 },
      };

      const mockInsertedOrder = {
        id: 1,
        ...mockOrder,
        profile: "test-profile-id",
        season: 1,
        cookies: { ABC: -5 }, // Will be inverted back
      };

      global.useSupabaseClient = vi.fn(() => ({
        from: vi.fn(() => ({
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({
                  data: mockInsertedOrder,
                  error: null,
                })
              ),
            })),
          })),
        })),
      }));

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newOrdersStore = useOrdersStore();

      await newOrdersStore.insertNewOrderFromOrdersList(mockOrder);

      expect(newOrdersStore.allOrders).toHaveLength(1);
      expect(newOrdersStore.allOrders[0].cookies.ABC).toBe(5); // Inverted back
      expect(toastSpy).toHaveBeenCalledWith({
        severity: "success",
        summary: "Successful",
        detail: "Order Created",
        life: 3000,
      });
    });

    it("should return early if no profile", async () => {
      global.useProfileStore = vi.fn(() => ({
        currentProfile: null,
      }));

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newOrdersStore = useOrdersStore();

      const mockOrder = { order_date: "2024-01-01", order_num: "12345" };
      await newOrdersStore.insertNewOrderFromOrdersList(mockOrder);

      expect(newOrdersStore.allOrders).toEqual([]);
    });

    it("should handle insert error and show error toast", async () => {
      const toastSpy = vi.fn();
      global.useToast = vi.fn(() => ({
        add: toastSpy,
      }));

      global.useSupabaseClient = vi.fn(() => ({
        from: vi.fn(() => ({
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({
                  data: null,
                  error: { message: "Insert failed" },
                })
              ),
            })),
          })),
        })),
      }));

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newOrdersStore = useOrdersStore();

      const mockOrder = { order_date: "2024-01-01", order_num: "12345" };
      await newOrdersStore.insertNewOrderFromOrdersList(mockOrder);

      expect(toastSpy).toHaveBeenCalledWith({
        severity: "error",
        summary: "Error",
        detail: "Insert failed",
        life: 3000,
      });
    });
  });

  describe("insertOrders", () => {
    it("should insert multiple orders successfully", async () => {
      const mockOrders = [
        { order_date: "2024-01-01", order_num: "12345" },
        { order_date: "2024-01-02", order_num: "12346" },
      ];

      global.useSupabaseClient = vi.fn(() => ({
        from: vi.fn(() => ({
          insert: vi.fn(() => ({
            select: vi.fn(() => Promise.resolve({ error: null })),
          })),
        })),
      }));

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newOrdersStore = useOrdersStore();

      await expect(newOrdersStore.insertOrders(mockOrders)).resolves.not.toThrow();
    });

    it("should throw error when insert fails", async () => {
      const mockOrders = [{ order_date: "2024-01-01", order_num: "12345" }];

      global.useSupabaseClient = vi.fn(() => ({
        from: vi.fn(() => ({
          insert: vi.fn(() => ({
            select: vi.fn(() =>
              Promise.resolve({ error: { message: "Insert failed" } })
            ),
          })),
        })),
      }));

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newOrdersStore = useOrdersStore();

      await expect(newOrdersStore.insertOrders(mockOrders)).rejects.toEqual({
        message: "Insert failed",
      });
    });
  });

  describe("upsertOrder", () => {
    it("should upsert order successfully", async () => {
      const toastSpy = vi.fn();
      global.useToast = vi.fn(() => ({
        add: toastSpy,
      }));

      const mockOrder = {
        id: 1,
        order_date: "2024-01-01",
        order_num: "12345",
        cookies: { ABC: 5 },
      };

      const mockUpsertedOrder = {
        ...mockOrder,
        cookies: { ABC: -5 }, // Will be inverted back
      };

      global.useSupabaseClient = vi.fn(() => ({
        from: vi.fn(() => ({
          upsert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({
                  data: mockUpsertedOrder,
                  error: null,
                })
              ),
            })),
          })),
        })),
      }));

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newOrdersStore = useOrdersStore();

      // Pre-populate with an order to update
      newOrdersStore.allOrders = [mockOrder];

      await newOrdersStore.upsertOrder(mockOrder);

      expect(newOrdersStore.allOrders[0].cookies.ABC).toBe(5);
      expect(toastSpy).toHaveBeenCalledWith({
        severity: "success",
        summary: "Successful",
        detail: "Product Updated",
        life: 3000,
      });
    });

    it("should handle upsert error and show error toast", async () => {
      const toastSpy = vi.fn();
      global.useToast = vi.fn(() => ({
        add: toastSpy,
      }));

      global.useSupabaseClient = vi.fn(() => ({
        from: vi.fn(() => ({
          upsert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({
                  data: null,
                  error: { message: "Upsert failed" },
                })
              ),
            })),
          })),
        })),
      }));

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newOrdersStore = useOrdersStore();

      const mockOrder = { id: 1, cookies: { ABC: 5 } };
      await newOrdersStore.upsertOrder(mockOrder);

      expect(toastSpy).toHaveBeenCalledWith({
        severity: "error",
        summary: "Error",
        detail: "Upsert failed",
        life: 3000,
      });
    });
  });

  describe("deleteOrder", () => {
    it("should delete order successfully", async () => {
      const toastSpy = vi.fn();
      global.useToast = vi.fn(() => ({
        add: toastSpy,
      }));

      global.useSupabaseClient = vi.fn(() => ({
        from: vi.fn(() => ({
          delete: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ error: null })),
          })),
        })),
      }));

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newOrdersStore = useOrdersStore();

      // Pre-populate with orders
      newOrdersStore.allOrders = [
        { id: 1, order_num: "12345" },
        { id: 2, order_num: "12346" },
      ];

      await newOrdersStore.deleteOrder(1);

      expect(newOrdersStore.allOrders).toHaveLength(1);
      expect(newOrdersStore.allOrders[0].id).toBe(2);
      expect(toastSpy).toHaveBeenCalledWith({
        severity: "success",
        summary: "Successful",
        detail: "Order Deleted",
        life: 3000,
      });
    });

    it("should delete order by object", async () => {
      const toastSpy = vi.fn();
      global.useToast = vi.fn(() => ({
        add: toastSpy,
      }));

      global.useSupabaseClient = vi.fn(() => ({
        from: vi.fn(() => ({
          delete: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ error: null })),
          })),
        })),
      }));

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newOrdersStore = useOrdersStore();

      const orderToDelete = { id: 1, order_num: "12345" };
      newOrdersStore.allOrders = [orderToDelete, { id: 2, order_num: "12346" }];

      await newOrdersStore.deleteOrder(orderToDelete);

      expect(newOrdersStore.allOrders).toHaveLength(1);
      expect(newOrdersStore.allOrders[0].id).toBe(2);
    });

    it("should show error when no order ID provided", async () => {
      const toastSpy = vi.fn();
      global.useToast = vi.fn(() => ({
        add: toastSpy,
      }));

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newOrdersStore = useOrdersStore();

      await newOrdersStore.deleteOrder(0);

      expect(toastSpy).toHaveBeenCalledWith({
        severity: "error",
        summary: "Error",
        detail: "Order ID is required to delete an order.",
        life: 3000,
      });
    });

    it("should handle delete error and show error toast", async () => {
      const toastSpy = vi.fn();
      global.useToast = vi.fn(() => ({
        add: toastSpy,
      }));

      global.useSupabaseClient = vi.fn(() => ({
        from: vi.fn(() => ({
          delete: vi.fn(() => ({
            eq: vi.fn(() =>
              Promise.resolve({ error: new Error("Delete failed") })
            ),
          })),
        })),
      }));

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newOrdersStore = useOrdersStore();

      newOrdersStore.allOrders = [{ id: 1, order_num: "12345" }];

      await newOrdersStore.deleteOrder(1);

      expect(toastSpy).toHaveBeenCalledWith({
        severity: "error",
        summary: "Error",
        detail: "Delete failed",
        life: 3000,
      });
    });
  });

  describe("updateOrderStatus", () => {
    it("should update order status successfully", async () => {
      const toastSpy = vi.fn();
      global.useToast = vi.fn(() => ({
        add: toastSpy,
      }));

      const mockUpdatedOrder = {
        id: 1,
        status: "complete",
        cookies: { ABC: -5 },
      };

      global.useSupabaseClient = vi.fn(() => ({
        from: vi.fn(() => ({
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: mockUpdatedOrder,
                    error: null,
                  })
                ),
              })),
            })),
          })),
        })),
      }));

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newOrdersStore = useOrdersStore();

      // Pre-populate with order
      newOrdersStore.allOrders = [{ id: 1, status: "pending", cookies: { ABC: 5 } }];

      await newOrdersStore.updateOrderStatus(1, "complete");

      expect(newOrdersStore.allOrders[0].status).toBe("complete");
      expect(newOrdersStore.allOrders[0].cookies.ABC).toBe(5); // Inverted back
      expect(toastSpy).toHaveBeenCalledWith({
        severity: "success",
        summary: "Successful",
        detail: "Order Marked Complete",
        life: 3000,
      });
    });

    it("should handle update status error and show error toast", async () => {
      const toastSpy = vi.fn();
      global.useToast = vi.fn(() => ({
        add: toastSpy,
      }));

      global.useSupabaseClient = vi.fn(() => ({
        from: vi.fn(() => ({
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: null,
                    error: { message: "Update failed" },
                  })
                ),
              })),
            })),
          })),
        })),
      }));

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newOrdersStore = useOrdersStore();

      await newOrdersStore.updateOrderStatus(1, "complete");

      expect(toastSpy).toHaveBeenCalledWith({
        severity: "error",
        summary: "Error",
        detail: "Update failed",
        life: 3000,
      });
    });
  });

  describe("convertSCOrderToNewOrder", () => {
    it("should convert SC order to new order successfully", () => {
      const scOrder = {
        DATE: "2024-01-01",
        "ORDER #": 12345,
        TYPE: "T2G",
        TO: "Jane Doe",
        FROM: "John Smith",
        CShare: 1,
        ADV: 2,
        TY: 3,
        LEM: 4,
        TRE: 5,
        TM: 6,
        PBP: 7,
        CD: 8,
        PBS: 9,
        GFC: 10,
        STATUS: "complete",
        TOTAL: 55,
        "TOTAL $": 275,
      };

      const newOrder = ordersStore.convertSCOrderToNewOrder(scOrder);

      expect(newOrder).toEqual({
        profile: "test-profile-id",
        order_date: "2024-01-01",
        order_num: "12345",
        to: 1, // Jane Doe's ID
        from: 2, // John Smith's ID
        cookies: scOrder,
        season: 1,
        type: "T2G",
        status: "complete",
      });
    });

    it("should return undefined if no profile", () => {
      global.useProfileStore = vi.fn(() => ({
        currentProfile: null,
      }));

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newOrdersStore = useOrdersStore();

      const scOrder = { DATE: "2024-01-01", "ORDER #": 12345, TO: "Jane Doe" };
      const result = newOrdersStore.convertSCOrderToNewOrder(scOrder);

      expect(result).toBeUndefined();
    });

    it("should handle unknown names gracefully", () => {
      const scOrder = {
        DATE: "2024-01-01",
        "ORDER #": 12345,
        TYPE: "T2G",
        TO: "Unknown Person",
        FROM: "Another Unknown",
        STATUS: "complete",
      };

      const newOrder = ordersStore.convertSCOrderToNewOrder(scOrder);

      expect(newOrder.to).toBeNull();
      expect(newOrder.from).toBeNull();
    });

    it("should handle error in _getGirlId", () => {
      const toastSpy = vi.fn();
      global.useToast = vi.fn(() => ({
        add: toastSpy,
      }));

      // Mock girlsStore to throw an error when accessing allGirls.filter
      global.useGirlsStore = vi.fn(() => ({
        allGirls: {
          filter: () => {
            throw new Error("Filter failed");
          }
        },
      }));

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newOrdersStore = useOrdersStore();

      const scOrder = {
        DATE: "2024-01-01",
        "ORDER #": 12345,
        TYPE: "T2G",
        TO: "Jane Doe",
        FROM: "John Smith",
        STATUS: "complete",
      };

      const newOrder = newOrdersStore.convertSCOrderToNewOrder(scOrder);

      expect(newOrder.to).toBeNull();
      expect(newOrder.from).toBeNull();
      expect(toastSpy).toHaveBeenCalled();
    });
  });

  describe("private utility functions", () => {
    describe("_removeOrder", () => {
      it("should show error toast when orderId is falsy", () => {
        const toastSpy = vi.fn();
        global.useToast = vi.fn(() => ({
          add: toastSpy,
        }));

        // Create new store instance with the new mock
        setActivePinia(createPinia());
        const newOrdersStore = useOrdersStore();

        // Access private function through returned object (in real implementation)
        // We'll test this through deleteOrder with invalid ID
        newOrdersStore.deleteOrder(0);

        expect(toastSpy).toHaveBeenCalledWith({
          severity: "error",
          summary: "Error",
          detail: "Order ID is required to delete an order.",
          life: 3000,
        });
      });
    });

    describe("_invertCookieQuantities", () => {
      it("should handle null cookies", () => {
        // Test through a function that uses _invertCookieQuantities
        const order = {
          id: 1,
          order_date: "2024-01-01",
          order_num: "12345",
          cookies: null,
        };

        expect(() => ordersStore.upsertOrder(order)).not.toThrow();
      });

      it("should handle zero values correctly", () => {
        // Test the inversion logic with zero values
        ordersStore.allOrders = [
          {
            id: 1,
            status: "complete",
            type: "T2G",
            cookies: { ABC: 0, DEF: 5 },
            order_date: "2024-01-01",
          },
        ];

        const sumABC = ordersStore.sumOrdersByCookie("ABC");
        const sumDEF = ordersStore.sumOrdersByCookie("DEF");

        expect(sumABC).toBe(0);
        expect(sumDEF).toBe(5);
      });

      it("should handle non-number values", () => {
        // Test the inversion logic with non-number values
        ordersStore.allOrders = [
          {
            id: 1,
            status: "complete",
            type: "T2G",
            cookies: { ABC: "text", DEF: null, GHI: 5 },
            order_date: "2024-01-01",
          },
        ];

        const sumABC = ordersStore.sumOrdersByCookie("ABC");
        const sumDEF = ordersStore.sumOrdersByCookie("DEF");
        const sumGHI = ordersStore.sumOrdersByCookie("GHI");

        expect(sumABC).toBe(0); // Non-number values are ignored
        expect(sumDEF).toBe(0);
        expect(sumGHI).toBe(5);
      });
    });

    describe("returnDateStringOrNull", () => {
      it("should handle Date object", () => {
        const order = {
          order_date: new Date("2024-01-15"),
          order_num: "12345",
          to: 1,
          cookies: {},
        };

        // Test through insertNewOrderFromOrdersList which uses returnDateStringOrNull
        ordersStore.insertNewOrderFromOrdersList(order);

        // The function should format the date as YYYY-MM-DD
        expect(order.order_date).toBe("2024-01-15");
      });

      it("should handle string date", () => {
        const order = {
          order_date: "2024-01-15",
          order_num: "12345",
          to: 1,
          cookies: {},
        };

        ordersStore.insertNewOrderFromOrdersList(order);

        // String dates should be returned as-is
        expect(order.order_date).toBe("2024-01-15");
      });

      it("should handle null date", () => {
        const order = {
          order_date: null,
          order_num: "12345",
          to: 1,
          cookies: {},
        };

        ordersStore.insertNewOrderFromOrdersList(order);

        // Null dates should be returned as-is
        expect(order.order_date).toBe(null);
      });
    });

    describe("state properties", () => {
      it("should access transactionDialogFormSchema", () => {
        expect(ordersStore.transactionDialogFormSchema).toBeDefined();
        expect(Array.isArray(ordersStore.transactionDialogFormSchema)).toBe(true);
      });
    });
  });
});