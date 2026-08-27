const { execFileSync } = require('child_process');
const [,, terminal, text] = process.argv;
const res = execFileSync('orca', ['terminal', 'send', '--terminal', terminal, '--text', text, '--enter', '--json'], { encoding: 'utf-8' });
console.log(res);
