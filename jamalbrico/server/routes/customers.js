import express from "express";
import {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerStats,
  getCustomerPurchaseHistory,
  searchCustomers,
  getCustomerTypes,
  getTopCustomers,
  getInactiveCustomers
} from "../controllers/customerController.js";

const router = express.Router();

// Customer CRUD routes
router.get("/", getAllCustomers);
router.get("/search", searchCustomers);
router.get("/types", getCustomerTypes);
router.get("/top", getTopCustomers);
router.get("/inactive", getInactiveCustomers);
router.get("/:id", getCustomerById);
router.get("/:id/stats", getCustomerStats);
router.get("/:id/history", getCustomerPurchaseHistory);
router.post("/", createCustomer);
router.put("/:id", updateCustomer);
router.delete("/:id", deleteCustomer);

export default router;
