const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/    return <LoginView onLogin=\{handleLoginAttempt\} \/>;/g, `    return (
      <LoginView
        onLoginSuccess={handleLoginAttempt}
        users={users}
        settings={settings}
      />
    );`);

fs.writeFileSync('src/App.tsx', content);
