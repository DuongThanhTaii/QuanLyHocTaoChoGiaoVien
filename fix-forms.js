
const fs = require('fs');
const files = [
  'src/app/(auth)/login/page.tsx',
  'src/app/(auth)/register/page.tsx',
  'src/app/(dashboard)/teacher/classes/[id]/attendance/page.tsx',
  'src/app/(dashboard)/teacher/classes/[id]/students/page.tsx',
  'src/app/(dashboard)/teacher/classes/create/page.tsx'
];
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/action=\{([a-zA-Z0-9_]+)\}/g, 'action={\ as any}');
  fs.writeFileSync(f, content);
});

