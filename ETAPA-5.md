Relatório da Etapa 5
===================

Implementação limitada à entrada e troca de turma do professor. A Etapa 6 não foi iniciada.

1. **Arquivos:** alterados nesta etapa `app.js`, `auth.js` e `index.html`; adicionados `tests/etapa5.cjs`, este relatório e os artefatos de auditoria/diff. Já havia alterações em `app.js`, `auth.js`, `firebaseConfig.js` e `index.html` antes do trabalho. `firebaseConfig.js` não foi editado nesta etapa.
2. **Funções modificadas:** `garantirTurmaGate`, `mostrarGate`, `selecionarTurma`, `confirmarEntradaNaTurma`, `renderTurmasPagina`, `prepararPosLogin`, `window.showTab`, `listarTurmasDoProfessor`, `entrarNaTurma`, `salvarTurmaAtual` e `professorPertenceTurma`. Também foram ajustados os callbacks de criação e de autenticação em `app.js`.
3. **Funções novas:** `abrirTurmaDoProfessor` na interface e `acessarTurmaDoProfessor` em auth. A política `professorPertenceTurma` foi movida de app para auth, exportada e compartilhada pela listagem e pela entrada.
4. **Funções removidas:** nenhuma API foi removida. Foram substituídos o corpo antigo da política de vínculo, o ramo de confirmação de código do professor e a restauração do objeto do cache. O corpo inacessível do gate do professor foi retirado de `mostrarGate`; as funções de compatibilidade e o template legado permanecem.
5. **Fluxo antigo:** cartão Entrar → `mostrarGate('professor')` → `selecionarTurma` → digitação → `confirmarEntradaNaTurma` compara o código do objeto carregado → `definirTurmaAtual` → `abrirSistemaNaTurma`. Esse caminho não persistia a seleção nos dois perfis. Separadamente, a API legada `entrarNaTurma` também exigia código de professor.
6. **Fluxo novo:** Minhas Turmas → Entrar → `abrirTurmaDoProfessor(id)` → `acessarTurmaDoProfessor(id)` → leitura atual no Firebase → validação → persistência multipath → sincronização local → renderização dos módulos → dashboard. Sem campo de código, confirmação ou tela intermediária. Chamadas legadas a `selecionarTurma` e `entrarNaTurma` também usam a entrada validada.
7. **Vínculo:** consultado em `turmas/{id}/professores` e nos campos do criador, depois de verificar sessão e role professor. O objeto do cartão fornece somente o ID; o conteúdo autorizado vem de uma nova consulta. Turma inexistente, inativa ou sem vínculo não abre.
8. **UID:** `turmas/{id}/professores/{uid}` aceita objeto sem UID conflitante ou marcador booleano `true`; registros com `item.uid` e `criadoPorUid` também são comparados ao UID autenticado. UID conflitante não é substituído por e-mail no mesmo registro.
9. **Fallbacks:** objetos legados, inclusive arrays, aceitam UID; sem UID no registro, aceitam e-mail exato após trim/lowercase. O criador pode usar `criadoPorEmail` somente sem `criadoPorUid`. Nome isolado, strings contendo nome e conhecimento de código não autorizam. Não houve migração nem gravação de novos vínculos. Referências `usuarios/{uid}/turmasVinculadas` e `professores/{emailSanitizado}/turmasVinculadas` continuam existindo, mas não bastam para autorizar a abertura.
10. **Criador:** entra pelo vínculo canônico ou pelo UID do criador. Depois da criação, o callback revalida a turma recém-gravada e sincroniza a seleção nos dois perfis, permanecendo em Minhas Turmas. A criação em si não foi modificada. Se a seleção posterior falhar, a mensagem informa que a turma já foi criada.
11. **Professor adicional:** o UID incluído por outro professor em `turmas/{id}/professores/{uid}` é suficiente para listar e abrir diretamente. Não precisa do código.
12. **Sem vínculo:** recebe “Você não possui acesso a esta turma.” Saber ID/código não altera a decisão. Erros de consulta, permissão, inatividade e persistência possuem mensagens próprias; detalhes técnicos vão ao console.
13. **Persistência:** um `update(ref(db), alteracoes)` grava `turmaAtualId`, `turmaAtualNome`, `turmaAtualCodigo` e `turmaSelecionadaEm` em `usuarios/{uid}` e `professores/{emailSanitizado}`. Mantida a estrutura legada que o login ainda consome; nenhuma coleção nova.
14. **currentTurma:** `definirTurmaAtual(resultado.turma)` só é executada após sucesso da validação e gravação. `turmaSelecionada` recebe o mesmo conteúdo.
15. **userExtraInfo:** recebe os campos da seleção somente depois do update e da conferência de que a sessão continua a mesma.
16. **localStorage:** sincronizados `turmaAtual` (objeto), `turmaAtualId`, `turmaAtualNome` e `turmaAtualCodigo`, após a persistência.
17. **window.senaiTurmaAtualId:** recebe o ID validado, também após persistência; mantido por compatibilidade.
18. **Troca A → B:** executa a mesma entrada validada. Limpa os conteúdos anteriores de dashboard, materiais, moinho, histórico e perfil antes de chamar os renderizadores existentes. Cabeçalho é atualizado; perfil renderiza novamente quando aberto. Navegação fica bloqueada durante a abertura. Uma trava compartilhada e botões desabilitados impedem duas entradas simultâneas; cada cartão tem apenas seu listener direto.
19. **Reload/login:** continua levando o professor a Minhas Turmas. A seleção local antiga é descartada, inclusive em userExtraInfo, e não é restaurada como autorização. O professor escolhe novamente e a turma é revalidada. As referências persistentes no banco permanecem; não foi adicionado redirecionamento automático. Isso retira também o indicador de seleção antiga até o novo clique.
20. **Aluno:** continua vendo exclusivamente o gate de código quando não tem matrícula restaurável. O guard do professor impede a criação/exibição do gate para esse perfil.
21. **Etapa 3:** `confirmarEntradaAlunoPorCodigo`, `abrirTurmaDoAluno`, `prepararTurmaDoAluno`, `normalizarCodigoTurma`, `buscarTurmaPorCodigo`, `entrarAlunoPorCodigo`, `persistirMatriculaAluno` e `restaurarTurmaDoAluno` foram comparadas ao snapshot anterior à Etapa 5 e permanecem idênticas. O ramo aluno da API legada conserva a mesma lógica.
22. **Etapa 4:** `criarTurma`, `gerarCodigoTurma` e `gerarCodigoTurmaDisponivel` permanecem idênticas ao snapshot. O código segue salvo e exibido, com geração automática de seis dígitos. O template legado do professor perdeu somente o campo de digitação.
23. **Verificações executadas:** `node tests/etapa5.cjs` (17 grupos aprovados); `node --check` em todos os JavaScript e no teste; linkagem do grafo de 13 módulos com `vm.SourceTextModule` (exports Firebase simulados); `git diff --check`; busca das expressões pedidas e inspeção dos consumidores/imports. As assinaturas públicas foram preservadas; os novos exports resolvem corretamente.
24. **Testes simulados:** veja a matriz abaixo. Nenhum teste foi executado contra Firebase real. Os testes extraem funções atuais dos arquivos para execução em VM, com banco, DOM e armazenamento simulados. Os leitores reais de dashboard, materiais e moinho foram executados para comprovar os caminhos de B; renderização visual completa não foi testada em navegador.
25. **Limitações:** não houve login real, teste visual nem validação das permissões efetivas das Rules. As Rules e o SDK não foram alterados; verificações no cliente não substituem autorização no servidor. Os fallbacks offline internos dos módulos existentes continuam fora desta etapa; a validação de troca exige conexão, mas a suíte não cobre operações offline iniciadas nesses módulos. Turmas legadas vinculadas apenas por nome deixam de autorizar entrada. Auditoria detalhada de ocorrências está em `ETAPA-5-ocorrencias.md`.
26. **git diff --stat atual:** registrado abaixo, incluindo as modificações anteriores; arquivos novos ainda não rastreados não entram nesse comando.
27. **Diff específico:** `ETAPA-5.patch`, comparado ao conteúdo existente no início desta tarefa, contém somente as alterações de implementação desta etapa e a suíte nova. Documentação e o próprio patch não entram no patch para evitar autorreferência.

Matriz dos testes solicitados
---------------------------

| Testes | Evidência | Tipo |
|---|---|---|
| 1 | Preparação termina em Minhas Turmas e limpa contexto antigo | Inspeção/assert de código |
| 2 | Cartão chama abertura direta; template professor sem input de código | Inspeção/assert de HTML e código |
| 3–5 | Abertura por UID, criador e professor adicional | Firebase simulado |
| 6–7 | Sem vínculo não abre, mesmo usando código correto | Firebase simulado |
| 8–12 | Troca A → B e conferência de todas as fontes de estado | Firebase/DOM/storage simulados |
| 13–15 | Renderizadores chamados com B; leitores reais consultam caminhos de B | Módulos com Firebase simulado |
| 16 | Cache não é restaurado no login; vínculo removido falha na nova consulta | Inspeção + Firebase simulado |
| 17 | Duas chamadas enquanto update está pendente resultam em uma leitura/escrita | Concorrência simulada |
| 18 | Erros de leitura, permissão e gravação recebem mensagens distintas | Firebase simulado |
| 19 | Template aluno preservado; confirmação delega ao código | Inspeção + fluxo simulado |
| 20 | Código válido grava matrícula por UID e referências dos perfis | Firebase simulado, funções reais |
| 21 | 1.000 chamadas do gerador produzem seis dígitos; criação inalterada | Gerador real + comparação de código |
| 22 | Código alfanumérico legado com espaços/minúsculas matricula | Firebase simulado, funções reais |

Não foram removidos IDs usados pelo aluno. As ocorrências restantes de código são entrada/matrícula do aluno, geração, persistência ou exibição/filtro; nenhuma compara código para conceder acesso ao professor. A lista/gate legado conserva handlers de compatibilidade, sem campo de código do professor e sem ser montado no fluxo atual; nenhum handler novo foi ligado ao template inativo.

Estatistica atual do working tree
--------------------------------

```text
 app.js            | 2792 +++++++++++++++--------------------------------------
 auth.js           | 1041 ++++++++------------
 firebaseConfig.js |    6 +-
 index.html        |  358 ++-----
 4 files changed, 1228 insertions(+), 2969 deletions(-)
```

Arquivos novos: `tests/etapa5.cjs`, `ETAPA-5.md`, `ETAPA-5-ocorrencias.md` e `ETAPA-5.patch`.
