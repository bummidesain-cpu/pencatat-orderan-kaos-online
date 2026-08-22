const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const themeFunc = `
  const handleThemeChange = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    localStorage.setItem('bummi_theme', newTheme);
  };

  useEffect(() => {
    const applyTheme = () => {
      const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.classList.toggle('dark', isDark);
    };
    applyTheme();
    
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', applyTheme);
      return () => mediaQuery.removeEventListener('change', applyTheme);
    }
  }, [theme]);
`;

content = content.replace(/  \/\/ Sync state changes/g, themeFunc + '\n  // Sync state changes');

fs.writeFileSync('src/App.tsx', content);
