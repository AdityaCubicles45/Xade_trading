"use client";

import { useRouter } from 'next/navigation';

const plans = [
  {
    name: 'Base',
    balance: '$5,000',
    fee: 79,
    auditionFee: 79,
    cryptos: '100+',
    balanceValue: 5000,
  },
  {
    name: 'Starter',
    balance: '$10,000',
    fee: 99,
    auditionFee: 99,
    cryptos: '63',
    balanceValue: 10000,
  },
  {
    name: 'Skilled',
    balance: '$15,000',
    fee: 149,
    auditionFee: 149,
    cryptos: '100+',
    balanceValue: 15000,
  },
  {
    name: 'Intermediate',
    balance: '$25,000',
    fee: 249,
    auditionFee: 249,
    cryptos: '63',
    balanceValue: 25000,
  },
  {
    name: 'Advanced',
    balance: '$50,000',
    fee: 399,
    auditionFee: 399,
    cryptos: '63',
    balanceValue: 50000,
  },
  {
    name: 'Expert',
    balance: '$100,000',
    fee: 799,
    auditionFee: 799,
    cryptos: '63',
    balanceValue: 100000,
  },
];

export default function PricingPage() {
  const router = useRouter();

  const handleBuyNow = (plan: typeof plans[number]) => {
    // Store the selected balance in localStorage
    localStorage.setItem('selectedBalance', plan.balanceValue.toString());
    // Redirect to dashboard
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 flex flex-col items-center">
      <div className="w-full max-w-7xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
        {plans.map((plan) => (
          <div key={plan.name} className="flex flex-col items-center">
          <div
              className="bg-white rounded-2xl shadow-md border border-gray-200 flex flex-col items-center p-8 min-h-[540px] w-full text-center"
          >
              <h2 className="text-2xl font-extrabold mb-2 text-black">{plan.name}</h2>
              <div className="text-3xl font-extrabold mb-1 text-blue-600">{plan.balance}</div>
              <div className="text-gray-400 mb-2">Account Balance</div>
              <div className="mb-4">
                <span className="text-black">Challenge Fee </span>
                <span className="font-semibold text-blue-600">${plan.fee}</span>
              </div>
              <div className="w-full border-b border-gray-200 my-4"></div>
              <div className="font-semibold mb-2 text-black">Features</div>
              <ul className="w-full text-gray-700 text-sm mb-6 space-y-2">
                <li className="py-4 border-b border-gray-200">2 Step Assessment Process</li>
                <li className="py-4 border-b border-gray-200">Unlimited Trading Period</li>
                <li className="py-4 border-b border-gray-200">Up to 90% Profit Split</li>
                <li className="py-4 border-b border-gray-200">${plan.auditionFee} Audition Fee</li>
                <li className="py-4 border-b border-gray-200">You Can Trade {plan.cryptos} Cryptos</li>
                <li className="py-4">Up To 1: 5 Leverage</li>
              </ul>
            </div>
            <div className="mt-6 mb-2 text-center">
              <div className="font-bold text-lg text-black">{plan.name}</div>
              <div className="text-blue-600 text-2xl font-bold mt-1">{plan.fee.toFixed(2)} $</div>
            </div>
            <button
              className="w-full max-w-[160px] rounded-full py-2 px-6 text-white font-semibold text-lg transition bg-blue-600 hover:bg-blue-700"
              onClick={() => handleBuyNow(plan)}
            >
              Buy Now
            </button>
          </div>
        ))}
      </div>
    </div>
  );
} 