const fs = require('fs');
const path = require('path');
const html = fs.readFileSync('Fighters Of The Void v59.html', 'utf8');
const m = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];
m.forEach((s, i) => {
    try { new Function(s[1]); console.log('script', i, 'syntax OK'); }
    catch (e) { console.log('script', i, 'SYNTAX ERROR:', e.message); }
});
const js = m[0][1];

// 1. All names registered in sfxList
const listMatch = js.match(/const sfxList = \{([\s\S]*?)\};/);
const registered = new Set([...listMatch[1].matchAll(/(\w+):/g)].map(x => x[1]));

// 2. All names referenced by playSfxVariant / playSound / playSoundBuffer string literals
const used = new Set([...js.matchAll(/play(?:SfxVariant|Sound|SoundPooled|SoundBuffer)\('([^']+)'/g)].map(x => x[1]));

// 3. Generated files on disk
const genDir = path.join('assets', 'sfx');
const onDisk = new Set(fs.readdirSync(genDir).map(f => f.replace('.wav', '')));

console.log('\nUsed but NOT registered:');
[...used].filter(n => !registered.has(n)).forEach(n => console.log('  MISSING:', n));
console.log('Registered gen/ entries missing on disk:');
[...listMatch[1].matchAll(/(\w+):\s+GEN \+ '([^']+)'/g)].forEach(x => {
    if (!onDisk.has(x[2].replace('.wav', ''))) console.log('  NO FILE:', x[2]);
});
console.log('Engine files on disk:');
[...js.matchAll(/src: 'assets\/sfx\/([^']+)'/g), ...js.matchAll(/overlay: 'assets\/sfx\/([^']+)'/g)].forEach(x => {
    console.log('  ', x[1], onDisk.has(x[1].replace('.wav', '')) ? 'OK' : 'NO FILE!');
});
console.log('\nused sound names:', used.size, '| registered:', registered.size, '| gen files:', onDisk.size);
console.log('updateBossEngine refs:', (js.match(/updateBossEngine/g) || []).length);
console.log('playEnemyShootSound refs:', (js.match(/playEnemyShootSound/g) || []).length);
