import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Trash2, Plus, ChevronLeft, Coffee, ShoppingBag, Bus, Film, Home,
  HeartPulse, BookOpen, MoreHorizontal, Banknote, TrendingUp, Gift,
  Briefcase, Car, Plane, Train, Bike, Zap, Wifi, Smartphone, Monitor,
  Camera, Music, Gamepad2, Dumbbell, Baby, PawPrint, Flower2, Sun, Cloud,
  Umbrella, Utensils, Beer, IceCream, Apple, Pizza, Cake, Fish, Soup,
  Salad, Egg, Trophy, Star, Heart, Sparkles, Flame, Moon, ShoppingCart,
  Store, Bed, Brush, Wrench, Key, Lock, Shield, Check, Bell, Calendar,
  Clock, Target, MapPin, Navigation, Battery, Lightbulb, Fan,
  Thermometer, Stethoscope, Pill, GraduationCap, PenTool, Pencil,
  Palette, Image, Video, Mic, Headphones, Speaker, Tv, Printer,
  Tag, Bookmark, FileText, Mail, Send, MessageSquare, Link, Share2,
  Code, Terminal, Keyboard, MousePointer, Joystick, Diamond,
  Coins, Wallet, CreditCard, Receipt, Calculator, Percent, TrendingDown,
  BarChart3, PieChart, LineChart, Activity, Eye, Smile, Frown, Cat,
  Dog, Bird, Bug, Shell, Rabbit, ArrowUp, ArrowDown, ArrowLeft,
  ArrowRight, Maximize, Minimize, Expand, RotateCcw, RefreshCw,
  Repeat, Shuffle, Undo, Redo, History, Play, Pause, Circle,
  Triangle, Hexagon, Snowflake, Wind, CloudRain, CloudSun,
  Sunrise, Sunset, Hash, List, Filter, Settings, Search,
  HelpCircle, AlertTriangle, Layers, Box, Package, Truck, Fuel,
  ParkingCircle, Plug, Shirt, Watch, Glasses, Scissors, Hammer,
  Ruler, Compass, Globe, Anchor, Ship, Sailboat, Mountain, TreePine,
  Leaf, Crown, Medal, Award, ThumbsUp,
  ThumbsDown, Flag, Pin, FlagTriangleRight, NotebookPen,
  StickyNote, ClipboardList, FolderKanban, GitBranch, Binary, Bot,
  Cpu, HardDrive, Database, Server, Network, Radio, Satellite,
  Router, EthernetPort, Usb, BatteryCharging, BatteryFull, BatteryLow,
  BatteryMedium, BatteryWarning, Power, PowerOff, SunDim,
  CloudFog, CloudHail, CloudLightning, CloudMoon,
  CloudMoonRain, CloudSunRain, Droplets, ThermometerSun,
  ThermometerSnowflake, Waves,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

const iconMap: Record<string, React.ComponentType<any>> = {
  Coffee, ShoppingBag, Bus, Film, Home, HeartPulse, BookOpen, MoreHorizontal,
  Banknote, TrendingUp, Gift, Plus, Briefcase, Car, Plane, Train, Bike, Zap,
  Wifi, Smartphone, Monitor, Camera, Music, Gamepad2, Dumbbell, Baby,
  PawPrint, Flower2, Sun, Cloud, Umbrella, Utensils, Beer, IceCream, Apple,
  Pizza, Cake, Fish, Soup, Salad, Egg, Trophy, Star, Heart, Sparkles, Flame,
  Moon, ShoppingCart, Store, Bed, Brush, Wrench, Key, Lock, Shield, Check,
  Bell, Calendar, Clock, Target, MapPin, Navigation, Battery, Lightbulb, Fan,
  Thermometer, Stethoscope, Pill, GraduationCap, PenTool, Pencil,
  Palette, Image, Video, Mic, Headphones, Speaker, Tv, Printer,
  Tag, Bookmark, FileText, Mail, Send, MessageSquare, Link, Share2,
  Code, Terminal, Keyboard, MousePointer, Joystick, Diamond,
  Coins, Wallet, CreditCard, Receipt, Calculator, Percent, TrendingDown,
  BarChart3, PieChart, LineChart, Activity, Eye, Smile, Frown, Cat,
  Dog, Bird, Bug, Shell, Rabbit, ArrowUp, ArrowDown, ArrowLeft,
  ArrowRight, Maximize, Minimize, Expand, RotateCcw, RefreshCw,
  Repeat, Shuffle, Undo, Redo, History, Play, Pause, Circle,
  Triangle, Hexagon, Snowflake, Wind, CloudRain, CloudSun,
  Sunrise, Sunset, Hash, List, Filter, Settings, Search,
  HelpCircle, AlertTriangle, Layers, Box, Package, Truck, Fuel,
  ParkingCircle, Plug, Shirt, Watch, Glasses, Scissors, Hammer,
  Ruler, Compass, Globe, Anchor, Ship, Sailboat, Mountain, TreePine,
  Leaf, Crown, Medal, Award, ThumbsUp,
  ThumbsDown, Flag, Pin, FlagTriangleRight, NotebookPen,
  StickyNote, ClipboardList, FolderKanban, GitBranch, Binary, Bot,
  Cpu, HardDrive, Database, Server, Network, Radio, Satellite,
  Router, EthernetPort, Usb, BatteryCharging, BatteryFull, BatteryLow,
  BatteryMedium, BatteryWarning, Power, PowerOff, SunDim,
  CloudFog, CloudHail, CloudLightning, CloudMoon,
  CloudMoonRain, CloudSunRain, Droplets, ThermometerSun,
  ThermometerSnowflake, Waves,
};

const AVAILABLE_ICON_KEYS = Object.keys(iconMap);

const PRESET_COLORS = [
  '#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#30D158',
  '#00C7BE', '#32ADE6', '#007AFF', '#5856D6', '#AF52DE',
  '#FF2D55', '#A2845E', '#8A8A8E', '#1A1A1A', '#5AC8FA',
  '#BF5AF2', '#FF375F', '#64D2FF', '#FFD60A', '#EB5545',
];

interface CategoryManageSheetProps {
  open: boolean;
  onClose: () => void;
}

export function CategoryManageSheet({ open, onClose }: CategoryManageSheetProps) {
  const { state, deleteCategory, addCategory } = useApp();
  const [tab, setTab] = useState<'expense' | 'income'>('expense');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('MoreHorizontal');
  const [newColor, setNewColor] = useState('#34C759');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const categories = state.categories.filter(c => c.type === tab && !c.deleted);

  const handleAdd = () => {
    if (!newName.trim()) return;
    addCategory({
      name: newName.trim(),
      icon: newIcon,
      color: newColor,
      type: tab,
      description: '',
    });
    setNewName('');
    setNewIcon('MoreHorizontal');
    setNewColor('#34C759');
    setShowAddForm(false);
  };

  const handleDelete = (id: string) => {
    if (confirmDelete === id) {
      deleteCategory(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 2000);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="relative bg-white rounded-t-3xl shadow-2xl overflow-hidden flex flex-col"
            style={{ maxHeight: '85vh', height: '85vh' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between px-4 pt-4 pb-2">
              {showAddForm ? (
                <button onClick={() => setShowAddForm(false)} className="w-10 h-10 flex items-center justify-center -ml-1">
                  <ChevronLeft size={24} className="text-[#1A1A1A]" />
                </button>
              ) : (
                <div className="w-10" />
              )}
              <h2 className="text-lg font-semibold text-[#1A1A1A]">
                {showAddForm ? '添加类别' : '类别管理'}
              </h2>
              <button onClick={onClose} className="w-10 h-10 flex items-center justify-center -mr-1">
                <X size={22} className="text-[#8A8A8E]" />
              </button>
            </div>

            {/* Type Tabs */}
            {!showAddForm && (
              <div className="shrink-0 flex gap-1 p-2 mx-4 mb-2 bg-[#F2F2F7] rounded-xl">
                <button
                  onClick={() => setTab('expense')}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                    tab === 'expense'
                      ? 'bg-white text-[#FF3B30] shadow-sm'
                      : 'text-[#8A8A8E]'
                  }`}
                >
                  支出
                </button>
                <button
                  onClick={() => setTab('income')}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                    tab === 'income'
                      ? 'bg-white text-[#34C759] shadow-sm'
                      : 'text-[#8A8A8E]'
                  }`}
                >
                  收入
                </button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <AnimatePresence mode="wait">
                {!showAddForm ? (
                  <motion.div
                    key="list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="px-4 pb-4"
                  >
                    {/* Add Button */}
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="w-full flex items-center justify-center gap-2 py-3 mb-3 rounded-xl bg-[#F9FAFB] border border-dashed border-[#C7C7CC] text-[#8A8A8E] active:bg-[#F2F2F7] transition-colors"
                    >
                      <Plus size={18} />
                      <span className="text-sm font-medium">添加新类别</span>
                    </button>

                    {/* Category List */}
                    <div className="space-y-2">
                      {categories.map((cat) => {
                        const Icon = iconMap[cat.icon] || MoreHorizontal;
                        const isConfirming = confirmDelete === cat.id;

                        return (
                          <motion.div
                            key={cat.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex items-center gap-3 px-4 py-3 bg-white rounded-xl shadow-sm border border-[#F0F0F0] ${
                              isConfirming ? 'border-[#FF3B30]/30' : ''
                            }`}
                          >
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                              style={{ backgroundColor: `${cat.color}15` }}
                            >
                              <Icon size={20} style={{ color: cat.color }} strokeWidth={1.5} />
                            </div>
                            <span className="flex-1 text-sm font-medium text-[#1A1A1A]">{cat.name}</span>
                            <button
                              onClick={() => handleDelete(cat.id)}
                              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                                isConfirming
                                  ? 'bg-[#FF3B30] text-white'
                                  : 'bg-[#F2F2F7] text-[#C7C7CC]'
                              }`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="px-4 pb-4 space-y-4"
                  >
                    {/* Name */}
                    <div>
                      <label className="text-sm font-medium text-[#8A8A8E] mb-2 block">类别名称</label>
                      <input
                        type="text"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        placeholder="例如：健身"
                        className="w-full h-12 px-4 rounded-xl bg-[#F9FAFB] text-[#1A1A1A] font-medium text-base outline-none focus:ring-2 focus:ring-[#34C759]/30 transition-shadow placeholder:text-[#C7C7CC]"
                      />
                    </div>

                    {/* Color */}
                    <div>
                      <label className="text-sm font-medium text-[#8A8A8E] mb-2 block">颜色</label>
                      <div className="flex flex-wrap gap-2">
                        {PRESET_COLORS.map(c => (
                          <button
                            key={c}
                            onClick={() => setNewColor(c)}
                            className={`w-8 h-8 rounded-full transition-transform active:scale-90 ${
                              newColor === c ? 'ring-2 ring-offset-2 ring-[#1A1A1A]' : ''
                            }`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Icon */}
                    <div>
                      <label className="text-sm font-medium text-[#8A8A8E] mb-2 block">
                        图标 ({newIcon})
                      </label>
                      <div className="grid grid-cols-8 gap-2 bg-[#F9FAFB] rounded-xl p-3 max-h-48 overflow-y-auto no-scrollbar">
                        {AVAILABLE_ICON_KEYS.map(key => {
                          const Icon = iconMap[key] || MoreHorizontal;
                          const isSelected = newIcon === key;
                          return (
                            <button
                              key={key}
                              onClick={() => setNewIcon(key)}
                              className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${
                                isSelected
                                  ? 'bg-[#1A1A1A] text-white'
                                  : 'bg-white text-[#8A8A8E] active:bg-[#F2F2F7]'
                              }`}
                            >
                              <Icon size={16} strokeWidth={1.5} />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      onClick={handleAdd}
                      disabled={!newName.trim()}
                      className="w-full h-12 rounded-xl font-semibold text-white bg-[#34C759] active:scale-[0.97] transition-all disabled:opacity-40"
                    >
                      添加
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
