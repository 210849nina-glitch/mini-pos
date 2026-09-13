"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function HistoryPage() {
  // รายการประวัติการขายทั้งหมด
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // โหลดข้อมูลการขายจาก Supabase เรียงล่าสุดก่อน
  const fetchSales = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .order("sold_at", { ascending: false });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setSales(data);
      setErrorMsg("");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSales();
  }, []);

  // คำนวณยอดขายรวมทั้งหมด
  const totalSales = sales.reduce(
    (sum, sale) => sum + (parseFloat(sale.total_price) || 0),
    0
  );

  // แปลงวันเวลาให้อ่านง่าย
  const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString("th-TH", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div>
      <h1>ประวัติการขาย</h1>

      {errorMsg && (
        <p style={{ color: "red", marginBottom: "12px" }}>{errorMsg}</p>
      )}

      {/* สรุปยอดขายรวม */}
      <div className="card">
        <strong>ยอดขายรวมทั้งหมด: {totalSales.toFixed(2)} บาท</strong>
      </div>

      {loading ? (
        <p>กำลังโหลดข้อมูล...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>วันเวลาที่ขาย</th>
              <th>ชื่อสินค้า</th>
              <th>จำนวน</th>
              <th>ยอดรวม</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale.id}>
                <td>{formatDateTime(sale.sold_at)}</td>
                <td>{sale.product_name}</td>
                <td>{sale.quantity}</td>
                <td>{parseFloat(sale.total_price).toFixed(2)} บาท</td>
              </tr>
            ))}
            {sales.length === 0 && (
              <tr>
                <td colSpan="4">ยังไม่มีประวัติการขาย</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
