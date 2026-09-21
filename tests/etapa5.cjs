// Execute: node tests/etapa5.cjs. Firebase and DOM are simulated; no remote writes.
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.join(__dirname, '..');
const authSource = readFileSync(path.join(root, 'auth.js'), 'utf8');
const appSource = readFileSync(path.join(root, 'app.js'), 'utf8');
function extract(source, name) {
    const start = source.search(new RegExp(`(?:async )?function ${name}\\(`));
    assert.ok(start >= 0, name);
    return source.slice(start, source.indexOf('\n}', start) + 2);
}
const storage = new Map();
const records = {};
let writes = [], reads = [], failRead = null, failWrite = null, holdWrite = null;
const elements = new Map();
const buttons = [{ disabled: false }];
const rendered = [];
const c = vm.createContext({
    console: { error() {}, warn() {} }, Date, String, Object, Array, Boolean,
    auth: { currentUser: { uid: 'p1', email: 'p1@example.com' } },
    userRole: 'professor', isOnline: true, userExtraInfo: {}, db: {},
    currentUser: { uid: 'p1', email: 'p1@example.com' }, currentUserRole: 'professor',
    currentTurma: null, turmaSelecionada: null, processandoEntradaProfessor: false,
    ref: (_, key = '') => key,
    get: async key => {
        reads.push(key);
        if (failRead) throw failRead;
        return { exists: () => records[key] !== undefined, val: () => records[key] };
    },
    update: async (_, data) => {
        if (holdWrite) await holdWrite;
        if (failWrite) throw failWrite;
        writes.push(data);
    },
    sanitizeEmail: email => email.replace(/\./g, ','),
    localStorage: {
        setItem: (key, value) => storage.set(key, String(value)),
        getItem: key => storage.get(key) ?? null,
        removeItem: key => storage.delete(key)
    },
    document: {
        querySelectorAll: () => buttons,
        getElementById: id => {
            if (!elements.has(id)) elements.set(id, { replaceChildren() { this.cleared = true; }, style: {} });
            return elements.get(id);
        }
    },
    window: { showTab: tab => { c.lastTab = tab; } },
    alert: message => { c.lastAlert = message; },
    mostrarApp() {}, atualizarTurmaInterface() {}, closeSidebar() {},
    renderDashboard: async () => rendered.push(['dashboard', storage.get('turmaAtualId')]),
    renderMateriais: async () => rendered.push(['materiais', storage.get('turmaAtualId')]),
    renderMoinho: async () => rendered.push(['moinho', storage.get('turmaAtualId')]),
    renderHistorico: async () => rendered.push(['historico', storage.get('turmaAtualId')])
});
for (const name of ['professorPertenceTurma', 'acessarTurmaDoProfessor', 'entrarNaTurma', 'salvarTurmaAtual']) {
    vm.runInContext(extract(authSource, name), c);
}
for (const name of ['definirTurmaAtual', 'abrirSistemaNaTurma', 'abrirTurmaDoProfessor', 'confirmarEntradaNaTurma']) {
    vm.runInContext(extract(appSource, name), c);
}
let count = 0;
async function test(name, fn) { await fn(); console.log(`OK ${++count}: ${name}`); }
(async () => {
    records['turmas/A'] = { nome: 'A', codigo: '123456', ativo: true, professores: { p1: { uid: 'p1' } } };
    records['turmas/B'] = { nome: 'B', codigo: '654321', ativo: true, professores: { p1: true } };
    records['turmas/X'] = { nome: 'X', codigo: '123456', professores: { p2: { uid: 'p2' } } };
    await test('login remains on Minhas Turmas and discards cached context', () => {
        const f = extract(appSource, 'prepararPosLogin');
        assert.match(f, /definirTurmaAtual\(null\)/);
        assert.match(f, /showTab\(\s*'turmas'/);
        assert.doesNotMatch(appSource, /currentTurma\s*=\s*turmaParseada/);
    });
    await test('card calls direct opening; professor gate has no code input', () => {
        assert.match(extract(appSource, 'renderTurmasPagina'), /abrirTurmaDoProfessor\(turma.id\)/);
        const html = readFileSync(path.join(root, 'index.html'), 'utf8');
        const professor = html.split('<template id="turmaGateProfessorTemplate">')[1].split('</template>')[0];
        assert.doesNotMatch(professor, /id="codigoTurmaEntrada"/);
    });
    await test('linked professor enters directly without code', async () => {
        await c.abrirTurmaDoProfessor('A');
        assert.equal(c.currentTurma.id, 'A'); assert.equal(c.lastTab, 'dashboard');
        assert.equal(writes.length, 1);
        assert.equal(writes[0]['usuarios/p1/turmaAtualId'], 'A');
        assert.equal(writes[0]['professores/p1@example,com/turmaAtualId'], 'A');
    });
    await test('creator UID and additional professor UID are accepted', () => {
        assert.equal(c.professorPertenceTurma({ criadoPorUid: 'p1' }, c.currentUser), true);
        assert.equal(c.professorPertenceTurma({ criadoPorUid: 'p2', professores: { p1: { uid: 'p1' } } }, c.currentUser), true);
    });
    await test('name and conflicting legacy identifiers do not grant access', () => {
        for (const turma of [
            { professores: ['p1'] }, { criadoPorNome: 'p1' },
            { professores: [{ uid: 'p2', email: 'p1@example.com' }] },
            { criadoPorUid: 'p2', criadoPorEmail: 'p1@example.com' },
            { professores: { p1: { uid: 'p2' } } }
        ]) assert.equal(c.professorPertenceTurma(turma, c.currentUser), false);
        assert.equal(c.professorPertenceTurma({ professores: [{ email: 'P1@example.com' }] }, c.currentUser), true);
        assert.equal(c.professorPertenceTurma({ criadoPorEmail: 'p1@example.com' }, c.currentUser), true);
    });
    await test('unlinked professor is denied even knowing code', async () => {
        const before = writes.length;
        const r = await c.entrarNaTurma('X', '123456', 'p1', 'professor');
        assert.equal(r.success, false); assert.match(r.error, /não possui acesso/);
        assert.equal(writes.length, before); assert.equal(c.currentTurma.id, 'A');
    });
    await test('A to B synchronizes every local source and all module renders', async () => {
        rendered.length = 0;
        await c.abrirTurmaDoProfessor('B');
        assert.equal(c.currentTurma.id, 'B'); assert.equal(c.turmaSelecionada.id, 'B');
        assert.equal(c.window.senaiTurmaAtualId, 'B'); assert.equal(c.userExtraInfo.turmaAtualId, 'B');
        assert.equal(storage.get('turmaAtualId'), 'B'); assert.equal(JSON.parse(storage.get('turmaAtual')).id, 'B');
        assert.equal(storage.get('turmaAtualCodigo'), '654321');
        assert.deepEqual(rendered, ['dashboard', 'materiais', 'moinho', 'historico'].map(name => [name, 'B']));
        for (const id of ['tabDashboard', 'tabMateriais', 'tabMoinho', 'tabPerfil']) assert.equal(elements.get(id).cleared, true);
    });
    await test('double click performs one read, one persistence and one opening', async () => {
        let release;
        holdWrite = new Promise(resolve => { release = resolve; });
        const before = writes.length, beforeReads = reads.length;
        const first = c.abrirTurmaDoProfessor('A');
        await Promise.resolve();
        const second = c.abrirTurmaDoProfessor('A');
        assert.equal(buttons[0].disabled, true);
        release(); await Promise.all([first, second]); holdWrite = null;
        assert.equal(writes.length - before, 1); assert.equal(reads.length - beforeReads, 1);
        assert.equal(buttons[0].disabled, false);
    });
    await test('removed membership is re-read despite old localStorage', async () => {
        delete records['turmas/A'].professores.p1;
        const r = await c.acessarTurmaDoProfessor('A');
        assert.equal(r.success, false);
    });
    await test('missing, inactive, permission, connection and save failures are distinguished', async () => {
        assert.match((await c.acessarTurmaDoProfessor('missing')).error, /não encontrada/);
        records['turmas/B'].ativo = false;
        assert.match((await c.acessarTurmaDoProfessor('B')).error, /desativada/);
        records['turmas/B'].ativo = true;
        failRead = { code: 'PERMISSION_DENIED' };
        assert.match((await c.acessarTurmaDoProfessor('B')).error, /permissão/);
        failRead = new Error('network');
        assert.match((await c.acessarTurmaDoProfessor('B')).error, /conexão/); failRead = null;
        const before = storage.get('turmaAtualId');
        failWrite = new Error('failed');
        assert.match((await c.acessarTurmaDoProfessor('B')).error, /salvar/); failWrite = null;
        assert.equal(storage.get('turmaAtualId'), before);
    });
    await test('unauthenticated user, wrong role and switched session cannot open', async () => {
        c.userRole = 'aluno'; assert.equal((await c.acessarTurmaDoProfessor('B')).success, false);
        c.userRole = 'professor';
        assert.equal((await c.entrarNaTurma('B', '', 'p2', 'professor')).success, false);
    });
    await test('student confirmation still delegates to code flow', async () => {
        let calls = 0; c.confirmarEntradaAlunoPorCodigo = async () => { calls++; };
        c.currentUserRole = 'aluno'; await c.confirmarEntradaNaTurma(); assert.equal(calls, 1);
        c.currentUserRole = 'professor';
        assert.match(extract(appSource, 'mostrarGate'), /codigoTurmaEntrada/);
    });
    // Exercise the unchanged student functions with the same simulated Firebase.
    for (const name of ['normalizarCodigoTurma', 'erroTurmaAluno', 'falhaAcessoTurmaAluno',
        'turmaValidaParaAluno', 'alunoEstaNaTurma', 'carregarContextoAluno',
        'buscarTurmaPorCodigo', 'persistirMatriculaAluno', 'entrarAlunoPorCodigo']) {
        vm.runInContext(extract(authSource, name), c);
    }
    c.auth.currentUser = { uid: 'student', email: 'student@example.com' };
    records['usuarios/student'] = { uid: 'student', role: 'aluno', nome: 'Student' };
    records['alunos/student@example,com'] = { uid: 'student', role: 'aluno' };
    records['turmas'] = { B: records['turmas/B'] };
    await test('student code remains mandatory', async () => {
        assert.equal((await c.entrarAlunoPorCodigo('')).success, false);
    });
    await test('valid student code persists UID enrollment and profile references', async () => {
        const r = await c.entrarAlunoPorCodigo('654321');
        assert.equal(r.success, true, r.error);
        const w = writes.at(-1);
        assert.equal(w['turmas/B/alunos/student/uid'], 'student');
        assert.equal(w['usuarios/student/turmaAtualId'], 'B');
    });
    await test('legacy alphanumeric code still enrolls student', async () => {
        records['turmas/B'].codigo = 'LEGADO-ABC';
        const r = await c.entrarAlunoPorCodigo(' legado-abc ');
        assert.equal(r.success, true, r.error);
    });
    await test('creation retains six-digit generator and selected professors', () => {
        assert.match(extract(authSource, 'criarTurma'), /gerarCodigoTurmaDisponivel\(\)/);
        assert.match(extract(authSource, 'criarTurma'), /professoresDaTurma\[professor.uid\]/);
        c.crypto = require('node:crypto').webcrypto;
        vm.runInContext(extract(authSource, 'gerarCodigoTurma'), c);
        for (let i = 0; i < 1000; i++) assert.match(c.gerarCodigoTurma(), /^\d{6}$/);
    });
    await test('real module readers resolve B paths after switching context', async () => {
        c.window.senaiTurmaAtualId = 'B'; storage.set('turmaAtualId', 'B');
        for (const [file, idFunction, readFunction, suffix] of [
            ['dashboard.js', 'obterTurmaAtualId', 'getCollection', 'materiais'],
            ['models/materiais.js', 'obterTurmaId', 'getMateriais', 'materiais'],
            ['models/moinho.js', 'obterTurmaId', 'getMoinho', 'moinho']
        ]) {
            const source = readFileSync(path.join(root, file), 'utf8');
            const actualReadFunction = file === 'dashboard.js'
                ? source.match(/async function (\w+)\(\s*collectionName/)[1] : readFunction;
            vm.runInContext(extract(source, idFunction), c);
            if (file === 'models/materiais.js') vm.runInContext(extract(source, 'obterCaminhoMateriais'), c);
            vm.runInContext(extract(source, actualReadFunction), c);
            c.isUsingLocalData = false; c.localData = { materiais: [], moinho: {} };
            const before = reads.length;
            await c[actualReadFunction](suffix);
            assert.equal(reads[before], `turmas/B/${suffix}`, file);
        }
    });
    console.log(`${count} checks passed (simulated Firebase/DOM; no live browser).`);
})().catch(error => { console.error(error); process.exitCode = 1; });
