"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function SellPage() {
  // รายการสินค้าทั้งหมด (สำหรับ dropdown)
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // ค่าที่ผู้ใช้เลือก/กรอก
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("");

  // ข้อความแจ้งเตือน / สถานะ
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // โหลดรายการสินค้าจาก Supabase
  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setProducts(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // หาข้อมูลสินค้าที่เลือกอยู่ในปัจจุบัน
  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // คำนวณยอดรวมอัตโนมัติ
  const total =
    selectedProduct && quantity
      ? selectedProduct.price * parseFloat(quantity)
      : 0;

  const resetForm = () => {
    setSelectedProductId("");
    setQuantity("");
  };

  const handleSell = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!selectedProduct) {
      setErrorMsg("กรุณาเลือกสินค้า");
      return;
    }

    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0) {
      setErrorMsg("กรุณากรอกจำนวนให้ถูกต้อง");
      return;
    }

    // ตรวจสอบ stock เพียงพอหรือไม่
    if (qty > selectedProduct.stock) {
      setErrorMsg(
        `สินค้าคงเหลือไม่พอ (คงเหลือ ${selectedProduct.stock} ${selectedProduct.unit})`
      );
      return;
    }

    setSubmitting(true);

    const totalPrice = selectedProduct.price * qty;

    // 1. บันทึกรายการขายลงตาราง sales
    const { error: saleError } = await supabase.from("sales").insert([
      {
        product_id: selectedProduct.id,
        product_name: selectedProduct.name,
        quantity: qty,
        total_price: totalPrice,
        sold_at: new Date().toISOString(),
      },
    ]);

    if (saleError) {
      setErrorMsg(saleError.message);
      setSubmitting(false);
      return;
    }

    // 2. อัปเดต stock ในตาราง products ให้ลดลง
    const newStock = selectedProduct.stock - qty;
    const { error: stockError } = await supabase
      .from("products")
      .update({ stock: newStock })
      .eq("id", selectedProduct.id);

    if (stockError) {
      // รายการขายถูกบันทึกไปแล้ว แต่ตัด stock ไม่สำเร็จ แจ้งเตือนให้ผู้ใช้ทราบ
      setErrorMsg(
        `บันทึกการขายสำเร็จ แต่ปรับสต๊อกไม่สำเร็จ: ${stockError.message}`
      );
      setSubmitting(false);
      fetchProducts();
      return;
    }

    setSuccessMsg(
      `ขายสำเร็จ: ${selectedProduct.name} จำนวน ${qty} ${selectedProduct.unit} รวม ${totalPrice} บาท`
    );
    resetForm();
    setSubmitting(false);
    fetchProducts(); // โหลด stock ล่าสุดมาแสดง
  };

  return (
    <div>
      <h1>ขายสินค้า</h1>

      {errorMsg && (
        <p style={{ color: "red", marginBottom: "12px" }}>{errorMsg}</p>
      )}
      {successMsg && (
        <p style={{ color: "green", marginBottom: "12px" }}>{successMsg}</p>
      )}

      {loading ? (
        <p>กำลังโหลดข้อมูลสินค้า...</p>
      ) : (
        <div className="card">
          <form onSubmit={handleSell}>
            <div className="form-row">
              {/* Dropdown เลือกสินค้า */}
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
              >
                <option value="">-- เลือกสินค้า --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.price} บาท / {p.unit})
                  </option>
                ))}
              </select>

              {/* ช่องกรอกจำนวน */}
              <input
                type="number"
                min="1"
                placeholder="จำนวน"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>

            {/* แสดงยอดรวมอัตโนมัติ */}
            {selectedProduct && (
              <p>
                คงเหลือ: {selectedProduct.stock} {selectedProduct.unit} —{" "}
                <strong>ยอดรวม: {total.toFixed(2)} บาท</strong>
              </p>
            )}

            <button type="submit" disabled={submitting}>
              {submitting ? "กำลังบันทึก..." : "ขาย"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
