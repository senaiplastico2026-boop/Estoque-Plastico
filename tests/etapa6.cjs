// NODE_PATH=<directory containing playwright> node tests/etapa6.cjs
// Real Edge DOM/CSS/dialog; extracted production functions, simulated session/data.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const app = read('app.js');
function extract(name) {
    const start = app.search(new RegExp(`(?:async )?function ${name}\\(`));
    assert.ok(start >= 0, name);
    return app.slice(start, app.indexOf('\n}', start) + 2);
}
const component = app.slice(app.indexOf('let origemModalCodigoTurma'), app.indexOf('// LIMPAR FORMULÁRIO DE TURMA'));
const dialog = read('index.html').match(/<dialog id="modalCodigoTurma"[\s\S]*?<\/dialog>/g);
assert.equal(dialog.length, 1);
const profiles = ['models/meuperfil.js', 'models/professor.js'].map(file => {
    const source = read(file);
    const start = source.indexOf('${', source.indexOf('<div class="profile-class-code">'));
    const end = source.indexOf('</strong>', start);
    return source.slice(start, end).trim();
});
(async () => {
    const browser = await chromium.launch({ channel: 'msedge', headless: true });
    let checks = 0;
    try {
        const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
        const errors = [];
        page.on('pageerror', e => errors.push(e.message));
        await page.route('**/*', route => route.fulfill({ contentType: 'text/html', body: '<html><body></body></html>' }));
        await page.goto('http://etapa6.test');
        await page.setContent(`<style>${read('style.css')}</style><span id="turmaAtualHeader"></span><span id="turmaAtualCodigo"></span><div id="turmasPaginaLista"></div><div id="profiles"></div>${dialog[0]}`);
        await page.evaluate(() => {
            window.listenerCounts = {};
            const original = EventTarget.prototype.addEventListener;
            EventTarget.prototype.addEventListener = function(type, fn, options) {
                const key = (this.id || (this === document ? 'document' : this.tagName)) + ':' + type;
                listenerCounts[key] = (listenerCounts[key] || 0) + 1;
                return original.call(this, type, fn, options);
            };
            window.calls = {};
            for (const name of ['get', 'set', 'update', 'push', 'remove', 'definirTurmaAtual', 'abrirTurmaDoProfessor', 'entrarNaTurma']) {
                window[name] = () => { calls[name] = (calls[name] || 0) + 1; };
            }
            window.currentUser = { uid: 'p1' };
            window.currentUserRole = 'professor';
            window.turmasDisponiveis = [{ id: 'A', nome: 'Turma A', codigo: '123456' }, { id: 'B', nome: 'Turma B', codigo: '987654' }];
            window.currentTurma = turmasDisponiveis[0];
            window.turmaSelecionada = currentTurma;
            window.userExtraInfo = { role: 'professor', turmaAtualId: 'A' };
            window.senaiTurmaAtualId = 'A';
            localStorage.setItem('turmaAtualId', 'A');
            window.garantirAbaTurmasProfessor = () => {};
            window.carregarTurmasDisponiveis = async () => {};
            window.filtrarTurmas = items => items;
            window.obterProfessoresTurma = () => [];
            window.professorPodeApagarTurma = () => false;
            window.snapshot = () => JSON.stringify([currentTurma, turmaSelecionada, userExtraInfo, senaiTurmaAtualId, { ...localStorage }, calls]);
        });
        await page.addScriptTag({ content: [extract('escapeHtml'), extract('atualizarTurmaInterface'), component, extract('renderTurmasPagina')].join('\n') });
        const test = async (name, fn) => { await fn(); console.log(`OK ${++checks}: ${name}`); };
        const opened = () => page.locator('#modalCodigoTurma').evaluate(el => el.open);
        const value = () => page.locator('#modalCodigoTurmaValor').textContent();
        const close = async () => {
            await page.locator('#fecharModalCodigoTurma').click();
            await page.waitForFunction(() => !document.body.classList.contains('codigo-turma-modal-aberto'));
        };
        await test('professor header opens current code/name; X closes and restores focus', async () => {
            await page.evaluate(() => atualizarTurmaInterface());
            await page.locator('#turmaAtualCodigo button').click();
            assert.equal(await opened(), true);
            assert.equal(await value(), '123456');
            assert.equal(await page.locator('#modalCodigoTurmaNome').textContent(), 'Turma A');
            assert.equal(await page.evaluate(() => document.activeElement.id), 'fecharModalCodigoTurma');
            await close();
            assert.equal(await page.evaluate(() => document.activeElement.parentElement.id), 'turmaAtualCodigo');
        });
        await test('A to B header reads new data without stale closure', async () => {
            await page.evaluate(() => { currentTurma = turmasDisponiveis[1]; atualizarTurmaInterface(); });
            await page.locator('#turmaAtualCodigo button').click();
            assert.equal(await value(), '987654');
            assert.equal(await page.locator('#modalCodigoTurmaNome').textContent(), 'Turma B');
            await close();
        });
        await test('student receives plain header and cannot open via API', async () => {
            await page.evaluate(() => { currentUserRole = 'aluno'; atualizarTurmaInterface(); abrirModalCodigoTurma('123456', 'Blocked'); });
            assert.equal(await page.locator('#turmaAtualCodigo button').count(), 0);
            assert.equal(await opened(), false);
            await page.evaluate(() => { currentUserRole = 'professor'; currentTurma = turmasDisponiveis[0]; atualizarTurmaInterface(); });
        });
        await test('012345, 4321, ABC123 and hostile text are preserved safely; empty name clears', async () => {
            for (const code of ['012345', '4321', 'ABC123', '<img src=x onerror=alert(1)>']) {
                await page.evaluate(code => abrirModalCodigoTurma(code, '<b>Nome</b>'), code);
                assert.equal(await value(), code);
                assert.equal(await page.locator('#modalCodigoTurmaNome').textContent(), '<b>Nome</b>');
                assert.equal(await page.locator('#modalCodigoTurma img, #modalCodigoTurma b').count(), 0);
            }
            await page.evaluate(() => abrirModalCodigoTurma('987654', ''));
            assert.equal(await page.locator('#modalCodigoTurmaNome').textContent(), '');
            await close();
        });
        await test('real rendered card B only presents B: every state and Firebase spy unchanged', async () => {
            await page.evaluate(() => renderTurmasPagina());
            const before = await page.evaluate(() => snapshot());
            await page.locator('[data-turma-id="B"]').click();
            assert.equal(await value(), '987654');
            assert.equal(await page.locator('#modalCodigoTurmaNome').textContent(), 'Turma B');
            await close();
            assert.equal(await page.evaluate(() => snapshot()), before);
            await page.locator('.turma-entrar-page[data-id="B"]').click();
            assert.equal(await page.evaluate(() => calls.abrirTurmaDoProfessor), 1);
        });
        await test('both actual profile templates: professor clickable, student plain, same dialog', async () => {
            for (const template of profiles) {
                await page.evaluate(template => {
                    const render = new Function('currentUserRole', 'userExtraInfo', 'turmaAtual', 'turmaCodigo', 'escapeHTML', 'return `' + template + '`');
                    document.getElementById('profiles').innerHTML = render('professor', { role: 'professor' }, currentTurma, currentTurma.codigo, escapeHtml);
                    window.renderStudentProfile = () => render('aluno', { role: 'aluno' }, currentTurma, currentTurma.codigo, escapeHtml);
                }, template);
                await page.locator('#profiles button').click();
                assert.equal(await value(), '123456');
                await close();
                await page.evaluate(() => document.getElementById('profiles').innerHTML = renderStudentProfile());
                assert.equal(await page.locator('#profiles button').count(), 0);
            }
        });
        await test('native ESC, backdrop, keyboard containment and repeated cycles register no listeners', async () => {
            const listeners = await page.evaluate(() => JSON.stringify(listenerCounts));
            await page.evaluate(() => { window.closes = 0; document.getElementById('modalCodigoTurma').onclose = () => closes++; });
            for (let i = 0; i < 6; i++) {
                await page.locator('#turmaAtualCodigo button').focus();
                await page.keyboard.press('Enter');
                assert.equal(await opened(), true);
                await page.keyboard.press('Tab');
                await page.keyboard.press('Tab');
                assert.equal(await page.evaluate(() => document.getElementById('modalCodigoTurma').contains(document.activeElement)), true);
                if (i % 3 === 0) await page.keyboard.press('Escape');
                else if (i % 3 === 1) await page.mouse.click(2, 2);
                else await page.locator('#fecharModalCodigoTurma').click();
                await page.waitForFunction(n => closes === n && !document.body.classList.contains('codigo-turma-modal-aberto'), i + 1);
                assert.equal(await opened(), false);
                assert.equal(await value(), '');
            }
            assert.equal(await page.evaluate(() => JSON.stringify(listenerCounts)), listeners);
        });
        await test('rapid close/reopen keeps latest content; repeated close harmless', async () => {
            await page.evaluate(() => { abrirModalCodigoTurma('A', 'A'); fecharModalCodigoTurma(); fecharModalCodigoTurma(); abrirModalCodigoTurma('B', 'B'); });
            await page.waitForTimeout(60);
            assert.equal(await value(), 'B');
            assert.equal(await opened(), true);
            await close();
        });
        await test('desktop/mobile layout centered, readable, no horizontal overflow, long legacy code', async () => {
            for (const [width, height] of [[1280, 900], [320, 568], [568, 320]]) {
                await page.setViewportSize({ width, height });
                for (const code of ['012345', 'ABC123'.repeat(12)]) {
                    await page.evaluate(code => abrirModalCodigoTurma(code, 'Nome muito longo '.repeat(12)), code);
                    const metrics = await page.locator('#modalCodigoTurma').evaluate(el => {
                        const r = el.getBoundingClientRect();
                        return { x: r.x, y: r.y, w: r.width, h: r.height, scroll: el.scrollWidth, client: el.clientWidth, size: parseFloat(getComputedStyle(document.getElementById('modalCodigoTurmaValor')).fontSize) };
                    });
                    assert.ok(metrics.x >= 0 && metrics.y >= 0 && metrics.w <= width && metrics.h <= height);
                    assert.ok(Math.abs(metrics.x * 2 + metrics.w - width) < 3);
                    assert.ok(metrics.scroll <= metrics.client + 1);
                    assert.ok(metrics.size >= 35);
                    await close();
                }
            }
        });
        assert.deepEqual(errors, []);
        console.log(`${checks} groups passed; real Edge browser, simulated data; no real Firebase.`);
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
