Auditoria de ocorrencias - Etapa 5

Cada linha abaixo corresponde a uma ocorrencia restante em JS/HTML ou na suite. Linhas de export/import sao referencias, nao validacoes adicionais.

| Local | Trecho | Classificacao |
|---|---|---|
| `app.js:19` | `professorPertenceTurma,` | Politica compartilhada de vinculo/import/export |
| `app.js:80` | `let turmaSelecionada = null;` | Estado local, indicador ou markup legado; nao autoriza acesso |
| `app.js:190` | `localStorage.getItem('turmaAtualId') &#124;&#124;` | Estado/persistencia/leitura de contexto; nao comprova vinculo |
| `app.js:201` | `turmaSelecionada = null;` | Estado local, indicador ou markup legado; nao autoriza acesso |
| `app.js:204` | `localStorage.removeItem('turmaAtualId');` | Estado/persistencia/leitura de contexto; nao comprova vinculo |
| `app.js:218` | `turmaSelecionada = {` | Estado local, indicador ou markup legado; nao autoriza acesso |
| `app.js:228` | `'turmaAtualId',` | Estado/persistencia/leitura de contexto; nao comprova vinculo |
| `app.js:1130` | `turmasDisponiveis = todas.filter(turma => professorPertenceTurma(turma, currentUser));` | Politica compartilhada de vinculo/import/export |
| `app.js:1196` | `if (gate.dataset.perfil !== perfil &#124;&#124; !gate.querySelector('#btnEntrarTurma')) {` | Entrada de codigo do aluno ou seu listener delegado |
| `app.js:1228` | `turmaSelecionada = null;` | Estado local, indicador ou markup legado; nao autoriza acesso |
| `app.js:1230` | `const input = document.getElementById('codigoTurmaEntrada');` | Entrada de codigo do aluno ou seu listener delegado |
| `app.js:1248` | `function selecionarTurma(turma) {` | Compatibilidade da lista antiga: abertura direta validada |
| `app.js:1312` | `turmaSelecionada?.id &#124;&#124; ''` | Estado local, indicador ou markup legado; nao autoriza acesso |
| `app.js:1397` | `selecionarTurma(` | Compatibilidade da lista antiga: abertura direta validada |
| `app.js:1445` | `const button = document.getElementById('btnEntrarTurma');` | Entrada de codigo do aluno ou seu listener delegado |
| `app.js:1446` | `const input = document.getElementById('codigoTurmaEntrada');` | Entrada de codigo do aluno ou seu listener delegado |
| `app.js:1466` | `const input = document.getElementById('codigoTurmaEntrada');` | Entrada de codigo do aluno ou seu listener delegado |
| `app.js:1470` | `if (mensagem) mensagem.textContent = 'Digite o código fornecido pelo seu professor.';` | Entrada de codigo do aluno ou seu listener delegado |
| `app.js:1499` | `userExtraInfo.turmaAtualId = null;` | Estado/persistencia/leitura de contexto; nao comprova vinculo |
| `app.js:1549` | `async function confirmarEntradaNaTurma() {` | Dispatcher: aluno por codigo; professor por vinculo |
| `app.js:1552` | `if (currentUserRole === 'professor' && turmaSelecionada?.id) return abrirTurmaDoProfessor(turmaSelecionada.id);` | Estado local, indicador ou markup legado; nao autoriza acesso |
| `app.js:1562` | `'#btnEntrarTurma'` | Entrada de codigo do aluno ou seu listener delegado |
| `app.js:1567` | `confirmarEntradaNaTurma();` | Dispatcher: aluno por codigo; professor por vinculo |
| `app.js:1603` | `'turmaAtualId',` | Estado/persistencia/leitura de contexto; nao comprova vinculo |
| `app.js:2879` | `Object.assign(userExtraInfo, { turmaAtualId: null, turmaAtualNome: '', turmaAtualCodigo: '' });` | Estado/persistencia/leitura de contexto; nao comprova vinculo |
| `app.js:3147` | `turmaSelecionada =` | Estado local, indicador ou markup legado; nao autoriza acesso |
| `app.js:3164` | `'turmaAtualId'` | Estado/persistencia/leitura de contexto; nao comprova vinculo |
| `app.js:3572` | `turmaSelecionada =` | Estado local, indicador ou markup legado; nao autoriza acesso |
| `app.js:3637` | `turmaSelecionada =` | Estado local, indicador ou markup legado; nao autoriza acesso |
| `app.js:3654` | `'turmaAtualId'` | Estado/persistencia/leitura de contexto; nao comprova vinculo |
| `app.js:3973` | `turmaSelecionada =` | Estado local, indicador ou markup legado; nao autoriza acesso |
| `app.js:4074` | `userExtraInfo.turmaAtualId =` | Estado/persistencia/leitura de contexto; nao comprova vinculo |
| `app.js:4075` | `state.extraInfo.turmaAtualId &#124;&#124; null;` | Estado/persistencia/leitura de contexto; nao comprova vinculo |
| `app.js:4153` | `turmaSelecionada =` | Estado local, indicador ou markup legado; nao autoriza acesso |
| `app.js:4170` | `'turmaAtualId'` | Estado/persistencia/leitura de contexto; nao comprova vinculo |
| `auth.js:45` | `turmaAtualId: null,` | Estado/persistencia/leitura de contexto; nao comprova vinculo |
| `auth.js:200` | `turmaAtualId: null,` | Estado/persistencia/leitura de contexto; nao comprova vinculo |
| `auth.js:368` | `userExtraInfo.turmaAtualId &#124;&#124;` | Estado/persistencia/leitura de contexto; nao comprova vinculo |
| `auth.js:676` | `userExtraInfo.turmaAtualId &#124;&#124;` | Estado/persistencia/leitura de contexto; nao comprova vinculo |
| `auth.js:1121` | `turmaAtualId:` | Estado/persistencia/leitura de contexto; nao comprova vinculo |
| `auth.js:1564` | `'turmaAtualId'` | Estado/persistencia/leitura de contexto; nao comprova vinculo |
| `auth.js:2379` | `'turmaAtualId'` | Estado/persistencia/leitura de contexto; nao comprova vinculo |
| `auth.js:2666` | `alteracoes[`${perfil}/turmaAtualId`] = turmaId;` | Estado/persistencia/leitura de contexto; nao comprova vinculo |
| `auth.js:2707` | `return turmas.filter(turma => professorPertenceTurma(turma, professor));` | Politica compartilhada de vinculo/import/export |
| `auth.js:3243` | `throw erroTurmaAluno('codigo-vazio', 'Digite o código fornecido pelo seu professor.');` | Entrada de codigo do aluno ou seu listener delegado |
| `auth.js:3284` | `turmaAtualId: turmaId,` | Estado/persistencia/leitura de contexto; nao comprova vinculo |
| `auth.js:3287` | `turmaSelecionadaEm: Date.now()` | Estado local, indicador ou markup legado; nao autoriza acesso |
| `auth.js:3341` | `throw erroTurmaAluno('codigo-vazio', 'Digite o código fornecido pelo seu professor.');` | Entrada de codigo do aluno ou seu listener delegado |
| `auth.js:3360` | `usuario.turmaAtualId,` | Estado/persistencia/leitura de contexto; nao comprova vinculo |
| `auth.js:3361` | `legado.turmaAtualId,` | Estado/persistencia/leitura de contexto; nao comprova vinculo |
| `auth.js:3387` | `function professorPertenceTurma(turma, professor) {` | Politica compartilhada de vinculo/import/export |
| `auth.js:3420` | `if (!professorPertenceTurma(turma, user)) {` | Politica compartilhada de vinculo/import/export |
| `auth.js:3428` | `turmaAtualId: turma.id, turmaAtualNome: turma.nome &#124;&#124; '',` | Estado/persistencia/leitura de contexto; nao comprova vinculo |
| `auth.js:3429` | `turmaAtualCodigo: turma.codigo &#124;&#124; '', turmaSelecionadaEm: Date.now()` | Estado local, indicador ou markup legado; nao autoriza acesso |
| `auth.js:3444` | `for (const campo of ['turmaAtualId', 'turmaAtualNome', 'turmaAtualCodigo']) {` | Estado/persistencia/leitura de contexto; nao comprova vinculo |
| `auth.js:3459` | `async function entrarNaTurma(turmaId, codigoInformado, userUid, role) {` | API legada/export: preserva assinatura, separa perfis |
| `auth.js:3514` | `turmaAtualId:` | Estado/persistencia/leitura de contexto; nao comprova vinculo |
| `auth.js:3525` | `turmaSelecionadaEm:` | Estado local, indicador ou markup legado; nao autoriza acesso |
| `auth.js:3532` | `userExtraInfo.turmaAtualId =` | Estado/persistencia/leitura de contexto; nao comprova vinculo |
| `auth.js:3547` | `'turmaAtualId',` | Estado/persistencia/leitura de contexto; nao comprova vinculo |
| `auth.js:4240` | `entrarNaTurma,` | API legada/export: preserva assinatura, separa perfis |
| `auth.js:4242` | `professorPertenceTurma,` | Politica compartilhada de vinculo/import/export |
| `dashboard.js:47` | `localStorage.getItem('turmaAtualId') &#124;&#124;` | Estado/persistencia/leitura de contexto; nao comprova vinculo |
| `dashboard.js:48` | `userExtraInfo?.turmaAtualId &#124;&#124;` | Estado/persistencia/leitura de contexto; nao comprova vinculo |
| `index.html:332` | `<p>Digite o código fornecido pelo seu professor.</p>` | Entrada de codigo do aluno ou seu listener delegado |
| `index.html:336` | `<label for="codigoTurmaEntrada"><i class="fas fa-key"></i> Código da turma</label>` | Entrada de codigo do aluno ou seu listener delegado |
| `index.html:337` | `<input type="text" id="codigoTurmaEntrada"` | Entrada de codigo do aluno ou seu listener delegado |
| `index.html:338` | `placeholder="Digite o código da turma" autocomplete="off">` | Entrada de codigo do aluno ou seu listener delegado |
| `index.html:341` | `<button type="button" id="btnEntrarTurma" class="btn-turma-entrar">` | Entrada de codigo do aluno ou seu listener delegado |
| `index.html:454` | `id="turmaSelecionadaBox">` | Estado local, indicador ou markup legado; nao autoriza acesso |
| `index.html:469` | `id="turmaSelecionadaNome">` | Estado local, indicador ou markup legado; nao autoriza acesso |
| `index.html:477` | `id="turmaSelecionadaDetalhes">` | Estado local, indicador ou markup legado; nao autoriza acesso |
| `index.html:499` | `id="codigoTurmaVisual">` | Exibicao de codigo no template legado, sem digitacao |
| `index.html:522` | `id="btnEntrarTurma"` | Botao/template legado preservado, nao montado no fluxo atual |
| `models/aluno.js:68` | `userExtraInfo?.turmaAtualId &#124;&#124;` | Estado/persistencia/leitura de contexto; nao comprova vinculo |
| `models/materiais.js:59` | `localStorage.getItem('turmaAtualId') &#124;&#124;` | Estado/persistencia/leitura de contexto; nao comprova vinculo |
| `models/meuperfil.js:74` | `userExtraInfo?.turmaAtualId &#124;&#124;` | Estado/persistencia/leitura de contexto; nao comprova vinculo |
| `models/meuperfil.js:75` | `localStorage.getItem('turmaAtualId') &#124;&#124;` | Estado/persistencia/leitura de contexto; nao comprova vinculo |
| `models/moinho.js:45` | `localStorage.getItem('turmaAtualId') &#124;&#124;` | Estado/persistencia/leitura de contexto; nao comprova vinculo |
| `models/professor.js:72` | `userExtraInfo?.turmaAtualId &#124;&#124;` | Estado/persistencia/leitura de contexto; nao comprova vinculo |
| `models/professor.js:1235` | `userExtraInfo?.turmaAtualId &#124;&#124;` | Estado/persistencia/leitura de contexto; nao comprova vinculo |
| `tests/etapa5.cjs:25` | `currentTurma: null, turmaSelecionada: null, processandoEntradaProfessor: false,` | Teste/simulacao, sem caminho de producao |
| `tests/etapa5.cjs:53` | `renderDashboard: async () => rendered.push(['dashboard', storage.get('turmaAtualId')]),` | Teste/simulacao, sem caminho de producao |
| `tests/etapa5.cjs:54` | `renderMateriais: async () => rendered.push(['materiais', storage.get('turmaAtualId')]),` | Teste/simulacao, sem caminho de producao |
| `tests/etapa5.cjs:55` | `renderMoinho: async () => rendered.push(['moinho', storage.get('turmaAtualId')]),` | Teste/simulacao, sem caminho de producao |
| `tests/etapa5.cjs:56` | `renderHistorico: async () => rendered.push(['historico', storage.get('turmaAtualId')])` | Teste/simulacao, sem caminho de producao |
| `tests/etapa5.cjs:58` | `for (const name of ['professorPertenceTurma', 'acessarTurmaDoProfessor', 'entrarNaTurma', 'salvarTurmaAtual']) {` | Teste/simulacao, sem caminho de producao |
| `tests/etapa5.cjs:61` | `for (const name of ['definirTurmaAtual', 'abrirSistemaNaTurma', 'abrirTurmaDoProfessor', 'confirmarEntradaNaTurma']) {` | Teste/simulacao, sem caminho de producao |
| `tests/etapa5.cjs:80` | `assert.doesNotMatch(professor, /id="codigoTurmaEntrada"/);` | Teste/simulacao, sem caminho de producao |
| `tests/etapa5.cjs:86` | `assert.equal(writes[0]['usuarios/p1/turmaAtualId'], 'A');` | Teste/simulacao, sem caminho de producao |
| `tests/etapa5.cjs:87` | `assert.equal(writes[0]['professores/p1@example,com/turmaAtualId'], 'A');` | Teste/simulacao, sem caminho de producao |
| `tests/etapa5.cjs:90` | `assert.equal(c.professorPertenceTurma({ criadoPorUid: 'p1' }, c.currentUser), true);` | Teste/simulacao, sem caminho de producao |
| `tests/etapa5.cjs:91` | `assert.equal(c.professorPertenceTurma({ criadoPorUid: 'p2', professores: { p1: { uid: 'p1' } } }, c.currentUser), true);` | Teste/simulacao, sem caminho de producao |
| `tests/etapa5.cjs:99` | `]) assert.equal(c.professorPertenceTurma(turma, c.currentUser), false);` | Teste/simulacao, sem caminho de producao |
| `tests/etapa5.cjs:100` | `assert.equal(c.professorPertenceTurma({ professores: [{ email: 'P1@example.com' }] }, c.currentUser), true);` | Teste/simulacao, sem caminho de producao |
| `tests/etapa5.cjs:101` | `assert.equal(c.professorPertenceTurma({ criadoPorEmail: 'p1@example.com' }, c.currentUser), true);` | Teste/simulacao, sem caminho de producao |
| `tests/etapa5.cjs:105` | `const r = await c.entrarNaTurma('X', '123456', 'p1', 'professor');` | Teste/simulacao, sem caminho de producao |
| `tests/etapa5.cjs:112` | `assert.equal(c.currentTurma.id, 'B'); assert.equal(c.turmaSelecionada.id, 'B');` | Teste/simulacao, sem caminho de producao |
| `tests/etapa5.cjs:113` | `assert.equal(c.window.senaiTurmaAtualId, 'B'); assert.equal(c.userExtraInfo.turmaAtualId, 'B');` | Teste/simulacao, sem caminho de producao |
| `tests/etapa5.cjs:114` | `assert.equal(storage.get('turmaAtualId'), 'B'); assert.equal(JSON.parse(storage.get('turmaAtual')).id, 'B');` | Teste/simulacao, sem caminho de producao |
| `tests/etapa5.cjs:145` | `const before = storage.get('turmaAtualId');` | Teste/simulacao, sem caminho de producao |
| `tests/etapa5.cjs:148` | `assert.equal(storage.get('turmaAtualId'), before);` | Teste/simulacao, sem caminho de producao |
| `tests/etapa5.cjs:153` | `assert.equal((await c.entrarNaTurma('B', '', 'p2', 'professor')).success, false);` | Teste/simulacao, sem caminho de producao |
| `tests/etapa5.cjs:157` | `c.currentUserRole = 'aluno'; await c.confirmarEntradaNaTurma(); assert.equal(calls, 1);` | Teste/simulacao, sem caminho de producao |
| `tests/etapa5.cjs:159` | `assert.match(extract(appSource, 'mostrarGate'), /codigoTurmaEntrada/);` | Teste/simulacao, sem caminho de producao |
| `tests/etapa5.cjs:179` | `assert.equal(w['usuarios/student/turmaAtualId'], 'B');` | Teste/simulacao, sem caminho de producao |
| `tests/etapa5.cjs:194` | `c.window.senaiTurmaAtualId = 'B'; storage.set('turmaAtualId', 'B');` | Teste/simulacao, sem caminho de producao |
