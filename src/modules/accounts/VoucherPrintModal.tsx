import React from 'react';
import { AccountTransaction } from '../../types';
import { Printer, X, CheckCircle, Building2 } from 'lucide-react';
import { triggerAppPrint } from '../../utils/printUtils';

interface VoucherPrintModalProps {
  voucher: AccountTransaction | null;
  onClose: () => void;
}

export const VoucherPrintModal: React.FC<VoucherPrintModalProps> = ({ voucher, onClose }) => {
  if (!voucher) return null;

  const isReceive = voucher.voucherType === 'Receive' || voucher.voucherType === 'Receipt' || (voucher.credit > 0 && voucher.debit === 0);

  const formatBDT = (val: number) =>
    '৳ ' + Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white text-slate-900 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
        {/* Actions Bar (Screen Only) */}
        <div className="print:hidden bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${isReceive ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
              {isReceive ? 'MONEY RECEIPT (টাকা জমা স্লিপ)' : 'PAYMENT VOUCHER (খরচ ভাউচার)'}
            </span>
            <span className="text-xs text-slate-300 font-mono">{voucher.voucherNo}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => triggerAppPrint()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow transition"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Voucher
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Voucher Paper */}
        <div className="p-6 md:p-8 bg-white" id="printable-voucher-paper">
          {/* Header */}
          <div className="text-center border-b-2 border-slate-900 pb-4 mb-5">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Building2 className="w-6 h-6 text-slate-900" />
              <h1 className="text-xl md:text-2xl font-black uppercase tracking-wider text-slate-900">
                PATRIOT SPINNING MILLS LTD.
              </h1>
            </div>
            <p className="text-xs font-medium text-slate-600">
              Factory: Mawna, Sreepur, Gazipur, Bangladesh | Head Office: Dhaka
            </p>
            <div className="mt-3 inline-block">
              <span className={`px-4 py-1 rounded-md text-xs font-black uppercase tracking-widest border ${
                isReceive 
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800' 
                  : 'bg-rose-50 border-rose-500 text-rose-800'
              }`}>
                {isReceive ? 'FACTORY CASH MONEY RECEIPT / জমা ভাউচার' : 'FACTORY DAILY EXPENSE VOUCHER / খরচ ভাউচার'}
              </span>
            </div>
          </div>

          {/* Top Meta Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs mb-5 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div>
              <div className="flex justify-between py-1 border-b border-slate-200/80">
                <span className="font-semibold text-slate-600">Voucher / Ref No:</span>
                <span className="font-bold font-mono text-slate-900">{voucher.voucherNo}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/80">
                <span className="font-semibold text-slate-600">Transaction Date:</span>
                <span className="font-bold text-slate-900">{voucher.date}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="font-semibold text-slate-600">Payment Mode:</span>
                <span className="font-medium text-slate-800">{voucher.paymentMethod || 'Cash'}</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between py-1 border-b border-slate-200/80">
                <span className="font-semibold text-slate-600">{isReceive ? 'Received From:' : 'Paid To / Supplier:'}</span>
                <span className="font-bold text-slate-900 truncate max-w-[180px]">{voucher.partyName || 'Factory Cash Counter'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/80">
                <span className="font-semibold text-slate-600">Category / Head:</span>
                <span className="font-bold text-slate-900">{voucher.category}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="font-semibold text-slate-600">Ref / Slip No:</span>
                <span className="font-medium text-slate-800">{voucher.referenceNo || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Amount Box */}
          <div className="border border-slate-300 rounded-lg p-4 mb-5 bg-slate-50/50">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                {isReceive ? 'Amount Received (গৃহীত টাকা):' : 'Amount Paid (প্রদত্ত টাকা):'}
              </span>
              <span className={`text-2xl font-black ${isReceive ? 'text-emerald-700' : 'text-rose-700'}`}>
                {formatBDT(voucher.amount)}
              </span>
            </div>
            <div className="text-xs text-slate-700 mt-2 pt-2 border-t border-slate-200">
              <span className="font-bold text-slate-900">Description / বিবরণ: </span>
              <span>{voucher.narration || 'Factory cash transaction'}</span>
            </div>
            {voucher.remarks && (
              <div className="text-xs text-slate-500 mt-1">
                <span className="font-semibold text-slate-700">Remarks / মন্তব্য: </span>
                <span>{voucher.remarks}</span>
              </div>
            )}
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-4 gap-2 pt-10 text-center text-[11px] text-slate-700 border-t border-slate-200 mt-8">
            <div>
              <div className="border-b border-dashed border-slate-400 pb-1 mb-1"></div>
              <p className="font-semibold">Prepared By</p>
            </div>
            <div>
              <div className="border-b border-dashed border-slate-400 pb-1 mb-1"></div>
              <p className="font-semibold">Verified / Checked</p>
            </div>
            <div>
              <div className="border-b border-dashed border-slate-400 pb-1 mb-1"></div>
              <p className="font-semibold">Factory Cashier</p>
            </div>
            <div>
              <div className="border-b border-dashed border-slate-400 pb-1 mb-1"></div>
              <p className="font-semibold">Authorized Signatory</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
