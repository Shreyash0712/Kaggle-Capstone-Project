import React, { useState, useRef } from 'react';
import { X, Upload, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { updateUserName, uploadAvatar, deleteAccount, deleteAllSessions } from '../../api/client';
import { useNavigate } from 'react-router-dom';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChatsDeleted: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onChatsDeleted }) => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  
  const [name, setName] = useState(user?.name || '');
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingChats, setIsDeletingChats] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  
  const [showChatConfirm, setShowChatConfirm] = useState(false);
  const [showAccountConfirm, setShowAccountConfirm] = useState(false);
  const [accountConfirmEmail, setAccountConfirmEmail] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const handleNameSave = async () => {
    try {
      setIsUpdatingName(true);
      const updatedUser = await updateUserName(name);
      updateUser(updatedUser);
    } catch (err) {
      console.error("Failed to update name", err);
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const updatedUser = await uploadAvatar(file);
      updateUser(updatedUser);
    } catch (err) {
      console.error("Failed to upload avatar", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteChats = async () => {
    try {
      setIsDeletingChats(true);
      await deleteAllSessions();
      onChatsDeleted();
      setShowChatConfirm(false);
      navigate('/');
    } catch (err) {
      console.error("Failed to delete chats", err);
    } finally {
      setIsDeletingChats(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (accountConfirmEmail !== user.email) return;
    try {
      setIsDeletingAccount(true);
      await deleteAccount();
      logout();
      navigate('/');
    } catch (err) {
      console.error("Failed to delete account", err);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex justify-end transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div 
        className={`relative w-full max-w-md bg-[var(--bg-primary)] h-full shadow-2xl flex flex-col border-l border-[var(--border-color)] transition-transform duration-300 ease-out transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
          <h2 className="text-xl font-semibold">Settings</h2>
          <button onClick={onClose} className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-8">
          
          {/* Avatar Section */}
          <section className="flex flex-col items-center">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-2 border-[var(--border-color)]" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] flex items-center justify-center text-3xl font-bold uppercase">
                  {(user.name || user.email)[0]}
                </div>
              )}
              
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {isUploading ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Upload className="w-6 h-6 text-white" />}
              </div>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mt-2 text-center">Click to change avatar</p>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
          </section>

          {/* Profile Details */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Profile</h3>
            <div className="space-y-1">
              <label className="text-sm font-medium">Display Name</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--text-primary)]"
                  placeholder="Your Name"
                />
                <button 
                  onClick={handleNameSave}
                  disabled={isUpdatingName || name === (user.name || '')}
                  className="px-4 py-2 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {isUpdatingName ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Email</label>
              <input 
                type="text" 
                value={user.email}
                disabled
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm opacity-60 cursor-not-allowed"
              />
            </div>
          </section>

          {/* Danger Zone */}
          <section className="space-y-4 pt-4 border-t border-[var(--border-color)]">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-red-500">Danger Zone</h3>
            
            <div className="space-y-2">
              {!showChatConfirm ? (
                <button 
                  onClick={() => setShowChatConfirm(true)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <span className="font-medium text-sm">Delete All Chats</span>
                  <Trash2 className="w-4 h-4" />
                </button>
              ) : (
                <div className="p-3 rounded-lg border border-red-500/50 bg-red-500/10 space-y-3">
                  <p className="text-sm font-medium text-red-500 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Are you sure? This cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleDeleteChats}
                      disabled={isDeletingChats}
                      className="flex-1 bg-red-500 text-white py-1.5 rounded-md text-sm font-medium hover:bg-red-600 disabled:opacity-50"
                    >
                      {isDeletingChats ? 'Deleting...' : 'Yes, delete all'}
                    </button>
                    <button 
                      onClick={() => setShowChatConfirm(false)}
                      className="flex-1 bg-transparent border border-red-500 text-red-500 py-1.5 rounded-md text-sm font-medium hover:bg-red-500/10"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              {!showAccountConfirm ? (
                <button 
                  onClick={() => setShowAccountConfirm(true)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <span className="font-medium text-sm">Delete Account</span>
                  <Trash2 className="w-4 h-4" />
                </button>
              ) : (
                <div className="p-4 rounded-lg border border-red-500/50 bg-red-500/10 space-y-3">
                  <p className="text-sm font-medium text-red-500 flex gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> 
                    <span>This will permanently delete your account, all chats, and data.</span>
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">Type your email <strong className="text-[var(--text-primary)]">{user.email}</strong> to confirm:</p>
                  <input 
                    type="text"
                    value={accountConfirmEmail}
                    onChange={(e) => setAccountConfirmEmail(e.target.value)}
                    className="w-full bg-[var(--bg-secondary)] border border-red-500/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                    placeholder={user.email}
                  />
                  <div className="flex gap-2 pt-1">
                    <button 
                      onClick={handleDeleteAccount}
                      disabled={isDeletingAccount || accountConfirmEmail !== user.email}
                      className="flex-1 bg-red-500 text-white py-1.5 rounded-md text-sm font-medium hover:bg-red-600 disabled:opacity-50"
                    >
                      {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
                    </button>
                    <button 
                      onClick={() => {
                        setShowAccountConfirm(false);
                        setAccountConfirmEmail('');
                      }}
                      className="flex-1 bg-transparent border border-red-500 text-red-500 py-1.5 rounded-md text-sm font-medium hover:bg-red-500/10"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};
