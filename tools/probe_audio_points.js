const fs = require('fs');
const js = fs.readFileSync('Fighters Of The Void v59.html', 'utf8');
const lines = js.split('\n');
const find = (label, re) => {
    const r = new RegExp(re);
    const out = [];
    for (let i = 0; i < lines.length && out.length < 8; i++) {
        if (r.test(lines[i])) out.push((i + 1) + ': ' + lines[i].trim().substring(0, 100));
    }
    console.log('--- ' + label);
    out.forEach(o => console.log(o));
};
find('applyPowerup def', 'function applyPowerup');
find('playShootSound def', 'function playShootSound');
find('masterBeam start', 'masterBeamPhase = 1');
find('knight shootLaser calls', 'shootLaser\\(boss\\)|shootAdvancedLaser\\(boss\\)');
find('knight teleport exec', 'Knight teleport|knightTeleport|boss\\.isTeleporting');
find('count final attack', 'executeCountFinalAttack\\(|finalAttackCharging');
find('mk2 bomb deploy', 'boss\\.bomb = \\{|bomb: \\{');
find('cluster/selfdestruct fns', 'function fireClusterBomb|function explodeClusterBomb|function executeMarkIIISelfDestruct|function fireLaserBomb');
find('machine blackhole', 'blackHolePhase|blackHoleActive');
find('void asteroid laser firing state', 'val\\.state = .firing.|valState|laserPhase');
find('machine laser fn', 'function fireMachineLaser');
find('hit sound call sites', 'playControlledHumanHitSound\\(');
find('enemy shoot sfx hook', "playSfxVariant\\('Enemy_Normal_Shoot'");
find('gatekeeper spawn/victory', 'function spawnGatekeeper|function startGatekeeperVictory');
find('powerup cases', "type === 'health'|case 'health'");
find('overflow explode site', 'createTrackingGunExplosion\\(explosionX');
find('laser powerup fire', 'function fireLaserAtEnemy|function fireLanceAttack');
