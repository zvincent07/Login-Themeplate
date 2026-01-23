import React from 'react';

/**
 * Billing Page
 * 
 * Finance & Billing management for SaaS:
 * - Plans & Pricing (Create/Edit subscription tiers)
 * - Transactions/Invoices (View all payment history)
 * - Coupons/Discounts (Manage promo codes)
 */
const Billing = () => {
  return (
    <div className="max-h-[calc(100vh-7rem)] flex flex-col relative">
      <div className="flex-1 overflow-y-auto pb-20 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-4">
          Billing
        </h1>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-slate-100">
              Billing Management
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              This page will contain:
            </p>
            <ul className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-left max-w-md mx-auto space-y-2">
              <li>• Plans & Pricing (Create/Edit subscription tiers)</li>
              <li>• Transactions/Invoices (View all payment history)</li>
              <li>• Coupons/Discounts (Manage promo codes)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing;
