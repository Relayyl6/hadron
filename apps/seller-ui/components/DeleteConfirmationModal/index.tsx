import React from 'react';
import { X, AlertTriangle, RefreshCw, Loader2, Check } from 'lucide-react';

const DeleteConfirmationModal = ({
  product,
  onClose,
  onConfirm,
  onRestore,
  processing = false,
  isSuccess = false
}: any) => {
  if (!product) return null;

  const isDeleted = product?.isDeleted;

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative bg-[#18181b] border border-gray-800 p-8 rounded-3xl w-full max-w-[400px] shadow-[0_0_50px_rgba(0,0,0,0.4)] text-center animate-in fade-in zoom-in-95 duration-200">
          <div className={`mx-auto w-16 h-16 mb-5 flex items-center justify-center rounded-full shadow-inner ${isDeleted ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
            <Check size={32} strokeWidth={2.5} />
          </div>
          
          <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Success!</h3>
          <p className="text-gray-400 mb-8 leading-relaxed">
            <span className="text-gray-200 font-semibold">{product.title}</span> has been successfully {isDeleted ? 'restored' : 'moved to the delete state'}.
          </p>
          
          <button
            onClick={onClose}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={!processing ? onClose : undefined}
      />
      
      {/* Modal Content */}
      <div className="relative bg-[#18181b] border border-gray-800 p-8 rounded-3xl w-full max-w-[440px] shadow-[0_0_50px_rgba(0,0,0,0.4)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Decorative background glow */}
        <div className={`absolute -top-24 -right-24 w-56 h-56 rounded-full blur-[80px] opacity-20 pointer-events-none ${isDeleted ? 'bg-green-500' : 'bg-red-500'}`} />

        {/* Header / Icon */}
        <div className="flex justify-between items-start mb-6">
          <div className={`p-4 rounded-2xl flex items-center justify-center shadow-inner ${
            isDeleted 
              ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            {isDeleted ? <RefreshCw size={28} strokeWidth={2.5} /> : <AlertTriangle size={28} strokeWidth={2.5} />}
          </div>
          <button
            onClick={onClose}
            disabled={processing}
            className="p-2.5 bg-gray-800/40 hover:bg-gray-800 text-gray-400 hover:text-white rounded-full transition-all disabled:opacity-50"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Content */}
        <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">
          {isDeleted ? "Restore Product?" : "Delete Product?"}
        </h3>
        
        <div className="text-[15px] text-gray-400 mb-8 leading-relaxed">
          {isDeleted ? (
             <p>
                Are you sure you want to restore <span className="font-semibold text-gray-200">{product.title}</span>? 
                <br className="mb-2 block" />
                This will remove it from the delete state and make it active on your store again.
             </p>
          ) : (
             <p>
                Are you sure you want to delete <span className="font-semibold text-gray-200">{product.title}</span>?
                <br className="mt-3 mb-2 block" />
                This product will be moved to a <strong className="text-gray-300 font-medium bg-gray-800/50 px-1.5 py-0.5 rounded">delete state</strong> and permanently removed <strong className="text-red-400 font-medium bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded">after 24 hours</strong>. You can recover it within this time.
             </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-5 border-t border-gray-800/60">
          <button
            onClick={onClose}
            disabled={processing}
            className="bg-transparent hover:bg-gray-800/80 border border-gray-700 px-6 py-3 rounded-xl text-gray-300 hover:text-white transition-all disabled:opacity-50 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={!isDeleted ? onConfirm : onRestore}
            disabled={processing}
            className={`px-6 py-3 rounded-xl text-white font-semibold transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 ${
              isDeleted
                ? "bg-green-600 hover:bg-green-500 shadow-green-600/20 hover:shadow-green-500/30 ring-1 ring-green-500/50"
                : "bg-red-600 hover:bg-red-500 shadow-red-600/20 hover:shadow-red-500/30 ring-1 ring-red-500/50"
            }`}
          >
            {processing && <Loader2 size={18} className="animate-spin" />}
            {processing 
              ? (isDeleted ? 'Restoring...' : 'Deleting...') 
              : (isDeleted ? 'Restore' : 'Delete')
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;