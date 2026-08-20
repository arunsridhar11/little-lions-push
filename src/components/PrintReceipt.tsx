import React from "react";
import { Transaction } from "@/lib/db";
import { format } from "date-fns";

export default function PrintReceipt({ transaction }: { transaction: Transaction | null }) {
  if (!transaction) return null;

  return (
    <div className="print-only hidden w-full text-black font-sans bg-white p-4 max-w-[80mm] mx-auto text-sm">
      <div className="flex flex-col items-center border-b border-black pb-4 mb-4">
        <h1 className="text-2xl font-bold uppercase mb-1">Little Lions</h1>
        <p className="text-center">Kids Play Zone</p>
        <p className="text-center text-xs mt-1">Receipt: #{transaction.id.slice(0, 8).toUpperCase()}</p>
        <p className="text-center text-xs">{format(new Date(transaction.timestamp), "PPpp")}</p>
      </div>

      <div className="mb-4 text-xs font-mono">
        <p>Parent: {transaction.parentName}</p>
        <p>Phone: {transaction.parentPhone}</p>
      </div>

      <table className="w-full text-xs font-mono mb-4 text-left border-collapse">
        <thead>
          <tr className="border-b border-black">
            <th className="font-semibold py-1">Item</th>
            <th className="font-semibold py-1 text-right">Price</th>
          </tr>
        </thead>
        <tbody className="border-b border-black">
          {transaction.kids.map((kid, idx) => (
            <tr key={idx}>
              <td className="py-1">
                {kid.kidName}
                <div className="text-[10px] text-gray-600">{kid.planLabel}</div>
              </td>
              <td className="py-1 text-right">₹{kid.price.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="text-xs font-mono flex flex-col gap-1 items-end mb-4 border-b border-black pb-4">
        <div className="w-full flex justify-between">
          <span>Subtotal:</span>
          <span>₹{transaction.subtotal.toFixed(2)}</span>
        </div>
        {transaction.discountAmount > 0 && (
          <div className="w-full flex justify-between">
            <span>Discount ({(transaction.discountPercentage * 100).toFixed(0)}%):</span>
            <span>-₹{transaction.discountAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="w-full flex justify-between">
          <span>Tax (18% GST):</span>
          <span>₹{transaction.taxAmount.toFixed(2)}</span>
        </div>
        <div className="w-full flex justify-between font-bold text-sm mt-2 border-t border-dashed border-black pt-2">
          <span>Total:</span>
          <span>₹{transaction.grandTotal.toFixed(2)}</span>
        </div>
      </div>

      <div className="text-center text-xs font-mono">
        <p>Thank you for visiting!</p>
        <p>Follow us @littlelionsfunzone</p>
      </div>
    </div>
  );
}
