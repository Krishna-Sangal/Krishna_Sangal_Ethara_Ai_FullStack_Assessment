import React from 'react';
import { motion } from 'framer-motion';
import { HiExclamationTriangle } from 'react-icons/hi2';

export default function ConfirmModal({ title, message, onConfirm, onCancel, danger = false }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="glass-card w-full max-w-sm p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-4 mb-5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${danger ? 'bg-red-500/20' : 'bg-amber-500/20'}`}>
            <HiExclamationTriangle className={`w-5 h-5 ${danger ? 'text-red-400' : 'text-amber-400'}`} />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">{title}</h3>
            <p className="text-sm text-slate-400 mt-1 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
          <button onClick={onConfirm} className={`flex-1 font-semibold px-4 py-2 rounded-lg transition-all duration-200 active:scale-95 ${danger ? 'bg-red-500 hover:bg-red-600 text-white' : 'btn-primary'}`}>
            Confirm
          </button>
        </div>
      </motion.div>
    </div>
  );
}
