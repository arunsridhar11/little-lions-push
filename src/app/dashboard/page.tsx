"use client";

import { useEffect, useState } from "react";
import { dbService, KidSession, Transaction } from "@/lib/db";
import { differenceInMinutes, formatDistanceToNow, isPast } from "date-fns";
import { Users, TrendingUp, DollarSign, Clock } from "lucide-react";

export default function Dashboard() {
  const [sessions, setSessions] = useState<KidSession[]>([]);
  const [revenue, setRevenue] = useState(0);
  const [tax, setTax] = useState(0);
  const [txCount, setTxCount] = useState(0);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    // Basic polling for demo purposes
    const fetchData = async () => {
      const active = await dbService.getActiveSessions();
      setSessions(active);

      const txs = await dbService.getTransactions();
      const today = new Date().toISOString().split("T")[0];
      const todaysTxs = txs.filter(t => t.timestamp.startsWith(today));
      
      const totalRev = todaysTxs.reduce((sum, t) => sum + (t.grandTotal - t.taxAmount), 0);
      const totalTax = todaysTxs.reduce((sum, t) => sum + t.taxAmount, 0);
      
      setRevenue(totalRev);
      setTax(totalTax);
      setTxCount(todaysTxs.length);
    };

    fetchData();
    const interval = setInterval(() => {
      setNow(new Date());
      fetchData(); // re-fetch to catch any new sessions
    }, 60000); // 1 minute

    return () => clearInterval(interval);
  }, []);

  const handleCheckout = async (sessionId: string) => {
    await dbService.checkoutSession(sessionId);
    const active = await dbService.getActiveSessions();
    setSessions(active);
  };

  const getSessionStatus = (session: KidSession) => {
    if (session.planId !== "1hour") return "Active (Unlimited)";
    const exp = new Date(session.checkOutTimeExpected);
    if (isPast(exp)) {
      return `Overdue by ${Math.abs(differenceInMinutes(now, exp))} min`;
    }
    return `${differenceInMinutes(exp, now)} min left`;
  };

  const isSessionOverdue = (session: KidSession) => {
    if (session.planId !== "1hour") return false;
    return isPast(new Date(session.checkOutTimeExpected));
  };

  return (
    <div className="space-y-8 no-print">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <span className="text-sm border border-gray-200 bg-white px-3 py-1 rounded-full shadow-sm text-gray-500 font-medium">
          Live Data Active
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-orange-50 p-3 rounded-lg text-orange-500"><TrendingUp size={20} /></div>
            <h3 className="text-sm font-medium text-gray-500">Today's Net Revenue</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">₹{revenue.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-3 rounded-lg text-blue-500"><DollarSign size={20} /></div>
            <h3 className="text-sm font-medium text-gray-500">GST Collected</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">₹{tax.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-50 p-3 rounded-lg text-green-500"><Users size={20} /></div>
            <h3 className="text-sm font-medium text-gray-500">Active Kids</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{sessions.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-50 p-3 rounded-lg text-purple-500"><Clock size={20} /></div>
            <h3 className="text-sm font-medium text-gray-500">Today's Transactions</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{txCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Active Sessions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-6 py-4 font-medium">Kid Name</th>
                <th className="px-6 py-4 font-medium">Parent & Phone</th>
                <th className="px-6 py-4 font-medium">Plan</th>
                <th className="px-6 py-4 font-medium">Status/Timer</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No active sessions right now. Head to the <a href="/pos" className="text-lion-500 font-semibold hover:underline">POS</a> to check kids in!
                  </td>
                </tr>
              ) : (
                sessions.map((session) => {
                  const overdue = isSessionOverdue(session);
                  return (
                    <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{session.kidName}</td>
                      <td className="px-6 py-4">
                        <div className="text-gray-900">{session.parentName}</div>
                        <div className="text-xs text-gray-500">{session.parentPhone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                          {session.planId}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {session.planId === "1hour" ? (
                          <div className={`flex items-center gap-1.5 font-medium ${overdue ? 'text-red-600 animate-pulse' : 'text-lion-600'}`}>
                            <Clock size={16} />
                            {getSessionStatus(session)}
                          </div>
                        ) : (
                          <span className="text-green-600 font-medium">Unlimited</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleCheckout(session.id)}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-medium rounded-lg transition-colors border border-gray-200"
                        >
                          Check Out
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
