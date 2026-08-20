"use client";

import { useEffect, useState } from "react";
import { dbService, Customer } from "@/lib/db";
import { Search, UserCheck, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchCustomers = async () => {
      const all = await dbService.getCustomers();
      setCustomers(all.sort((a, b) => new Date(b.lastVisitedAt).getTime() - new Date(a.lastVisitedAt).getTime()));
    };
    fetchCustomers();
  }, []);

  const filtered = customers.filter(
    (c) =>
      c.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Customer Database</h1>
          <p className="mt-2 text-sm text-gray-700">Search and manage returning parents and kids.</p>
        </div>
        
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            className="block w-full sm:w-72 rounded-lg border-0 py-2.5 pl-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-lion-500 sm:text-sm sm:leading-6"
            placeholder="Search by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((customer) => (
          <div key={customer.phone} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col gap-4 hover:border-lion-200 hover:shadow-md transition-all">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg text-gray-900">{customer.parentName}</h3>
                <p className="text-gray-500 text-sm">{customer.phone}</p>
              </div>
              <div className="bg-lion-50 text-lion-600 px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                <UserCheck size={14} /> {customer.totalVisits} Visit{customer.totalVisits > 1 ? 's' : ''}
              </div>
            </div>
            
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Kids</p>
              <div className="flex flex-wrap gap-2">
                {customer.kids.map((kid, i) => (
                  <span key={i} className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                    {kid}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-gray-50 flex items-center gap-2 text-xs text-gray-400">
              <Calendar size={14} />
              Last Visit: {format(new Date(customer.lastVisitedAt), "PP")}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500 border-2 border-dashed border-gray-200 rounded-2xl">
            <Search className="mx-auto h-8 w-8 text-gray-400 mb-3" />
            No customers found matching "{searchTerm}"
          </div>
        )}
      </div>
    </div>
  );
}
