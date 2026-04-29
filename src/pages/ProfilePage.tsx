import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  User, Settings, Bell, ChevronRight,
  Moon, Trash2, Download, Upload, Tags, Camera, Pencil
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { CategoryManageSheet } from '@/components/CategoryManageSheet';

const PROFILE_KEY = 'flowcash_profile_v1';

interface ProfileData {
  avatar: string;
  nickname: string;
  bio: string;
}

function loadProfile(): ProfileData {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { avatar: '', nickname: '记账达人', bio: '开始记录每一笔收支' };
}

function saveProfile(data: ProfileData) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

function formatAdaptiveAmount(amount: number): string {
  if (amount < 1000) {
    return `¥${amount.toFixed(2)}`;
  } else if (amount < 10000) {
    return `${(amount / 1000).toFixed(2)}千`;
  } else {
    return `${(amount / 10000).toFixed(2)}万`;
  }
}

export function ProfilePage() {
  const { state, addTransaction } = useApp();
  const [profile, setProfile] = useState<ProfileData>(loadProfile);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [importStatus, setImportStatus] = useState<string>('');
  const [categoryManageOpen, setCategoryManageOpen] = useState(false);
  const [editingField, setEditingField] = useState<null | 'nickname' | 'bio'>(null);
  const [editValue, setEditValue] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const totalTransactions = state.transactions.length;
  const totalExpense = state.transactions
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);
  const totalIncome = state.transactions
    .filter(t => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);

  const updateProfile = (patch: Partial<ProfileData>) => {
    const next = { ...profile, ...patch };
    setProfile(next);
    saveProfile(next);
  };

  const handleAvatarClick = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) updateProfile({ avatar: dataUrl });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const startEdit = (field: 'nickname' | 'bio') => {
    setEditingField(field);
    setEditValue(field === 'nickname' ? profile.nickname : profile.bio);
  };

  const confirmEdit = () => {
    if (editingField === 'nickname') updateProfile({ nickname: editValue.trim() || profile.nickname });
    if (editingField === 'bio') updateProfile({ bio: editValue.trim() || profile.bio });
    setEditingField(null);
  };

  const handleClearData = () => {
    if (showClearConfirm) {
      localStorage.removeItem('flowcash_data_v1');
      window.location.reload();
    } else {
      setShowClearConfirm(true);
      setTimeout(() => setShowClearConfirm(false), 3000);
    }
  };

  // Export CSV
  const handleExport = () => {
    const headers = ['date', 'amount', 'category', 'type', 'note'];
    const rows = state.transactions.map(t => [
      t.date,
      t.amount.toFixed(2),
      t.category,
      t.type,
      t.note || ''
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flowcash_export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setImportStatus('导出成功');
    setTimeout(() => setImportStatus(''), 2000);
  };

  // Import CSV
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 2) {
          setImportStatus('文件为空');
          setTimeout(() => setImportStatus(''), 2000);
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const dateIdx = headers.indexOf('date');
        const amountIdx = headers.indexOf('amount');
        const categoryIdx = headers.indexOf('category');
        const typeIdx = headers.indexOf('type');
        const noteIdx = headers.indexOf('note');

        if (dateIdx === -1 || amountIdx === -1 || categoryIdx === -1 || typeIdx === -1) {
          setImportStatus('格式错误');
          setTimeout(() => setImportStatus(''), 2000);
          return;
        }

        let imported = 0;
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',');
          if (cols.length < Math.max(dateIdx, amountIdx, categoryIdx, typeIdx) + 1) continue;

          const amount = parseFloat(cols[amountIdx]);
          const type = cols[typeIdx].trim() as 'expense' | 'income';
          if (isNaN(amount) || amount <= 0 || !['expense', 'income'].includes(type)) continue;

          addTransaction({
            amount,
            category: cols[categoryIdx].trim(),
            date: cols[dateIdx].trim(),
            type,
            note: noteIdx >= 0 ? cols[noteIdx]?.trim() || undefined : undefined,
          });
          imported++;
        }

        setImportStatus(`成功导入 ${imported} 条`);
        setTimeout(() => setImportStatus(''), 2000);
      } catch {
        setImportStatus('导入失败');
        setTimeout(() => setImportStatus(''), 2000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const menuSections: {
    title: string;
    items: {
      icon: typeof User;
      label: string;
      value: string;
      color: string;
      danger?: boolean;
      onClick?: () => void;
    }[];
  }[] = [
    {
      title: '偏好设置',
      items: [
        { icon: Moon, label: '深色模式', value: '跟随系统', color: '#5856D6', onClick: undefined },
        { icon: Bell, label: '记账提醒', value: '已开启', color: '#FF9500', onClick: undefined },
      ],
    },
    {
      title: '数据管理',
      items: [
        { icon: Tags, label: '类别管理', value: '', color: '#5856D6', onClick: () => setCategoryManageOpen(true) },
        { icon: Download, label: '导出数据', value: 'CSV格式', color: '#34C759', onClick: handleExport },
        { icon: Upload, label: '导入数据', value: '', color: '#007AFF', onClick: handleImportClick },
        { icon: Trash2, label: '清除数据', value: '', color: '#FF3B30', danger: true, onClick: handleClearData },
      ],
    },
    {
      title: '关于',
      items: [
        { icon: Settings, label: '版本', value: 'v1.0.0', color: '#8A8A8E', onClick: undefined },
      ],
    },
  ];

  return (
    <div className="flex flex-col h-full bg-[#F9FAFB] overflow-hidden">
      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
      <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />

      {/* Header */}
      <div className="shrink-0 bg-white border-b border-[#F0F0F0] px-4 pt-3 pb-4 safe-area-top">
        <h1 className="text-xl font-bold text-[#1A1A1A]">我的</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar relative">
        {/* User Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mx-4 mt-4 bg-gradient-to-br from-[#34C759] to-[#30D158] rounded-2xl p-5 shadow-lg shadow-[#34C759]/20"
        >
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <button
              onClick={handleAvatarClick}
              className="relative w-16 h-16 rounded-full overflow-hidden shrink-0 active:scale-95 transition-transform"
            >
              {profile.avatar ? (
                <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-white/20 flex items-center justify-center">
                  <User size={32} className="text-white" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 active:opacity-100 transition-opacity">
                <Camera size={18} className="text-white" />
              </div>
            </button>

            {/* Nickname & Bio */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {editingField === 'nickname' ? (
                  <input
                    autoFocus
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onBlur={confirmEdit}
                    onKeyDown={e => { if (e.key === 'Enter') confirmEdit(); }}
                    className="bg-white/20 text-white placeholder-white/50 rounded-lg px-2 py-1 text-sm font-bold outline-none w-full"
                    placeholder="昵称"
                  />
                ) : (
                  <button onClick={() => startEdit('nickname')} className="flex items-center gap-1 text-left group">
                    <h2 className="text-lg font-bold text-white">{profile.nickname}</h2>
                    <Pencil size={12} className="text-white/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                {editingField === 'bio' ? (
                  <input
                    autoFocus
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onBlur={confirmEdit}
                    onKeyDown={e => { if (e.key === 'Enter') confirmEdit(); }}
                    className="bg-white/20 text-white placeholder-white/50 rounded-lg px-2 py-1 text-sm outline-none w-full"
                    placeholder="个性签名"
                  />
                ) : (
                  <button onClick={() => startEdit('bio')} className="flex items-center gap-1 text-left group">
                    <p className="text-white/70 text-sm">{profile.bio}</p>
                    <Pencil size={10} className="text-white/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/20">
            <div className="text-center">
              <p className="text-xl font-bold text-white">{totalTransactions}</p>
              <p className="text-white/70 text-xs mt-0.5">总笔数</p>
            </div>
            <div className="text-center border-l border-white/20">
              <p className="text-xl font-bold text-white">{formatAdaptiveAmount(totalExpense)}</p>
              <p className="text-white/70 text-xs mt-0.5">总支出</p>
            </div>
            <div className="text-center border-l border-white/20">
              <p className="text-xl font-bold text-white">{formatAdaptiveAmount(totalIncome)}</p>
              <p className="text-white/70 text-xs mt-0.5">总收入</p>
            </div>
          </div>
        </motion.div>

        {/* Menu Sections */}
        {menuSections.map((section, si) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + si * 0.1 }}
            className="mt-6 px-4"
          >
            <h3 className="text-xs font-semibold text-[#8A8A8E] uppercase tracking-wide mb-2 px-1">
              {section.title}
            </h3>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isClearData = item.label === '清除数据';
                const isActive = isClearData && showClearConfirm;

                return (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-left border-b border-[#F0F0F0] last:border-b-0 active:bg-[#F9FAFB] transition-colors ${
                      isActive ? 'bg-[#FF3B30]/5' : ''
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: item.danger && isActive ? '#FF3B30' : `${item.color}15` }}
                    >
                      <Icon
                        size={16}
                        style={{ color: item.danger && isActive ? '#fff' : item.color }}
                        strokeWidth={1.5}
                      />
                    </div>
                    <span className={`flex-1 text-sm font-medium ${
                      item.danger ? (isActive ? 'text-[#FF3B30]' : 'text-[#FF3B30]') : 'text-[#1A1A1A]'
                    }`}>
                      {isActive ? '再次点击确认清除' : item.label}
                    </span>
                    {item.value && (
                      <span className="text-sm text-[#8A8A8E]">{item.value}</span>
                    )}
                    <ChevronRight size={16} className="text-[#C7C7CC]" />
                  </button>
                );
              })}
            </div>
          </motion.div>
        ))}

        {/* Footer */}
        <div className="py-8 text-center relative">
          {importStatus && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute -top-2 left-1/2 -translate-x-1/2 px-4 py-2 bg-[#1A1A1A] text-white text-sm rounded-full whitespace-nowrap"
            >
              {importStatus}
            </motion.div>
          )}
          <p className="text-xs text-[#C7C7CC]">FlowCash 简易记账</p>
          <p className="text-xs text-[#C7C7CC] mt-0.5">数据仅存储在本地设备</p>
        </div>
        {/* Category Manage Sheet */}
        <CategoryManageSheet
          open={categoryManageOpen}
          onClose={() => setCategoryManageOpen(false)}
        />
      </div>
    </div>
  );
}
