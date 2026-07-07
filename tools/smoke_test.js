// Headless runtime smoke test for Fighters Of The Void v59.
// Drives real game code paths: start, enemy spawns at all levels, hit flashes,
// deaths (delayed-effect waves), all bosses + gatekeeper with flashes, player
// weapon systems, slow-motion, and a P-pause freeze check via canvas snapshots.
// The in-game loop catches per-frame exceptions and console.errors them as
// "Frame error (recovered...)" — any of those is a failure signal.
const puppeteer = require('puppeteer-core');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
    const browser = await puppeteer.launch({
        executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
        headless: 'new',
        args: ['--mute-audio', '--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required', '--window-size=1000,800']
    });
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push('PAGEERROR: ' + String(e.message).slice(0, 300)));
    page.on('console', m => {
        const t = m.text();
        if (m.type() === 'error' && !/net::ERR|Failed to load resource/.test(t)) {
            errors.push('CONSOLE-ERR: ' + t.slice(0, 300));
        }
    });

    await page.goto('file:///C:/Creative/The Void Series/Fighters Of The Void/Fighters Of The Void v59.html', { waitUntil: 'load' });
    await sleep(2500); // title screen animating
    console.log('loaded; title screen ran 2.5s');

    // Start the game the way the mode-select click does
    await page.evaluate(() => {
        game.difficultyMode = 'hard';
        game.showModeSelect = false;
        try { prewarmResources(); } catch (e) { console.error('prewarm: ' + e.message); }
        try { loadAllAudio(); } catch (e) { console.error('audio: ' + e.message); }
        game.gameStarted = true;
        // effectively invincible so death cinematics don't interrupt the run
        game.player.maxHealth = 9999999;
        game.player.health = 9999999;
    });
    await sleep(1500);

    // Phase 1: every level's late-phase enemy mix via the real spawner
    for (const lvl of [1, 2, 3, 4, 5]) {
        await page.evaluate(l => {
            game.level = l;
            game.levelProgress = Math.floor(game.maxLevelProgress * 0.9);
            for (let i = 0; i < 12; i++) spawnEnemy();
        }, lvl);
        await sleep(900);
        await page.evaluate(() => { game.enemies.forEach(e => e.hitFlashTimer = 5); }); // silhouette flash on every type
        await sleep(350);
        await page.evaluate(() => {
            for (let i = game.enemies.length - 1; i >= 0; i -= 2) {
                try { handleEnemyDeath(game.enemies[i], i); } catch (e) { console.error('killErr(' + (game.enemies[i] && game.enemies[i].type) + '): ' + e.message); }
            }
        });
        await sleep(900); // delayed explosion waves fire
        const st = await page.evaluate(() => ({
            e: game.enemies.length, p: game.particles.length,
            q: (game.delayedEffects || []).length, mf: (game.enemyMuzzleFlashes || []).length,
            kf: +(game.killFlash || 0).toFixed(3)
        }));
        console.log('level ' + lvl + ' state: ' + JSON.stringify(st));
        await page.evaluate(() => { game.enemies.length = 0; });
    }

    // Phase 2: all bosses + flash each; let their attack patterns run
    for (const lvl of [1, 2, 3, 4, 5]) {
        await page.evaluate(l => {
            game.enemies.length = 0; game.boss = null; game.level = l;
            spawnBoss();
        }, lvl);
        await sleep(2200); // boss enters + attacks (scheduleEffect volleys)
        await page.evaluate(() => { if (game.boss) game.boss.hitFlashTimer = 4; });
        await sleep(250);
        await page.evaluate(() => { if (game.boss) game.boss.hitFlashTimer = 4; });
        await sleep(500);
        const bt = await page.evaluate(() => game.boss && game.boss.type);
        console.log('boss level ' + lvl + ' (' + bt + ') ran + flashed');
        await page.evaluate(() => { game.boss = null; game.enemyBullets.length = 0; game.bossDeathPause = false; });
        await sleep(200);
    }
    // Perf probe: sustained boss hit flash vs no flash
    await page.evaluate(() => { game.enemies.length = 0; game.boss = null; game.level = 2; spawnBoss(); });
    await sleep(1500);
    const measure = flashing => page.evaluate(async (flashing) => {
        const deltas = [];
        let flasher = null;
        if (flashing) flasher = setInterval(() => { if (game.boss) game.boss.hitFlashTimer = 4; }, 40);
        await new Promise(res => {
            let last = performance.now(), n = 0;
            const tick = t => { deltas.push(t - last); last = t; if (++n < 70) requestAnimationFrame(tick); else res(); };
            requestAnimationFrame(tick);
        });
        if (flasher) clearInterval(flasher);
        deltas.sort((a, b) => a - b);
        return {
            median: +deltas[Math.floor(deltas.length / 2)].toFixed(2),
            p90: +deltas[Math.floor(deltas.length * 0.9)].toFixed(2)
        };
    }, flashing);
    console.log('knight frame ms without flash: ' + JSON.stringify(await measure(false)));
    console.log('knight frame ms with sustained flash: ' + JSON.stringify(await measure(true)));
    await page.evaluate(() => { game.boss = null; game.enemyBullets.length = 0; });

    // Gatekeeper
    await page.evaluate(() => { game.boss = null; spawnGatekeeper(); });
    await sleep(2200);
    await page.evaluate(() => { if (game.boss) game.boss.hitFlashTimer = 4; });
    await sleep(500);
    console.log('gatekeeper ran + flashed');
    await page.evaluate(() => { game.boss = null; game.enemyBullets.length = 0; });

    // Phase 3: player systems — banking keys, continuous fire, upgrades, slow-mo
    await page.evaluate(() => {
        game.level = 3; game.levelProgress = Math.floor(game.maxLevelProgress * 0.5);
        for (let i = 0; i < 8; i++) spawnEnemy();
        game.player.rapidFire = 400;
        game.player.curvedGun = 3;
        game.player.trackingGuns = 2;
        game.continuousFire = true;
        game.keys['a'] = true;
        game.slowEffectActive = true;
        game.slowEffectEnd = Date.now() + 1500;
    });
    await sleep(1600);
    await page.evaluate(() => { game.keys['a'] = false; game.keys['d'] = true; });
    await sleep(600);
    await page.evaluate(() => { game.keys['d'] = false; game.continuousFire = false; });
    console.log('player systems ran (banking, rapid+curved+tracking fire, slow-mo)');

    // Phase 4: P-pause freeze check via canvas snapshots
    const snap = () => page.evaluate(() => document.getElementById('gameCanvas').toDataURL());
    const a1 = await snap(); await sleep(250); const a2 = await snap();
    console.log('unpaused frames differ (should be true): ' + (a1 !== a2));
    await page.evaluate(() => { game.pPaused = true; });
    await sleep(400);
    const p1 = await snap(); await sleep(700); const p2 = await snap();
    console.log('P-paused frames identical (should be true): ' + (p1 === p2));
    await page.evaluate(() => { game.pPaused = false; });
    await sleep(400);
    const r1 = await snap();
    console.log('resumed frame differs from paused (should be true): ' + (r1 !== p1));

    // Let everything settle and flush any late frame errors
    await sleep(1500);
    const finalState = await page.evaluate(() => ({
        gameOver: game.gameOver, paused: game.paused || game.pPaused,
        particles: game.particles.length, queued: (game.delayedEffects || []).length
    }));
    console.log('final state: ' + JSON.stringify(finalState));

    console.log('=== ERRORS CAPTURED: ' + errors.length + ' ===');
    errors.slice(0, 40).forEach(e => console.log(e));
    await browser.close();
    process.exit(errors.length ? 1 : 0);
})().catch(e => { console.error('TEST DRIVER FAILED: ' + e.message); process.exit(2); });
