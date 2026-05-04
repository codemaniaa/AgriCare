import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiArrowLeft,
  FiPackage,
  FiChevronDown,
  FiUser,
  FiTruck,
  FiCreditCard,
} from "react-icons/fi";

import { ordersAPI } from "../api";
import { useAuth } from "../context/AuthContext";
import { formatPrice } from "../utils";

import Navbar from "../components/layout/Navbar";
import { Spinner, Toast } from "../components/common";
import { BottomNav } from "../components/layout/SubNavbar";

/* STATUS COLORS */
const STATUS_STYLE = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export function OrdersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("buyer");
  const [expanded, setExpanded] = useState(null);
  const [toast, setToast] = useState(null);

  const load = useCallback(() => {
    if (!user) return navigate("/signin");

    setLoading(true);
    const call = view === "seller" ? ordersAPI.asSeller() : ordersAPI.list();

    call
      .then(({ data }) => setOrders(data.results || data))
      .catch(() =>
        setToast({ msg: "Failed to load orders", type: "error" })
      )
      .finally(() => setLoading(false));
  }, [user, navigate, view]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 pb-24">
        {/* HEADER */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 border rounded-lg hover:bg-gray-100"
            >
              <FiArrowLeft />
            </button>
            <h2 className="text-lg font-semibold">Orders</h2>
          </div>

          {/* TOGGLE */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {["buyer", "seller"].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs rounded-md capitalize transition ${
                  view === v
                    ? "bg-green-700 text-white"
                    : "text-gray-600"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* LIST */}
        {loading ? (
          <Spinner />
        ) : orders.length === 0 ? (
          <div className="text-center mt-20 text-gray-500">
            <FiPackage size={40} className="mx-auto mb-3" />
            No orders found
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {orders.map((o) => {
              const isOpen = expanded === o.id;

              return (
                <motion.div
                  key={o.id}
                  whileHover={{ y: -2 }}
                  className="bg-white rounded-xl shadow-sm border"
                >
                  {/* MAIN ROW */}
                  <div
                    onClick={() =>
                      setExpanded(isOpen ? null : o.id)
                    }
                    className="flex items-center gap-3 p-4 cursor-pointer"
                  >
                    {/* IMAGE */}
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {o.product_image ? (
                        <img
                          src={o.product_image}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FiPackage />
                      )}
                    </div>

                    {/* INFO */}
                    <div className="flex-1">
                      <p className="text-sm font-medium truncate">
                        {o.product_title}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-2">
                        <FiUser size={12} />
                        {view === "buyer"
                          ? o.seller_name
                          : o.buyer_name}
                      </p>
                    </div>

                    {/* STATUS */}
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-medium ${
                        STATUS_STYLE[o.status]
                      }`}
                    >
                      {o.status}
                    </span>

                    {/* PRICE */}
                    <p className="font-semibold text-sm">
                      {formatPrice(o.total_price)}
                    </p>

                    <FiChevronDown
                      className={`transition ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>

                  {/* EXPANDED */}
                  {isOpen && (
                    <div className="border-t p-4 text-sm text-gray-600 space-y-3">
                      <div className="flex items-center gap-2">
                        <FiTruck />
                        {o.delivery_city || "No delivery info"}
                      </div>

                      <div className="flex items-center gap-2">
                        <FiCreditCard />
                        {o.payment_type}
                      </div>

                      <div className="font-semibold">
                        Total: {formatPrice(o.total_price)}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />

      {toast && (
        <Toast
          message={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}