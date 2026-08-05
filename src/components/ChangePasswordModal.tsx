import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { KeyRound, Eye, EyeOff, Lock, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess(null);
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, loading]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!currentPassword.trim()) {
      setError('Please enter your current password.');
      return;
    }

    if (!newPassword.trim()) {
      setError('Please enter a new password.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (!confirmPassword.trim()) {
      setError('Please confirm your new password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password cannot be identical to your current password.');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      setSuccess(response.data?.message || 'Password changed successfully!');
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err: any) {
      const apiMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to change password. Please try again.';
      setError(apiMessage);
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="animate-in fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          handleClose();
        }
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden animate-in zoom-in-95"
        style={{
          backgroundColor: 'rgb(var(--surface))',
          borderColor: 'rgb(var(--border))',
          maxHeight: 'calc(100vh - 32px)',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 py-4 border-b flex items-center justify-between shrink-0"
          style={{ borderColor: 'rgb(var(--border))' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{
                backgroundColor: 'rgba(124, 58, 237, 0.15)',
                color: 'rgb(var(--accent))',
              }}
            >
              <KeyRound size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color: 'rgb(var(--text-1))' }}>
                Change Password
              </h2>
              <p className="text-xs" style={{ color: 'rgb(var(--text-3))' }}>
                Update your account password securely
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-200 transition-colors disabled:opacity-50"
            style={{ backgroundColor: 'transparent' }}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div
              className="p-3 rounded-xl flex items-start gap-2.5 text-xs font-medium border animate-in fade-in"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                borderColor: 'rgba(239, 68, 68, 0.3)',
                color: '#f87171',
              }}
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div
              className="p-3 rounded-xl flex items-start gap-2.5 text-xs font-medium border animate-in fade-in"
              style={{
                backgroundColor: 'rgba(34, 197, 94, 0.12)',
                borderColor: 'rgba(34, 197, 94, 0.3)',
                color: '#4ade80',
              }}
            >
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* Current Password */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgb(var(--text-2))' }}>
              Current Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Lock size={15} />
              </div>
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Enter current password"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl text-sm border transition-all focus:outline-hidden"
                style={{
                  backgroundColor: 'rgb(var(--surface-2))',
                  borderColor: 'rgb(var(--border))',
                  color: 'rgb(var(--text-1))',
                }}
                disabled={loading || !!success}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200"
              >
                {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgb(var(--text-2))' }}>
              New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <KeyRound size={15} />
              </div>
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="At least 8 characters"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl text-sm border transition-all focus:outline-hidden"
                style={{
                  backgroundColor: 'rgb(var(--surface-2))',
                  borderColor: 'rgb(var(--border))',
                  color: 'rgb(var(--text-1))',
                }}
                disabled={loading || !!success}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200"
              >
                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <p className="text-[11px] mt-1" style={{ color: 'rgb(var(--text-3))' }}>
              Must contain minimum 8 characters.
            </p>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgb(var(--text-2))' }}>
              Confirm New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <KeyRound size={15} />
              </div>
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Re-enter new password"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl text-sm border transition-all focus:outline-hidden"
                style={{
                  backgroundColor: 'rgb(var(--surface-2))',
                  borderColor: 'rgb(var(--border))',
                  color: 'rgb(var(--text-1))',
                }}
                disabled={loading || !!success}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200"
              >
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary px-4 py-2 rounded-xl text-sm font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !!success}
              className="btn-primary px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};
