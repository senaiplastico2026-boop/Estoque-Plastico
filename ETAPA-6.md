# Etapa 6 — auditoria e validação da implementação existente

Concluída em 20/09/2026. Nenhuma alteração funcional na aplicação foi necessária nesta retomada. A Etapa 7 não foi iniciada.

## Estado encontrado e evidência do script

1. **Já implementado:** um `<dialog>` compartilhado, função de abertura/fechamento, delegação de cliques, cabeçalho professor, cards de Minhas Turmas, Meu Perfil, perfil legado, CSS, backdrop, limpeza e restauração de foco. O valor usa o ID `modalCodigoTurmaValor` (equivalente ao nome `modalCodigoTurmaCodigo` solicitado).
2. **Incompleto:** não havia suíte nem relatório da Etapa 6. A implementação funcional já estava aplicada integralmente.
3. **Correções necessárias:** nenhuma no produto. Foram adicionados testes, este relatório e o diff específico. Não houve reaplicação do script no repositório.
4. **Arquivos:** a implementação já existente modificou `app.js`, `index.html`, `style.css`, `models/meuperfil.js` e `models/professor.js`. Esta retomada criou `tests/etapa6.cjs`, `tests/etapa6-static.cjs`, `ETAPA-6.md` e `ETAPA-6.patch`. Os cinco arquivos de produto foram preservados byte a byte.
5. **Script temporário:** localizado em `%TEMP%/implementar-etapa6.py`, fora do produto. Havia também `%TEMP%/projeto-plasticos-etapa6-base-20260919222807`. Executamos o script exclusivamente numa cópia temporária desse snapshot, redirecionando sua raiz. Todos os arquivos resultantes coincidiram byte a byte com o repositório atual. Isso comprova aplicação completa de seus efeitos; não existe log histórico para atribuir isoladamente a execução anterior ao processo Python. Não era apenas um script criado sem efeitos aplicados. Nenhuma referência da aplicação/testes ao script foi encontrada. Foi removido após a confirmação; não era dependência de execução nem de teste. SHA-256 antes da remoção: `2a451dc6054d452ade3ceb24f34505dee47c95a9d3c901a008bd101298e01b43`.
6. **API reutilizável:** `abrirModalCodigoTurma(codigo, nomeTurma = '', origem = document.activeElement)`. Converte código e nome com `String`, usa `textContent`, atualiza ambos em cada abertura e rejeita sessão ausente/perfil diferente de professor. Nome vazio remove o texto anterior e fica oculto. `012345`, `4321`, `ABC123` e texto contendo marcação foram testados.
7. **Locais clicáveis:** cabeçalho, código de cada card de Minhas Turmas, Meu Perfil e perfil legado do professor; todos usam `.codigo-turma-botao` e o mesmo diálogo.
8. **Locais preservados:** gate antigo, gate do aluno, entrada/matrícula, criação de turma, autorização, estrutura do banco e Rules. Não foram criados services nem centralização de estado.
9. **Cabeçalho:** recria o botão ao atualizar a turma e lê `currentTurma` no momento do clique. A → B foi testado com código e nome de B. Atualizar a interface fecha o diálogo anterior.
10. **Cards:** código usa `data-turma-id` escapado, encontra a turma em `turmasDisponiveis` e só apresenta os dados. O botão Entrar possui classe/listener próprio. O renderer real dos cards foi executado no teste: clicar no código B não chamou a entrada; clicar em Entrar B chamou a entrada separadamente.
11. **Meu Perfil:** template real exige `currentUserRole === 'professor'`, turma com ID e código disponível. Aluno recebe texto simples. Clique lê a turma atual e usa o diálogo comum.
12. **Perfil legado:** template real exige `userExtraInfo.role === 'professor'`, turma com ID e código disponível. O handler central também verifica o perfil atual. Testados os ramos professor e aluno. Os testes extraem o trecho real do template; não executam o carregamento completo dos perfis/Firebase.
13. **Fechamento:** X e backdrop têm handlers únicos. ESC usa o comportamento nativo de `<dialog>.showModal()`. Testados seis ciclos alternando X/backdrop/ESC, fechamento repetido e fechar/reabrir imediatamente antes do evento de fechamento anterior. Conteúdo novo permaneceu correto.
14. **Acessibilidade:** diálogo com `aria-modal`, título e descrição associados; X com `aria-label` e `autofocus`; foco explícito em X; abertura por Enter; contenção de foco por diálogo nativo; restauração à origem conectada; foco visível no CSS. Validado em Edge. Sem auditoria global de acessibilidade ou leitor de tela.
15. **Responsividade:** viewport 1280×900, 320×568 e 568×320, código normal e legado longo, nome longo. Diálogo centralizado horizontalmente e contido na viewport, sem overflow horizontal, código com fonte mínima de aproximadamente 36px. CSS usa `clamp`, quebra de texto, altura máxima e rolagem. Fundo escuro e código claro (`#141b23` / `#f1f5f9`), backdrop escuro coerente com a aplicação. Verificação automatizada de geometria/CSS, não inspeção visual manual.
16. **Listeners:** registrados fora de renderização/abertura. Instrumentação de `addEventListener` não detectou novos registros nos ciclos; evento `close` processado uma vez por ciclo. Listeners diretos dos botões Entrar pertencem aos novos nós de cada render, separados do compartilhamento. A busca estática encontrou uma única definição da API e um único registro de cada listener do componente.
17. **Código obsoleto:** cabeçalho/perfis consultam o contexto no clique, cards procuram por ID na lista atual; não capturam código em closure. Nome e código são sobrescritos ao abrir e limpos ao fechar. Evento `close` pendente não limpa diálogo já reaberto (`if (event.currentTarget.open) return`).
18. **Zero alteração de estado de negócio:** abertura/fechamento só modificam DOM, classe de rolagem e referência de foco. No clique do card B, snapshots de `currentTurma`, `turmaSelecionada`, `localStorage`, `userExtraInfo` e `window.senaiTurmaAtualId` permaneceram iguais. Spies de `definirTurmaAtual`, `abrirTurmaDoProfessor` e `entrarNaTurma` não foram chamados pelo código do card.
19. **Zero Firebase:** API e listeners não fazem consultas nem gravações; spies de `get`, `set`, `update`, `push`, `remove` permaneceram intactos. Nenhuma conexão ou gravação real Firebase foi feita nesta auditoria. Dados de código/nome são renderizados via `textContent`; templates usam `escapeHtml`/`escapeHTML`, incluindo atributos. Não foi introduzido `innerHTML` com esses dados sem escaping.
20. **Aluno preservado / Etapas 1–3:** `auth.js` e `firebaseConfig.js` coincidem byte a byte com o snapshot anterior à Etapa 6; nenhum trecho de gate/aluno foi alterado no diff de app/HTML. `entrarAlunoPorCodigo`, `buscarTurmaPorCodigo`, `persistirMatriculaAluno` e cadastro sem escolha de professor/turma permanecem intactos. Imports/importmap continuam em Firebase 12.18.0. Regressões simuladas confirmam entrada por código e persistência da matrícula.
21. **Entrada direta / Etapa 5:** regressão aprovada para professor vinculado, criador/adicional, troca A → B, negação sem vínculo, concorrência e erros. Compartilhamento não interfere no botão Entrar.
22. **Código automático / Etapa 4:** criação/geradores não foram alterados. Regressão executa 1.000 gerações e verifica seis dígitos; código legado alfanumérico continua aceito no fluxo simulado do aluno.

## Testes e resultados

23. **Comandos:**

```powershell
# Ferramentas instaladas fora do repositório; não são dependência do produto.
npm install --prefix "$env:TEMP/plastica-etapa6-tools" playwright html-validate --no-audit --no-fund
$env:NODE_PATH = "$env:TEMP/plastica-etapa6-tools/node_modules"
node tests/etapa5.cjs
node tests/etapa6.cjs
node --experimental-vm-modules tests/etapa6-static.cjs
node --check tests/etapa5.cjs
node --check tests/etapa6.cjs
node --check tests/etapa6-static.cjs
git diff --check
git diff --stat
```

O teste de navegador exige Edge instalado (`channel: 'msedge'`). O teste estático executa `node --check` nos 10 módulos JavaScript, valida scripts inline, liga imports/exports locais com o importmap e verifica arquivos locais referenciados pelo HTML. Exports remotos do SDK são sintetizados, sem validar a implementação remota. O aviso de VM experimental do Node é esperado.

24. **Resultados:** 17 grupos da Etapa 5 e 9 grupos da Etapa 6 aprovados. Verificações estáticas e HTML aprovadas (ordem de fechamento, conteúdo permitido, aspas e atributos/IDs duplicados). 101 IDs nas contagens por escopo, sem duplicação dentro do documento ativo ou de cada template. `btnEntrarTurma` e `btnVoltarLoginTurma` aparecem em ambos os templates legados; não são duplicação simultânea no documento. Os IDs novos do modal são únicos.
25. **Simulado versus real:** DOM, eventos de mouse/teclado, foco, diálogo nativo, ESC, CSS e geometria foram testados no navegador Edge real em headless. Sessão, turmas, carregamento, armazenamento inicial e Firebase são controlados pelo harness. O renderer de cards, API/listeners do modal, cabeçalho e trechos de templates dos perfis vêm do código atual. Não houve login real, navegação integral da aplicação, Firebase real ou validação de Rules. A suíte da Etapa 5 usa VM/DOM/Firebase simulados.

| Itens solicitados | Cobertura |
|---|---|
| 1–7 | Cabeçalho professor/aluno; abrir; código/nome; `012345`, `4321`, `ABC123` no Edge |
| 8–12 | Troca de conteúdo, X, backdrop, ESC, seis ciclos sem novos listeners |
| 13–15 | Cabeçalho A/B e card B enquanto A continua atual |
| 16–20 | Snapshot de todos os estados pedidos e spies de Firebase/entrada |
| 21 | Entrada direta do professor na suíte de regressão simulada |
| 22 | Entrada/matrícula do aluno por código na regressão simulada |
| 23 | Gerador real executado na VM; criação preservada |
| 24 | Geometria no Edge em três viewports, texto longo e código legado longo |

## Diff e preservação de arquivos

26. **`git diff --check`:** aprovado, código de saída 0, sem mensagens.
27. **Line endings:** os cinco arquivos de produto da Etapa 6 permanecem inteiramente CRLF, sem LF isolado. Não houve normalização. As milhares de linhas do diff geral já existiam antes desta retomada e incluem as Etapas 1–5; não representam mudanças desta auditoria. Documentação/testes novos usam LF.
28. **`git diff --stat` geral:**

```text
 app.js              | 2860 +++++++++++++++------------------------------------
 auth.js             | 1041 +++++++------------
 firebaseConfig.js   |    6 +-
 index.html          |  373 ++-----
 models/meuperfil.js |    8 +-
 models/professor.js |    8 +-
 style.css           |  111 +-
 7 files changed, 1435 insertions(+), 2972 deletions(-)
```

Esse comando não inclui arquivos novos não rastreados, incluindo os quatro artefatos desta retomada e os artefatos já existentes da Etapa 5.

29. **Diff específico:** `ETAPA-6.patch` compara os cinco arquivos atuais ao snapshot anterior à Etapa 6. Contém toda a implementação já aplicada, sem misturar as Etapas 1–5. Foram adicionadas 214 linhas e removidas 10: app +79/−3; HTML +15/−0; CSS +110/−1; Meu Perfil +5/−3; perfil legado +5/−3. A remoção de uma linha CSS representa a junção da antiga última linha sem newline ao bloco acrescentado. Testes/documentação desta retomada estão nos arquivos novos, fora do patch de produto, para manter a distinção entre implementação anterior e auditoria atual.

Nenhum commit, deploy, alteração de Rules ou trabalho da Etapa 7 foi realizado.
