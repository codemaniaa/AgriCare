import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiBell,
  FiPlus,
  FiShoppingCart,
  FiBox,
  FiDollarSign,
} from "react-icons/fi";

import { useAuth } from "../context/AuthContext";
import { authAPI, ordersAPI, productsAPI } from "../api";
import { formatPrice } from "../utils";

import Navbar from "../components/layout/Navbar";
import { Spinner } from "../components/common";
import { BottomNav } from "../components/layout/SubNavbar";

/* STATUS STYLES */
const STATUS_STYLE = {
  pending: "bg-yellow-100 text-yellow-700",
  shipped: "bg-blue-100 text-blue-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      authAPI.getDashboard(),
      ordersAPI.asSeller(),
      productsAPI.myProducts(),
    ])
      .then(([s, o, p]) => {
        setStats(s.data);
        setOrders((o.data.results || o.data).slice(0, 5));
        setProducts((p.data.results || p.data).slice(0, 5));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <>
        <Navbar />
        <Spinner />
      </>
    );

  const statCards = [
    {
      label: "Earnings",
      value: formatPrice(stats?.earnings || 0),
      icon: <FiDollarSign />,
    },
    {
      label: "Orders",
      value: stats?.active_orders || 0,
      icon: <FiShoppingCart />,
    },
    {
      label: "Products",
      value: stats?.total_products || 0,
      icon: <FiBox />,
    },
    {
      label: "Pending",
      value: formatPrice(stats?.pending_payments || 0),
      icon: <FiDollarSign />,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 pb-24">
        {/* HEADER */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mt-6 p-5 rounded-2xl bg-gradient-to-r from-green-800 to-green-600 text-white shadow-xl flex justify-between items-center"
        >
          <div>
            <h2 className="text-xl font-semibold">
              Welcome {user?.full_name?.split(" ")[0] || "Farmer"}
            </h2>
            <p className="text-xs opacity-80 mt-1">
              Manage your business smartly
            </p>
          </div>

          <motion.div
            whileHover={{ scale: 1.15, rotate: 10 }}
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 flex items-center justify-center bg-white/20 rounded-full cursor-pointer"
          >
            <FiBell size={18} />
          </motion.div>
        </motion.div>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-8">
          {statCards.map((s, i) => (
            <motion.div
              key={i}
              whileHover={{
                y: -6,
                scale: 1.03,
                boxShadow: "0px 20px 40px rgba(0,0,0,0.1)",
              }}
              className="bg-white rounded-xl p-4 shadow-sm cursor-pointer">
              <div className="text-2xl text-green-700">{s.icon}</div>
              <p className="text-xs text-gray-500 mt-2">{s.label}</p>
              <h3 className="text-lg font-bold">{s.value}</h3>
            </motion.div>
          ))}
        </div>

        {/* ADD BUTTON */}
        <div className="mt-6 flex justify-end">
          <motion.button
            onClick={() => navigate("/add-product")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-700 text-white text-sm font-medium rounded-lg shadow-md hover:bg-green-800"
          >
            <FiPlus size={16} />
            Add Product
          </motion.button>
        </div>

        {/* ORDERS */}
        <div className="mt-10">
          <h3 className="font-semibold mb-3 text-gray-800">
            Recent Orders
          </h3>

          <div className="space-y-3">
            {orders.length === 0 && (
              <p className="text-center text-gray-500">
                No orders yet
              </p>
            )}

            {orders.map((o) => (
              <motion.div
                key={o.id}
                whileHover={{ scale: 1.02, backgroundColor: "#ecfdf5" }}
                className="p-4 bg-white rounded-xl flex justify-between items-center shadow-sm cursor-pointer"
              >
                <div>
                  <p className="font-medium">{o.product_title}</p>
                  <p className="text-xs text-gray-500">
                    {o.buyer_name}
                  </p>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_STYLE[o.status]}`}
                >
                  {o.status}
                </span>

                <p className="font-bold">
                  {formatPrice(o.total_price)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* PRODUCTS */}
        <div className="mt-10">
          <h3 className="font-semibold mb-3 text-gray-800">
            Top Products
          </h3>

          <div className="flex gap-4 overflow-x-auto pb-2">
            {products.map((p) => (
              <motion.div
                key={p.id}
                whileHover={{ scale: 1.05 }}
                className="min-w-[140px] bg-white rounded-xl shadow-md cursor-pointer overflow-hidden"
                onClick={() => navigate("/products")}
              >
                <div className="h-24 bg-gray-100">
                  {p.primary_image ? (
                    <img
                      src={p.primary_image}
                      className="w-full h-full object-cover"
                      alt=""
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <FiBox />
                    </div>
                  )}
                </div>

                <div className="p-2">
                  <p className="text-xs font-semibold truncate">
                    {p.title}
                  </p>
                  <p className="text-green-700 font-bold text-xs">
                    {formatPrice(p.price)}
                  </p>
                </div>
              </motion.div>
            ))}

            {/* ADD CARD */}
            <motion.div
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/add-product")}
              className="min-w-[140px] flex flex-col items-center justify-center bg-green-50 border-2 border-dashed border-green-300 rounded-xl cursor-pointer"
            >
              <FiPlus size={22} className="text-green-700 mb-1" />
              <p className="text-xs font-medium text-green-700">
                Add
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}