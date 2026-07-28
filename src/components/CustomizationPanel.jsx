import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, RotateCcw } from 'lucide-react';
import { defaultTheme, presetThemes } from '../config/themeDefaults';
import { showSuccess, showError, showConfirm } from '../utils/swalUtils';

export const CustomizationPanel = ({ isOpen, onClose }) => {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('adminTheme');
      return saved ? JSON.parse(saved) : defaultTheme;
    } catch {
      return defaultTheme;
    }
  });

  const [showPreview, setShowPreview] = useState(false);

  // Apply theme in real-time as it changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const applyTheme = (themeToApply) => {
    const root = document.documentElement;
    Object.keys(themeToApply).forEach(key => {
      const cssVar = '--' + key.replace(/([A-Z])/g, '-$1').toLowerCase();
      root.style.setProperty(cssVar, themeToApply[key]);
    });
  };

  const updateTheme = (key, value) => {
    setTheme(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    try {
      localStorage.setItem('adminTheme', JSON.stringify(theme));
      showSuccess('Changes saved successfully!');
      onClose();
    } catch (error) {
      console.error('Save error:', error);
      showError('Error saving changes');
    }
  };

  const handleReset = async () => {
    const { isConfirmed: confirmed } = await showConfirm({
      title: 'Reset Customizations',
      text: 'Reset all customizations to default?',
      confirmButtonText: 'Yes, Reset',
    });
    if (confirmed) {
      setTheme(defaultTheme);
      localStorage.setItem('adminTheme', JSON.stringify(defaultTheme));
      showSuccess('Reset to default!');
    }
  };

  const applyPreset = (presetKey) => {
    const presetTheme = presetThemes[presetKey];
    setTheme(presetTheme);
  };

  if (!isOpen) return null;

  const ColorInput = ({ label, value, onChange, description }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm text-gray-300 font-medium">{label}</label>
        <span className="text-xs text-gray-500">{value}</span>
      </div>
      {description && <p className="text-xs text-gray-500">{description}</p>}
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 rounded-lg cursor-pointer border border-white/10"
      />
    </div>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
      />
      <motion.div
        initial={{ x: 400 }}
        animate={{ x: 0 }}
        exit={{ x: 400 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 h-screen w-[500px] bg-gray-900 border-l border-white/10 z-50 overflow-y-auto scrollbar-thin flex flex-col"
      >
        <div className="p-6 border-b border-white/10 bg-gray-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-gradient">🎨 Customize Colors</h2>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-400">Real-time preview enabled • Changes apply instantly</p>
        </div>

        {/* Preset Themes */}
        <div className="p-6 border-b border-white/10 space-y-3">
          <h3 className="text-sm font-semibold text-purple-400">Quick Presets</h3>
          <div className="grid grid-cols-4 gap-2">
            {Object.keys(presetThemes).map(presetKey => (
              <button
                key={presetKey}
                onClick={() => applyPreset(presetKey)}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium transition-all capitalize"
              >
                {presetKey}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          
          {/* Sidebar Colors */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-purple-400 flex items-center gap-2">
              📍 Sidebar
            </h3>
            <ColorInput 
              label="Background" 
              value={theme.sidebarBg} 
              onChange={(v) => updateTheme('sidebarBg', v)}
              description="Main sidebar background color"
            />
            <ColorInput 
              label="Text Color" 
              value={theme.sidebarText} 
              onChange={(v) => updateTheme('sidebarText', v)}
              description="Default menu item text"
            />
            <ColorInput 
              label="Active Text Color" 
              value={theme.sidebarActiveText} 
              onChange={(v) => updateTheme('sidebarActiveText', v)}
              description="Selected menu item text"
            />
            <ColorInput 
              label="Active Text Highlight" 
              value={theme.sidebarActiveTextColor} 
              onChange={(v) => updateTheme('sidebarActiveTextColor', v)}
              description="Active indicator color"
            />
            <ColorInput 
              label="Hover Background" 
              value={theme.sidebarHoverBg} 
              onChange={(v) => updateTheme('sidebarHoverBg', v)}
              description="Background on hover"
            />
            <ColorInput 
              label="Border Color" 
              value={theme.sidebarBorder} 
              onChange={(v) => updateTheme('sidebarBorder', v)}
              description="Sidebar border/separator"
            />
          </div>

          {/* Navbar Colors */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-pink-400 flex items-center gap-2">
              🔝 Navbar
            </h3>
            <ColorInput 
              label="Background" 
              value={theme.navbarBg} 
              onChange={(v) => updateTheme('navbarBg', v)}
              description="Top navbar background"
            />
            <ColorInput 
              label="Text Color" 
              value={theme.navbarText} 
              onChange={(v) => updateTheme('navbarText', v)}
              description="Navbar text and icons"
            />
            <ColorInput 
              label="Border Color" 
              value={theme.navbarBorder} 
              onChange={(v) => updateTheme('navbarBorder', v)}
              description="Navbar bottom border"
            />
          </div>

          {/* Main Content */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-blue-400 flex items-center gap-2">
              📄 Main Content
            </h3>
            <ColorInput 
              label="Page Background" 
              value={theme.mainBg} 
              onChange={(v) => updateTheme('mainBg', v)}
              description="Main page background"
            />
            <ColorInput 
              label="Card Background" 
              value={theme.cardBg} 
              onChange={(v) => updateTheme('cardBg', v)}
              description="Cards, panels, containers"
            />
            <ColorInput 
              label="Card Border" 
              value={theme.cardBorder} 
              onChange={(v) => updateTheme('cardBorder', v)}
              description="Card border color"
            />
            <ColorInput 
              label="Card Text" 
              value={theme.cardText} 
              onChange={(v) => updateTheme('cardText', v)}
              description="Text inside cards"
            />
          </div>

          {/* Table Colors */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-green-400 flex items-center gap-2">
              📊 Tables
            </h3>
            <ColorInput 
              label="Header Background" 
              value={theme.tableHeaderBg} 
              onChange={(v) => updateTheme('tableHeaderBg', v)}
              description="Table header row"
            />
            <ColorInput 
              label="Header Text" 
              value={theme.tableHeaderText} 
              onChange={(v) => updateTheme('tableHeaderText', v)}
              description="Table header column names"
            />
            <ColorInput 
              label="Row Background" 
              value={theme.tableRowBg} 
              onChange={(v) => updateTheme('tableRowBg', v)}
              description="Table row background"
            />
            <ColorInput 
              label="Row Text" 
              value={theme.tableRowText} 
              onChange={(v) => updateTheme('tableRowText', v)}
              description="Table row text"
            />
            <ColorInput 
              label="Hover Background" 
              value={theme.tableRowHoverBg} 
              onChange={(v) => updateTheme('tableRowHoverBg', v)}
              description="Row hover effect"
            />
            <ColorInput 
              label="Borders" 
              value={theme.tableBorder} 
              onChange={(v) => updateTheme('tableBorder', v)}
              description="Table cell borders"
            />
          </div>

          {/* Input Fields */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-yellow-400 flex items-center gap-2">
              ⌨️ Inputs & Forms
            </h3>
            <ColorInput 
              label="Input Background" 
              value={theme.inputBg} 
              onChange={(v) => updateTheme('inputBg', v)}
              description="Input field background"
            />
            <ColorInput 
              label="Input Border" 
              value={theme.inputBorder} 
              onChange={(v) => updateTheme('inputBorder', v)}
              description="Input field border"
            />
            <ColorInput 
              label="Input Text" 
              value={theme.inputText} 
              onChange={(v) => updateTheme('inputText', v)}
              description="Placeholder & typed text"
            />
          </div>

          {/* Theme Colors */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-orange-400 flex items-center gap-2">
              🎭 Theme Colors
            </h3>
            <ColorInput 
              label="Primary" 
              value={theme.primaryColor} 
              onChange={(v) => updateTheme('primaryColor', v)}
              description="Main brand color"
            />
            <ColorInput 
              label="Secondary" 
              value={theme.secondaryColor} 
              onChange={(v) => updateTheme('secondaryColor', v)}
              description="Secondary accent"
            />
            <ColorInput 
              label="Accent" 
              value={theme.accentColor} 
              onChange={(v) => updateTheme('accentColor', v)}
              description="Highlights & focus"
            />
            <ColorInput 
              label="Success" 
              value={theme.successColor} 
              onChange={(v) => updateTheme('successColor', v)}
              description="Success states"
            />
            <ColorInput 
              label="Warning" 
              value={theme.warningColor} 
              onChange={(v) => updateTheme('warningColor', v)}
              description="Warning alerts"
            />
            <ColorInput 
              label="Error" 
              value={theme.errorColor} 
              onChange={(v) => updateTheme('errorColor', v)}
              description="Error states"
            />
          </div>

          {/* Border Radius */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
              🔲 Rounded Corners
            </h3>
            <label className="block text-sm text-gray-300">Border Radius</label>
            <select
              value={theme.borderRadius}
              onChange={(e) => updateTheme('borderRadius', e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-white/10 rounded-lg text-gray-300"
            >
              <option value="2px">Extra Sharp</option>
              <option value="4px">Sharp</option>
              <option value="8px">Rounded</option>
              <option value="12px">Very Rounded</option>
              <option value="16px">Extra Rounded</option>
              <option value="24px">Very Extra Rounded</option>
            </select>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="p-6 border-t border-white/10 bg-gray-800 space-y-3 sticky bottom-0">
          <button
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            <Save className="w-5 h-5" />
            Save Changes
          </button>
          
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 font-medium transition-all"
          >
            Cancel
          </button>

          <button
            onClick={handleReset}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 rounded-lg text-red-400 font-medium transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Default
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
