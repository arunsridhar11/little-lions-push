"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Printer, CheckCircle } from "lucide-react";
import { calculateBilling, PLAN_PRICES, PLAN_LABELS, type KidPlan, type PlanId } from "@/lib/utils";
import { dbService, Transaction, Customer } from "@/lib/db";
import PrintReceipt from "@/components/PrintReceipt";

export default function POSPage() {
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [kids, setKids] = useState<KidPlan[]>([{ kidName: "", planId: "1hour" }]);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "upi" | "card">("cash");
  
  const [finishedTransaction, setFinishedTransaction] = useState<Transaction | null>(null);

  // Math recalculation automatically handled on render based on `kids`
  const { subtotal, discountPercentage, discountAmount, taxAmount, grandTotal } = calculateBilling(kids);

  // Lookup existing customer on phone change
  useEffect(() => {
    if (parentPhone.length === 10) {
      dbService.getCustomerByPhone(parentPhone).then((customer) => {
        if (customer && !parentName) {
          setParentName(customer.parentName);
          // Optional: prefill kids if they are in history
          if (customer.kids.length > 0 && kids.length === 1 && !kids[0].kidName) {
            setKids(customer.kids.map(kidName => ({ kidName, planId: "1hour" })));
          }
        }
      });
    }
  }, [parentPhone]);

  const handleAddKid = () => {
    setKids([...kids, { kidName: "", planId: "1hour" }]);
  };

  const handleRemoveKid = (index: number) => {
    if (kids.length === 1) return;
    const newKids = [...kids];
    newKids.splice(index, 1);
    setKids(newKids);
  };

  const handleKidChange = (index: number, field: "kidName" | "planId", value: string) => {
    const newKids = [...kids];
    newKids[index] = { ...newKids[index], [field]: value };
    setKids(newKids);
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentName || !parentPhone || kids.some(k => !k.kidName)) {
      alert("Please fill in all details.");
      return;
    }

    const transactionData: Omit<Transaction, "id"> = {
      parentPhone,
      parentName,
      kids: kids.map(k => ({
        kidName: k.kidName,
        planId: k.planId,
        planLabel: PLAN_LABELS[k.planId],
        price: PLAN_PRICES[k.planId]
      })),
      subtotal,
      discountPercentage,
      discountAmount,
      taxAmount,
      grandTotal,
      paymentMethod,
      timestamp: new Date().toISOString(),
    };

    // Save transaction
    const tx = await dbService.createTransaction(transactionData);

    // Save Sessions
    const sessions = kids.map(k => {
      let expectedOut = null;
      const start = new Date();
      if (k.planId === "1hour") {
        start.setHours(start.getHours() + 1);
        expectedOut = start.toISOString();
      } else if (k.planId === "1day") {
        start.setHours(23, 59, 59, 999);
        expectedOut = start.toISOString();
      } else {
        // subscription plans (3months, 1year) do not use immediate auto-checkout timers like hour passes
        expectedOut = new Date("2099-12-31").toISOString();
      }
      
      return {
        transactionId: tx.id,
        parentPhone,
        parentName,
        kidName: k.kidName,
        planId: k.planId,
        checkedInAt: tx.timestamp,
        checkedOutAt: null,
        checkOutTimeExpected: expectedOut,
        status: "active" as const,
      };
    });
    await dbService.createSessions(sessions);

    // Upsert Customer Search Profile
    const customer: Customer = {
      phone: parentPhone,
      parentName,
      kids: kids.map(k => k.kidName),
      lastVisitedAt: tx.timestamp,
      totalVisits: 1, // increment handled inside dbService
    };
    await dbService.upsertCustomer(customer);

    setFinishedTransaction(tx);
  };

  const handlePrintAndReset = () => {
    window.print();
    setTimeout(() => {
      setFinishedTransaction(null);
      setParentName("");
      setParentPhone("");
      setKids([{ kidName: "", planId: "1hour" }]);
    }, 1000);
  };

  if (finishedTransaction) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <CheckCircle className="w-20 h-20 text-green-500 no-print" />
        <h2 className="text-2xl font-bold no-print">Checkout Successful</h2>
        
        {/* Render actual receipt */}
        <div className="w-full max-w-[80mm] border border-gray-200 shadow-sm p-4 no-print bg-white rounded">
           <PrintReceipt transaction={finishedTransaction} />
        </div>
        
        {/* Print Only component for the window.print pipeline */}
        <PrintReceipt transaction={finishedTransaction} />
        
        <div className="flex gap-4 no-print mt-4">
          <button 
            onClick={handlePrintAndReset}
            className="flex items-center gap-2 px-6 py-3 bg-lion-500 text-white font-semibold rounded-lg hover:bg-lion-600 shadow transition-colors"
          >
            <Printer className="w-5 h-5" />
            Print Bill & Next
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="no-print">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">New Checkout</h1>
        <p className="mt-2 text-sm text-gray-700">Fill in the details below to generate a bill.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Form */}
        <div className="lg:col-span-2 space-y-6">
          <form id="pos-form" onSubmit={handleCheckout} className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Parent Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium leading-6 text-gray-900">Phone Number</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value.replace(/\D/g, ''))}
                    className="mt-2 block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-lion-500 sm:text-sm sm:leading-6"
                    placeholder="9876543210"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium leading-6 text-gray-900">Parent Name</label>
                  <input
                    type="text"
                    required
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    className="mt-2 block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-lion-500 sm:text-sm sm:leading-6"
                    placeholder="Jane Doe"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Kids Details</h2>
                <button
                  type="button"
                  onClick={handleAddKid}
                  className="flex items-center gap-1 text-sm font-semibold text-lion-600 hover:text-lion-500"
                >
                  <Plus className="w-4 h-4" /> Add Kid
                </button>
              </div>

              <div className="space-y-4">
                {kids.map((kid, index) => (
                  <div key={index} className="flex flex-col md:flex-row gap-4 items-start md:items-center bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="flex-1 w-full">
                      <label className="block text-sm font-medium leading-6 text-gray-900">Kid's Name</label>
                      <input
                        type="text"
                        required
                        value={kid.kidName}
                        onChange={(e) => handleKidChange(index, "kidName", e.target.value)}
                        className="mt-2 block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 sm:text-sm sm:leading-6"
                        placeholder="Leo"
                      />
                    </div>
                    <div className="flex-1 w-full">
                      <label className="block text-sm font-medium leading-6 text-gray-900">Selected Plan</label>
                      <select
                        value={kid.planId}
                        onChange={(e) => handleKidChange(index, "planId", e.target.value)}
                        className="mt-2 block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 sm:text-sm sm:leading-6 bg-white"
                      >
                        {Object.entries(PLAN_LABELS).map(([pid, label]) => (
                          <option key={pid} value={pid}>{label} (₹{PLAN_PRICES[pid as PlanId]})</option>
                        ))}
                      </select>
                    </div>
                    {kids.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveKid(index)}
                        className="md:mt-8 p-2 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              {kids.length === 2 && (
                <div className="mt-4 p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200">
                  🎉 Sibling discount (10%) automatically applied for 2 kids!
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h2>
              <div className="flex gap-4">
                {["cash", "upi", "card"].map((method) => (
                  <label key={method} className="flex-1">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method}
                      checked={paymentMethod === method}
                      onChange={() => setPaymentMethod(method as any)}
                      className="peer sr-only"
                    />
                    <div className="cursor-pointer text-center rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium uppercase hover:bg-gray-50 peer-checked:border-lion-500 peer-checked:bg-lion-50 peer-checked:text-lion-700 peer-focus:ring-2 peer-focus:ring-lion-500 transition-colors">
                      {method}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* Right Side: Summary Sticky Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-gray-900 rounded-3xl p-6 shadow-xl text-white sticky top-8">
            <h2 className="text-lg font-semibold mb-6">Bill Summary</h2>
            
            <div className="space-y-4 mb-6">
              {kids.map((kid, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-gray-300">{kid.kidName || `Kid ${idx + 1}`} <span className="opacity-70 text-xs">({PLAN_LABELS[kid.planId]})</span></span>
                  <span className="font-semibold">₹{PLAN_PRICES[kid.planId].toFixed(2)}</span>
                </div>
              ))}
            </div>
            
            <div className="border-t border-gray-700 pt-4 space-y-3 text-sm">
              <div className="flex justify-between text-gray-300">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>Sibling Discount ({(discountPercentage * 100).toFixed(0)}%)</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between text-gray-400">
                <span>GST (18%)</span>
                <span>₹{taxAmount.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="border-t border-gray-700 mt-6 pt-6 flex justify-between items-end">
              <span className="text-gray-300 text-sm">Grand Total</span>
              <span className="text-3xl font-bold text-lion-400">₹{grandTotal.toFixed(2)}</span>
            </div>

            <button
              type="submit"
              form="pos-form"
              className="mt-8 w-full rounded-xl bg-lion-500 px-3 py-4 text-sm font-semibold text-white shadow-sm hover:bg-lion-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lion-500 transition-all transform active:scale-[0.98]"
            >
              Checkout & Print Bill
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
