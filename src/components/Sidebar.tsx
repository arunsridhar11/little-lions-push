"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, UserPlus, CreditCard, Settings } from "lucide-react";
import clsx from "clsx";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "POS Billing", href: "/pos", icon: CreditCard },
  { name: "Customers", href: "/customers", icon: Users },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
      <div className="flex h-16 shrink-0 items-center mt-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-lion-400 to-lion-600 shadow-sm">
            <span className="text-xl font-bold text-white">L</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900">
            Little Lions
          </span>
        </div>
      </div>
      <nav className="flex flex-1 flex-col mt-4">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-2">
              {navigation.map((item) => {
                const isActive = pathname?.startsWith(item.href);
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={clsx(
                        isActive
                          ? "bg-lion-50 text-lion-600 font-semibold"
                          : "text-gray-700 hover:bg-gray-50 hover:text-lion-600",
                        "group flex gap-x-3 rounded-lg p-3 text-sm leading-6 transition-colors duration-200"
                      )}
                    >
                      <item.icon
                        className={clsx(
                          isActive ? "text-lion-500" : "text-gray-400 group-hover:text-lion-500",
                          "h-5 w-5 shrink-0"
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>
          <li className="mt-auto">
            <Link
              href="/settings"
              className="group -mx-2 flex gap-x-3 rounded-md p-3 text-sm font-semibold leading-6 text-gray-700 hover:bg-gray-50 hover:text-lion-600"
            >
              <Settings
                className="h-5 w-5 shrink-0 text-gray-400 group-hover:text-lion-500"
                aria-hidden="true"
              />
              Settings
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
