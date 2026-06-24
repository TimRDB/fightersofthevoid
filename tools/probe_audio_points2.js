const fs = require('fs');
const lines = fs.readFileSync('Fighters Of The Void v59.html', 'utf8').split('\n');
const find = (label, re, max = 10) => {
    const r = new RegExp(re);
    const out = [];
    for (let i = 0; i < lines.length && out.length < max; i++) {
        if (r.test(lines[i])) out.push((i + 1) + ': ' + lines[i].trim().substring(0, 110));
    }
    console.log('--- ' + label);
    out.forEach(o => console.log(o));
};
find('boss type strings', "^\\s+type: '(destroyer|knight|count|machine|gatekeeper|markiii|destroyer2|destroyer3)");
find('bomb exploding set', 'bomb\\.exploding = true|\\.exploding = true;.*bomb');
find('knight teleport block', 'eleport.*knight|Knight.*teleport|TELEPORT');
find('boss.teleportTimer usage', 'boss\\.teleportTimer');
find('void asteroid laser states', "'charging'|'firing'|'warning'", 14);
find('soldier teleport exec', 'Execute teleport');
find('machine fires laser warning?', 'fireLaserBeam\\(');
find('count complex attack fn call', 'executeCountComplexAttack\\(boss\\)');
find('gk attacks', 'fireGatekeeperLaserBeam\\(|fireVoidLightning\\(boss\\)');
