// ============================================================
// APP.JS - SENAI PLÁSTICOS
// ============================================================

import {
    loginProfessor,
    loginAluno,
    cadastrarAluno,
    cadastrarProfessor,
    redefinirSenha,
    logoutUser,
    excluirMinhaConta,
    removerTurma,
    onAuthStateChange,
    listarProfessores,
    userExtraInfo,
    isOnline
} from './auth.js';

import { db } from './firebaseConfig.js';

import {
    ref,
    get,
    push,
    set,
    update
} from 'firebase/database';

import {
    renderDashboard,
    setUserData as setDashboardData
} from './dashboard.js';

import {
    renderProfessor,
    setUserData as setProfessorData
} from './models/professor.js';

import {
    renderAluno,
    setUserData as setAlunoData
} from './models/aluno.js';

import {
    renderMateriais,
    setUserData as setMateriaisData
} from './models/materiais.js';

import {
    renderMoinho,
    setUserData as setMoinhoData
} from './models/moinho.js';

import {
    renderHistorico,
    setUserData as setHistoricoData
} from './models/historico.js';

import {
    renderMeuPerfil,
    setUserData as setMeuPerfilData
} from './models/meuperfil.js';

// ============================================================
// ESTADO
// ============================================================

let currentUser = null;
let currentUserRole = null;
let isUsingLocalData = false;

let loginIniciadoManualmente = false;
let ultimaSessaoPreparada = null;

let currentTurma = null;
let turmaSelecionada = null;
let turmasDisponiveis = [];

// ============================================================
// ELEMENTOS
// ============================================================

const loginContainer =
    document.getElementById('loginContainer');

const appContainer =
    document.getElementById('appContainer');

const turmaGateHTML =
    document.getElementById('turmaGate');

const loginProfBtn =
    document.getElementById('doLoginProfBtn');

const loginAlunoBtn =
    document.getElementById('doLoginAlunoBtn');

const logoutBtn =
    document.getElementById('logoutBtnGlobal');

const sidebar =
    document.getElementById('sidebar');

const sidebarOverlay =
    document.getElementById('sidebarOverlay');

const mobileMenuBtn =
    document.getElementById('mobileMenuBtn');

const sidebarUserName =
    document.getElementById('sidebarUserName');

const sidebarUserRole =
    document.getElementById('sidebarUserRole');

const editModal =
    document.getElementById('editModal');

const removeModal =
    document.getElementById('removeModal');

const cadastrarProfModal =
    document.getElementById('cadastrarProfModal');

const cadastrarAlunoModal =
    document.getElementById('cadastrarAlunoModal');

const esqueciSenhaModal =
    document.getElementById('esqueciSenhaModal');

const gerenciarAlunosModal =
    document.getElementById('gerenciarAlunosModal');

const gerenciarProfessoresModal =
    document.getElementById('gerenciarProfessoresModal');

const criarTurmaModal =
    document.getElementById('criarTurmaModal');

// ============================================================
// UTILITÁRIOS
// ============================================================

function normalizarTexto(valor) {
    return String(valor ?? '')
        .trim()
        .toLowerCase();
}

function escapeHtml(valor) {
    return String(valor ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function obterNomeUsuario() {
    return (
        userExtraInfo?.nome ||
        currentUser?.email?.split('@')[0] ||
        'Usuário'
    );
}

// ============================================================
// TURMA ATUAL
// ============================================================

function obterTurmaAtualId() {
    return (
        currentTurma?.id ||
        localStorage.getItem('turmaAtualId') ||
        null
    );
}

function definirTurmaAtual(turma) {

    if (!turma?.id) {

        currentTurma = null;
        turmaSelecionada = null;

        localStorage.removeItem('turmaAtual');
        localStorage.removeItem('turmaAtualId');
        localStorage.removeItem('turmaAtualNome');
        localStorage.removeItem('turmaAtualCodigo');

        window.senaiTurmaAtualId = null;

        return null;
    }

    currentTurma = {
        ...turma
    };

    turmaSelecionada = {
        ...turma
    };

    localStorage.setItem(
        'turmaAtual',
        JSON.stringify(currentTurma)
    );

    localStorage.setItem(
        'turmaAtualId',
        String(turma.id)
    );

    localStorage.setItem(
        'turmaAtualNome',
        turma.nome || ''
    );

    localStorage.setItem(
        'turmaAtualCodigo',
        turma.codigo || ''
    );

    window.senaiTurmaAtualId =
        String(turma.id);

    return currentTurma;
}

window.obterTurmaAtualId =
    obterTurmaAtualId;

// ============================================================
// TELAS
// ============================================================

function mostrarSomenteLogin() {

    if (loginContainer) {
        loginContainer.style.display = 'flex';
    }

    if (appContainer) {
        appContainer.style.display = 'none';
    }

    const gate =
        document.getElementById('turmaGate');

    if (gate) {
        gate.style.display = 'none';
    }

    fecharTodosModais();
    closeSidebar();
}

function mostrarApp() {

    if (loginContainer) {
        loginContainer.style.display = 'none';
    }

    const gate =
        document.getElementById('turmaGate');

    if (gate) {
        gate.style.display = 'none';
    }

    if (appContainer) {
        appContainer.style.display = 'block';
    }
}

function showConnectionStatus() {

    let status =
        document.getElementById('connectionStatus');

    if (!status) {

        status =
            document.createElement('div');

        status.id =
            'connectionStatus';

        status.style.cssText = `
            position: fixed;
            right: 20px;
            bottom: 20px;
            z-index: 9999;
            padding: 8px 15px;
            border-radius: 20px;
            color: #fff;
            font-size: 11px;
            font-weight: 600;
            box-shadow: 0 5px 18px rgba(0,0,0,.25);
        `;

        document.body.appendChild(status);
    }

    status.style.background =
        isOnline
            ? '#10b981'
            : '#ef4444';

    status.textContent =
        isOnline
            ? '🟢 Online'
            : '🔴 Offline';
}

// ============================================================
// ABAS DE LOGIN
// ============================================================

document
    .querySelectorAll('.login-tab')
    .forEach(tab => {

        tab.addEventListener(
            'click',
            function () {

                document
                    .querySelectorAll('.login-tab')
                    .forEach(item => {
                        item.classList.remove('active');
                    });

                this.classList.add('active');

                const target =
                    this.dataset.tab;

                document
                    .querySelectorAll('.login-form')
                    .forEach(form => {
                        form.classList.remove('active');
                    });

                const form =
                    document.getElementById(
                        `login${
                            target.charAt(0).toUpperCase()
                        }${target.slice(1)}`
                    );

                if (form) {
                    form.classList.add('active');
                }
            }
        );
    });

// ============================================================
// PROFESSORES - CHECKLIST DO ALUNO
// ============================================================

async function carregarProfessoresChecklist() {

    const container =
        document.getElementById(
            'professoresCheckboxes'
        );

    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="checkbox-loading">
            <i class="fas fa-spinner fa-spin"></i>
            Carregando professores...
        </div>
    `;

    try {

        const professores =
            await listarProfessores();

        if (!professores?.length) {

            container.innerHTML = `
                <div class="checkbox-loading">
                    <i class="fas fa-user-slash"></i>
                    Nenhum professor cadastrado.
                </div>
            `;

            return;
        }

        container.innerHTML =
            professores.map(prof => {

                const nome =
                    prof.nome ||
                    prof.email?.split('@')[0] ||
                    'Professor';

                const uid =
                    prof.uid ||
                    prof.id ||
                    '';

                const email =
                    prof.email ||
                    '';

                return `
                    <label class="checkbox-item">

                        <input
                            type="checkbox"
                            value="${escapeHtml(nome)}"
                            data-uid="${escapeHtml(uid)}"
                            data-nome="${escapeHtml(nome)}"
                            data-email="${escapeHtml(email)}">

                        <span>
                            <strong>
                                ${escapeHtml(nome)}
                            </strong>

                            ${
                                email
                                    ? `
                                        <small>
                                            ${escapeHtml(email)}
                                        </small>
                                      `
                                    : ''
                            }
                        </span>

                    </label>
                `;
            }).join('');

    } catch (error) {

        console.error(
            'Erro ao carregar professores:',
            error
        );

        container.innerHTML = `
            <div class="checkbox-loading">
                <i class="fas fa-circle-exclamation"></i>
                Não foi possível carregar os professores.
            </div>
        `;
    }
}

// ============================================================
// PROFESSORES - CHECKLIST DA TURMA
// ============================================================

async function carregarProfessoresParaTurma() {

    const container =
        document.getElementById(
            'turmaProfessoresCheckboxes'
        );

    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="checkbox-loading">
            <i class="fas fa-spinner fa-spin"></i>
            Carregando professores...
        </div>
    `;

    try {

        const professores =
            await listarProfessores();

        if (!professores?.length) {

            container.innerHTML = `
                <div class="checkbox-loading">
                    <i class="fas fa-user-slash"></i>
                    Nenhum professor cadastrado.
                </div>
            `;

            return;
        }

        container.innerHTML =
            professores.map(professor => {

                const uid =
                    professor.uid ||
                    professor.id ||
                    '';

                const nome =
                    professor.nome ||
                    professor.email?.split('@')[0] ||
                    'Professor';

                const email =
                    professor.email ||
                    '';

                const selecionado =
                    currentUser?.uid &&
                    uid === currentUser.uid
                        ? 'checked'
                        : '';

                return `
                    <label
                        class="checkbox-item turma-professor-item">

                        <input
                            type="checkbox"
                            class="turma-professor-check"
                            value="${escapeHtml(nome)}"
                            data-uid="${escapeHtml(uid)}"
                            data-nome="${escapeHtml(nome)}"
                            data-email="${escapeHtml(email)}"
                            ${selecionado}>

                        <span>

                            <strong>
                                ${escapeHtml(nome)}
                            </strong>

                            ${
                                email
                                    ? `
                                        <small>
                                            ${escapeHtml(email)}
                                        </small>
                                      `
                                    : ''
                            }

                        </span>

                    </label>
                `;
            }).join('');

    } catch (error) {

        console.error(
            'Erro ao carregar professores da turma:',
            error
        );

        container.innerHTML = `
            <div class="checkbox-loading">
                <i class="fas fa-circle-exclamation"></i>
                Erro ao carregar professores.
            </div>
        `;
    }
}

// ============================================================
// CADASTRO DE PROFESSOR
// ============================================================

document
    .getElementById('btnAbrirCadastroProf')
    ?.addEventListener(
        'click',
        () => {

            if (cadastrarProfModal) {
                cadastrarProfModal.style.display = 'block';
            }
        }
    );

document
    .querySelector('.close-cadastrar-prof')
    ?.addEventListener(
        'click',
        () => {

            if (cadastrarProfModal) {
                cadastrarProfModal.style.display = 'none';
            }
        }
    );

document
    .getElementById('btnCadastrarNovoProf')
    ?.addEventListener(
        'click',
        async () => {

            const email =
                document
                    .getElementById('novoProfEmail')
                    ?.value
                    .trim();

            const senha =
                document
                    .getElementById('novoProfSenha')
                    ?.value
                    .trim();

            const btn =
                document.getElementById(
                    'btnCadastrarNovoProf'
                );

            if (!email || !senha) {
                alert('⚠️ Preencha email e senha!');
                return;
            }

            if (senha.length < 6) {
                alert(
                    '⚠️ A senha deve ter pelo menos 6 caracteres!'
                );
                return;
            }

            try {

                if (btn) {
                    btn.disabled = true;
                    btn.innerHTML =
                        '<i class="fas fa-spinner fa-spin"></i> Cadastrando...';
                }

                const result =
                    await cadastrarProfessor(
                        email,
                        senha
                    );

                if (!result?.success) {

                    alert(
                        '❌ ' +
                        (
                            result?.error ||
                            'Erro ao cadastrar professor.'
                        )
                    );

                    return;
                }

                alert(
                    `✅ Professor cadastrado com sucesso!\n\nEmail: ${email}`
                );

                if (cadastrarProfModal) {
                    cadastrarProfModal.style.display = 'none';
                }

                const novoEmail =
                    document.getElementById('novoProfEmail');

                const novaSenha =
                    document.getElementById('novoProfSenha');

                const loginEmail =
                    document.getElementById('loginProfEmail');

                if (novoEmail) {
                    novoEmail.value = '';
                }

                if (novaSenha) {
                    novaSenha.value = '';
                }

                if (loginEmail) {
                    loginEmail.value = email;
                }

            } catch (error) {

                console.error(
                    'Erro cadastro professor:',
                    error
                );

                alert(
                    '❌ Erro ao cadastrar professor:\n' +
                    error.message
                );

            } finally {

                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML =
                        '<i class="fas fa-user-plus"></i> Cadastrar';
                }
            }
        }
    );

// ============================================================
// CADASTRO DE ALUNO
// ============================================================

document
    .getElementById('btnAbrirCadastroAluno')
    ?.addEventListener(
        'click',
        async () => {

            if (cadastrarAlunoModal) {
                cadastrarAlunoModal.style.display = 'block';
            }

            await carregarProfessoresChecklist();
        }
    );

document
    .querySelector('.close-cadastrar-aluno')
    ?.addEventListener(
        'click',
        () => {

            if (cadastrarAlunoModal) {
                cadastrarAlunoModal.style.display = 'none';
            }
        }
    );

document
    .getElementById('btnCadastrarNovoAluno')
    ?.addEventListener(
        'click',
        async () => {

            const email =
                document
                    .getElementById('novoAlunoEmail')
                    ?.value
                    .trim();

            const senha =
                document
                    .getElementById('novoAlunoSenha')
                    ?.value
                    .trim();

            const turno =
                document
                    .getElementById('novoAlunoTurno')
                    ?.value ||
                'Manhã';

            const selecionados =
                Array.from(
                    document.querySelectorAll(
                        '#professoresCheckboxes input[type="checkbox"]:checked'
                    )
                );

            const professores =
                selecionados.map(input => ({
                    uid:
                        input.dataset.uid || '',
                    nome:
                        input.dataset.nome ||
                        input.value ||
                        'Professor',
                    email:
                        input.dataset.email ||
                        ''
                }));

            const btn =
                document.getElementById(
                    'btnCadastrarNovoAluno'
                );

            if (!email || !senha) {
                alert('⚠️ Preencha email e senha!');
                return;
            }

            if (senha.length < 6) {
                alert(
                    '⚠️ A senha deve ter pelo menos 6 caracteres!'
                );
                return;
            }

            if (!professores.length) {
                alert(
                    '⚠️ Selecione pelo menos um professor!'
                );
                return;
            }

            try {

                if (btn) {
                    btn.disabled = true;
                    btn.innerHTML =
                        '<i class="fas fa-spinner fa-spin"></i> Cadastrando...';
                }

                const result =
                    await cadastrarAluno(
                        email,
                        senha,
                        turno,
                        professores
                    );

                if (!result?.success) {

                    alert(
                        '❌ ' +
                        (
                            result?.error ||
                            'Erro ao cadastrar aluno.'
                        )
                    );

                    return;
                }

                alert(
                    `✅ Aluno "${email}" cadastrado com sucesso!`
                );

                if (cadastrarAlunoModal) {
                    cadastrarAlunoModal.style.display = 'none';
                }

                const novoEmail =
                    document.getElementById('novoAlunoEmail');

                const novaSenha =
                    document.getElementById('novoAlunoSenha');

                const loginEmail =
                    document.getElementById('loginAlunoEmail');

                if (novoEmail) {
                    novoEmail.value = '';
                }

                if (novaSenha) {
                    novaSenha.value = '';
                }

                if (loginEmail) {
                    loginEmail.value = email;
                }

            } catch (error) {

                console.error(
                    'Erro cadastro aluno:',
                    error
                );

                alert(
                    '❌ Erro cadastro aluno:\n' +
                    error.message
                );

            } finally {

                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML =
                        '<i class="fas fa-user-plus"></i> Cadastrar';
                }
            }
        }
    );

// ============================================================
// REDEFINIÇÃO DE SENHA
// ============================================================

function abrirResetSenha() {

    if (esqueciSenhaModal) {
        esqueciSenhaModal.style.display = 'block';
    }
}

document
    .getElementById('esqueciSenhaProfBtn')
    ?.addEventListener(
        'click',
        abrirResetSenha
    );

document
    .getElementById('esqueciSenhaAlunoBtn')
    ?.addEventListener(
        'click',
        abrirResetSenha
    );

document
    .querySelector('.close-esqueci-senha')
    ?.addEventListener(
        'click',
        () => {

            if (esqueciSenhaModal) {
                esqueciSenhaModal.style.display = 'none';
            }
        }
    );

document
    .getElementById('btnResetarSenha')
    ?.addEventListener(
        'click',
        async () => {

            const email =
                document
                    .getElementById('resetEmailInput')
                    ?.value
                    .trim();

            const novaSenha =
                document
                    .getElementById('resetNovaSenha')
                    ?.value
                    .trim();

            const confirmarSenha =
                document
                    .getElementById('resetConfirmarSenha')
                    ?.value
                    .trim();

            const btn =
                document.getElementById(
                    'btnResetarSenha'
                );

            if (
                !email ||
                !novaSenha ||
                !confirmarSenha
            ) {
                alert('⚠️ Preencha todos os campos!');
                return;
            }

            if (novaSenha.length < 6) {
                alert(
                    '⚠️ A nova senha deve ter pelo menos 6 caracteres!'
                );
                return;
            }

            if (novaSenha !== confirmarSenha) {
                alert(
                    '❌ As senhas não são iguais!'
                );
                return;
            }

            try {

                if (btn) {
                    btn.disabled = true;
                    btn.innerHTML =
                        '<i class="fas fa-spinner fa-spin"></i> Redefinindo...';
                }

                const result =
                    await redefinirSenha(
                        email,
                        novaSenha,
                        confirmarSenha
                    );

                alert(
                    result?.message ||
                    result?.error ||
                    'Operação concluída.'
                );

                if (
                    result?.success &&
                    esqueciSenhaModal
                ) {
                    esqueciSenhaModal.style.display = 'none';
                }

            } catch (error) {

                console.error(
                    'Erro redefinir senha:',
                    error
                );

                alert(
                    '❌ Erro ao redefinir senha:\n' +
                    error.message
                );

            } finally {

                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML =
                        '<i class="fas fa-key"></i> Redefinir';
                }
            }
        }
    );

// ============================================================
// BUSCAR TODAS AS TURMAS
// ============================================================

async function buscarTodasTurmas() {

    if (
        !isOnline ||
        isUsingLocalData
    ) {
        return [];
    }

    try {

        const snapshot =
            await get(
                ref(
                    db,
                    'turmas'
                )
            );

        if (!snapshot.exists()) {
            return [];
        }

        const data =
            snapshot.val();

        return Object.entries(data).map(
            ([id, turma]) => ({
                id,
                ...turma
            })
        );

    } catch (error) {

        console.error(
            'Erro buscando turmas:',
            error
        );

        return [];
    }
}

// ============================================================
// PROFESSORES DA TURMA
// ============================================================

function obterProfessoresTurma(turma) {

    if (!turma) {
        return [];
    }

    if (Array.isArray(turma.professores)) {
        return [...turma.professores];
    }

    if (
        turma.professores &&
        typeof turma.professores === 'object'
    ) {
        return Object.values(
            turma.professores
        );
    }

    return [];
}

// ============================================================
// PROFESSOR PERTENCE À TURMA
// ============================================================

function professorPertenceTurma(
    turma,
    professor
) {

    if (!turma || !professor) {
        return false;
    }

    const nomeProfessor =
        normalizarTexto(
            userExtraInfo?.nome
        );

    const emailProfessor =
        normalizarTexto(
            professor.email
        );

    const uidProfessor =
        String(
            professor.uid || ''
        );

    const vinculada =
        obterProfessoresTurma(turma)
            .some(item => {

                if (typeof item === 'string') {

                    return (
                        normalizarTexto(item) ===
                        nomeProfessor
                    );
                }

                return Boolean(
                    (
                        item?.uid &&
                        String(item.uid) ===
                        uidProfessor
                    ) ||

                    (
                        item?.email &&
                        normalizarTexto(item.email) ===
                        emailProfessor
                    ) ||

                    (
                        item?.nome &&
                        normalizarTexto(item.nome) ===
                        nomeProfessor
                    )
                );
            });

    const criador =
        (
            turma.criadoPorUid &&
            String(turma.criadoPorUid) ===
            uidProfessor
        ) ||

        (
            turma.criadoPorEmail &&
            normalizarTexto(turma.criadoPorEmail) ===
            emailProfessor
        ) ||

        (
            turma.criadoPorNome &&
            normalizarTexto(turma.criadoPorNome) ===
            nomeProfessor
        );

    return (
        vinculada ||
        criador
    );
}

// ============================================================
// ALUNO PODE VER TURMA
// ============================================================

function alunoPodeVerTurma(turma) {

    if (!turma) {
        return false;
    }

    const professoresAluno =
        Array.isArray(
            userExtraInfo?.professoresVinculados
        )
            ? userExtraInfo.professoresVinculados
            : [];

    if (!professoresAluno.length) {
        return false;
    }

    const professoresTurma =
        obterProfessoresTurma(turma);

    return professoresTurma.some(
        professorTurma => {

            const nomeTurma =
                typeof professorTurma === 'string'
                    ? professorTurma
                    : professorTurma?.nome ||
                      professorTurma?.email ||
                      '';

            return professoresAluno.some(
                professorAluno => {

                    const nomeAluno =
                        typeof professorAluno === 'string'
                            ? professorAluno
                            : professorAluno?.nome ||
                              professorAluno?.email ||
                              '';

                    return (
                        normalizarTexto(nomeAluno) ===
                        normalizarTexto(nomeTurma)
                    );
                }
            );
        }
    );
}

// ============================================================
// CARREGAR TURMAS DISPONÍVEIS
// ============================================================

async function carregarTurmasDisponiveis() {

    const todas =
        await buscarTodasTurmas();

    if (
        currentUserRole ===
        'professor'
    ) {

        turmasDisponiveis =
            todas.filter(
                turma =>
                    professorPertenceTurma(
                        turma,
                        currentUser
                    )
            );

    } else {

        turmasDisponiveis =
            todas.filter(
                turma =>
                    alunoPodeVerTurma(
                        turma
                    )
            );
    }

    turmasDisponiveis.sort(
        (a, b) =>
            normalizarTexto(a.nome)
                .localeCompare(
                    normalizarTexto(b.nome)
                )
    );

    return turmasDisponiveis;
}

// ============================================================
// FILTRAR TURMAS
// ============================================================

function filtrarTurmas(
    lista,
    texto
) {

    const termo =
        normalizarTexto(texto);

    if (!termo) {
        return lista;
    }

    return lista.filter(turma =>
        normalizarTexto(
            turma.nome
        ).includes(termo) ||

        normalizarTexto(
            turma.codigo
        ).includes(termo) ||

        normalizarTexto(
            turma.descricao
        ).includes(termo)
    );
}

// ============================================================
// GARANTIR GATE DE TURMA
// ============================================================

function garantirTurmaGate() {

    let gate =
        document.getElementById(
            'turmaGate'
        );

    if (gate) {
        return gate;
    }

    gate =
        document.createElement('div');

    gate.id =
        'turmaGate';

    gate.className =
        'turma-gate';

    gate.style.display =
        'none';

    gate.innerHTML = `

        <div class="turma-gate-card">

            <div class="turma-gate-header">

                <div class="turma-gate-icon">
                    <i class="fas fa-users"></i>
                </div>

                <div>

                    <span>
                        ACESSO À TURMA
                    </span>

                    <h2 id="turmaGateTitle">
                        Selecione sua turma
                    </h2>

                    <p id="turmaGateSubtitle"></p>

                </div>

            </div>

            <div class="turma-search">

                <i class="fas fa-search"></i>

                <input
                    type="search"
                    id="filtroTurma"
                    placeholder="Pesquisar turma ou código...">

            </div>

            <div
                id="turmasLista"
                class="turmas-lista">
            </div>

            <div class="turma-selecionada">

                <div>

                    <small>
                        TURMA SELECIONADA
                    </small>

                    <strong id="turmaSelecionadaNome">
                        Nenhuma turma selecionada
                    </strong>

                    <span id="turmaSelecionadaDetalhes">
                        Selecione uma turma acima.
                    </span>

                </div>

                <div class="turma-codigo-visual">

                    <span>
                        CÓDIGO
                    </span>

                    <strong id="codigoTurmaVisual">
                        --------
                    </strong>

                </div>

            </div>

            <div class="turma-code-input">

                <label>
                    <i class="fas fa-key"></i>
                    Digite o código da turma
                </label>

                <input
                    type="text"
                    id="codigoTurmaEntrada"
                    placeholder="Digite o código mostrado acima"
                    autocomplete="off"
                    maxlength="30">

            </div>

            <button
                type="button"
                id="btnEntrarTurma"
                class="btn-turma-entrar">

                <i class="fas fa-right-to-bracket"></i>

                Entrar na turma

            </button>

            <button
                type="button"
                id="btnAbrirCriarTurma"
                class="btn-turma-criar">

                <i class="fas fa-plus"></i>

                Criar nova turma

            </button>

            <button
                type="button"
                id="btnVoltarTurma"
                class="btn-turma-voltar">

                <i class="fas fa-arrow-left"></i>

                Voltar

            </button>

        </div>
    `;

    document.body.appendChild(gate);

    return gate;
}

// ============================================================
// MOSTRAR GATE
// ============================================================

function mostrarGate(role) {

    const gate =
        garantirTurmaGate();

    const titulo =
        document.getElementById(
            'turmaGateTitle'
        );

    const subtitulo =
        document.getElementById(
            'turmaGateSubtitle'
        );

    const criarBtn =
        document.getElementById(
            'btnAbrirCriarTurma'
        );

    const filtro =
        document.getElementById(
            'filtroTurma'
        );

    const codigoInput =
        document.getElementById(
            'codigoTurmaEntrada'
        );

    const nome =
        document.getElementById(
            'turmaSelecionadaNome'
        );

    const codigo =
        document.getElementById(
            'codigoTurmaVisual'
        );

    const detalhes =
        document.getElementById(
            'turmaSelecionadaDetalhes'
        );

    turmaSelecionada =
        null;

    if (titulo) {
        titulo.textContent =
            'Selecione sua turma';
    }

    if (subtitulo) {

        subtitulo.textContent =
            role === 'professor'
                ? 'Selecione uma turma vinculada ao seu perfil e confirme o código.'
                : 'Escolha uma turma relacionada aos professores da sua conta e confirme o código.';
    }

    if (criarBtn) {

        criarBtn.style.display =
            role === 'professor'
                ? 'flex'
                : 'none';
    }

    if (filtro) {
        filtro.value = '';
    }

    if (codigoInput) {
        codigoInput.value = '';
    }

    if (nome) {
        nome.textContent =
            'Nenhuma turma selecionada';
    }

    if (codigo) {
        codigo.textContent =
            '--------';
    }

    if (detalhes) {
        detalhes.textContent =
            'Selecione uma turma acima.';
    }

    carregarTurmasDisponiveis()
        .then(() =>
            renderListaTurmasGate()
        )
        .catch(error => {

            console.error(
                'Erro carregando turmas:',
                error
            );

            renderListaTurmasGate([]);
        });

    if (appContainer) {
        appContainer.style.display = 'none';
    }

    if (loginContainer) {
        loginContainer.style.display = 'none';
    }

    gate.style.display = 'flex';

    closeSidebar();
}

// ============================================================
// SELECIONAR TURMA
// ============================================================

function selecionarTurma(turma) {

    if (!turma) {
        return;
    }

    turmaSelecionada = {
        ...turma
    };

    const nome =
        document.getElementById(
            'turmaSelecionadaNome'
        );

    const codigo =
        document.getElementById(
            'codigoTurmaVisual'
        );

    const detalhes =
        document.getElementById(
            'turmaSelecionadaDetalhes'
        );

    const input =
        document.getElementById(
            'codigoTurmaEntrada'
        );

    if (nome) {
        nome.textContent =
            turma.nome ||
            'Turma';
    }

    if (codigo) {
        codigo.textContent =
            turma.codigo ||
            '--------';
    }

    if (detalhes) {
        detalhes.textContent =
            `Turma criada por ${turma.criadoPorNome || turma.criadoPorEmail || 'Professor'} em ${turma.criadoEm || 'data não informada'}`;
    }

    if (input) {
        input.value = '';
        input.focus();
    }

    const filtro =
        document.getElementById(
            'filtroTurma'
        );

    renderListaTurmasGate(
        filtrarTurmas(
            turmasDisponiveis,
            filtro?.value || ''
        )
    );
}

// ============================================================
// RENDERIZAR LISTA DO GATE
// ============================================================

function renderListaTurmasGate(
    lista = turmasDisponiveis
) {

    const container =
        document.getElementById(
            'turmasLista'
        );

    if (!container) {
        return;
    }

    if (!lista?.length) {

        container.innerHTML = `

            <div class="turmas-empty">

                <div class="turmas-empty-icon">
                    <i class="fas fa-users-slash"></i>
                </div>

                <strong>
                    Nenhuma turma disponível
                </strong>

                <span>

                    ${
                        currentUserRole === 'professor'
                            ? 'Você ainda não está vinculado a nenhuma turma.'
                            : 'Nenhuma turma foi encontrada para os professores vinculados à sua conta.'
                    }

                </span>

            </div>
        `;

        return;
    }

    container.innerHTML =
        lista.map(turma => {

            const ativa =
                String(
                    turmaSelecionada?.id || ''
                ) ===
                String(
                    turma.id || ''
                );

            const professores =
                obterProfessoresTurma(turma);

            return `

                <button
                    type="button"
                    class="
                        turma-item
                        ${ativa ? 'active' : ''}
                    "
                    data-turma-id="${escapeHtml(turma.id)}">

                    <div class="turma-item-icon">
                        <i class="fas fa-users"></i>
                    </div>

                    <div class="turma-item-content">

                        <strong>
                            ${escapeHtml(
                                turma.nome ||
                                'Turma sem nome'
                            )}
                        </strong>

                        <span>
                            ${escapeHtml(
                                turma.descricao ||
                                `${professores.length} professor(es) vinculado(s)`
                            )}
                        </span>

                    </div>

                    <div class="turma-item-arrow">
                        <i class="fas fa-chevron-right"></i>
                    </div>

                </button>
            `;

        }).join('');

    container
        .querySelectorAll('.turma-item')
        .forEach(item => {

            item.addEventListener(
                'click',
                () => {

                    const turma =
                        turmasDisponiveis.find(
                            registro =>
                                String(
                                    registro.id
                                ) ===
                                String(
                                    item.dataset.turmaId
                                )
                        );

                    selecionarTurma(turma);
                }
            );
        });
}

// ============================================================
// FILTRO DO GATE
// ============================================================

document.addEventListener(
    'input',
    event => {

        if (
            event.target?.id !==
            'filtroTurma'
        ) {
            return;
        }

        renderListaTurmasGate(
            filtrarTurmas(
                turmasDisponiveis,
                event.target.value
            )
        );
    }
);

// ============================================================
// ENTRAR NA TURMA
// ============================================================

async function confirmarEntradaNaTurma() {

    if (!currentUser) {

        mostrarSomenteLogin();

        return;
    }

    if (!turmaSelecionada) {

        alert(
            '⚠️ Selecione uma turma primeiro.'
        );

        return;
    }

    const input =
        document.getElementById(
            'codigoTurmaEntrada'
        );

    const digitado =
        input?.value.trim() || '';

    if (!digitado) {

        alert(
            '⚠️ Digite o código da turma.'
        );

        input?.focus();

        return;
    }

    if (
        normalizarTexto(digitado) !==
        normalizarTexto(
            turmaSelecionada.codigo
        )
    ) {

        alert(
            '❌ Código da turma incorreto.'
        );

        input?.select();

        return;
    }

    try {

        if (
            currentUserRole ===
            'aluno'
        ) {

            const professoresAluno =
                Array.isArray(
                    userExtraInfo?.professoresVinculados
                )
                    ? [
                        ...userExtraInfo.professoresVinculados
                    ]
                    : [];

            if (professoresAluno.length) {

                const professoresAtuais =
                    obterProfessoresTurma(
                        turmaSelecionada
                    );

                for (
                    const professorAluno
                    of professoresAluno
                ) {

                    const nomeAluno =
                        typeof professorAluno ===
                        'string'
                            ? professorAluno
                            : professorAluno?.nome ||
                              professorAluno?.email ||
                              '';

                    const existe =
                        professoresAtuais.some(
                            item => {

                                const nome =
                                    typeof item ===
                                    'string'
                                        ? item
                                        : item?.nome ||
                                          item?.email ||
                                          '';

                                return (
                                    normalizarTexto(nome) ===
                                    normalizarTexto(nomeAluno)
                                );
                            }
                        );

                    if (!existe) {
                        professoresAtuais.push(
                            professorAluno
                        );
                    }
                }

                await update(
                    ref(
                        db,
                        `turmas/${turmaSelecionada.id}`
                    ),
                    {
                        professores:
                            professoresAtuais
                    }
                );

                turmaSelecionada = {
                    ...turmaSelecionada,
                    professores:
                        professoresAtuais
                };
            }
        }

        definirTurmaAtual(
            turmaSelecionada
        );

        await abrirSistemaNaTurma();

    } catch (error) {

        console.error(
            'Erro ao entrar na turma:',
            error
        );

        alert(
            '❌ Não foi possível entrar na turma:\n' +
            error.message
        );
    }
}

document.addEventListener(
    'click',
    event => {

        const btn =
            event.target.closest(
                '#btnEntrarTurma'
            );

        if (btn) {
            confirmarEntradaNaTurma();
        }
    }
);

// ============================================================
// ABRIR SISTEMA NA TURMA
// ============================================================

async function abrirSistemaNaTurma() {

    if (
        !currentUser ||
        !currentTurma
    ) {
        return;
    }

    window.senaiTurmaAtualId =
        String(currentTurma.id);

    localStorage.setItem(
        'turmaAtual',
        JSON.stringify(currentTurma)
    );

    localStorage.setItem(
        'turmaAtualId',
        String(currentTurma.id)
    );

    localStorage.setItem(
        'turmaAtualNome',
        currentTurma.nome || ''
    );

    localStorage.setItem(
        'turmaAtualCodigo',
        currentTurma.codigo || ''
    );

    const gate =
        document.getElementById(
            'turmaGate'
        );

    if (gate) {
        gate.style.display = 'none';
    }

    mostrarApp();

    atualizarTurmaInterface();

    closeSidebar();

    try {

        await renderDashboard();

        await renderMateriais();

        await renderMoinho();

        await renderHistorico();

    } catch (error) {

        console.error(
            'Erro carregando módulos:',
            error
        );
    }
}

// ============================================================
// INTERFACE TURMA ATUAL
// ============================================================

function atualizarTurmaInterface() {

    const nome =
        document.getElementById(
            'turmaAtualHeader'
        );

    const codigo =
        document.getElementById(
            'turmaAtualCodigo'
        );

    if (nome) {

        nome.textContent =
            currentTurma?.nome ||
            'Nenhuma turma selecionada';
    }

    if (codigo) {

        codigo.textContent =
            currentTurma?.codigo ||
            '------';
    }
}

// ============================================================
// LIMPAR FORMULÁRIO DE TURMA
// ============================================================

function limparFormularioCriarTurma() {

    const campos = [
        'novaTurmaNome',
        'novaTurmaCodigo',
        'novaTurmaCodigoConfirmar',
        'novaTurmaDescricao'
    ];

    campos.forEach(id => {

        const input =
            document.getElementById(id);

        if (input) {
            input.value = '';
        }
    });

    const aviso =
        document.getElementById(
            'criarTurmaMensagem'
        );

    if (aviso) {
        aviso.textContent = '';
        aviso.style.display = 'none';
    }

    const btn =
        document.getElementById(
            'btnSalvarNovaTurma'
        );

    if (btn) {

        btn.disabled = false;

        btn.innerHTML =
            '<i class="fas fa-plus"></i> Criar turma';
    }

    const professoresContainer =
        document.getElementById(
            'turmaProfessoresCheckboxes'
        );

    if (professoresContainer) {

        professoresContainer.innerHTML = `
            <div class="checkbox-loading">
                <i class="fas fa-spinner fa-spin"></i>
                Carregando professores...
            </div>
        `;
    }
}

// ============================================================
// ABRIR CRIAR TURMA
// ============================================================

async function abrirCriarTurmaModal() {

    if (!currentUser) {

        alert(
            '⚠️ Faça login primeiro.'
        );

        return;
    }

    if (
        currentUserRole !==
        'professor'
    ) {

        alert(
            '⚠️ Somente professores podem criar turmas.'
        );

        return;
    }

    limparFormularioCriarTurma();

    if (criarTurmaModal) {
        criarTurmaModal.style.display = 'block';
    }

    await carregarProfessoresParaTurma();

    requestAnimationFrame(
        () => {

            document
                .getElementById(
                    'novaTurmaNome'
                )
                ?.focus();
        }
    );
}

document.addEventListener(
    'click',
    event => {

        if (
            event.target.closest(
                '#btnAbrirCriarTurma'
            ) ||
            event.target.closest(
                '#btnCriarTurmaPagina'
            )
        ) {

            abrirCriarTurmaModal();
        }
    }
);

document
    .querySelector('.close-criar-turma')
    ?.addEventListener(
        'click',
        () => {

            if (criarTurmaModal) {
                criarTurmaModal.style.display = 'none';
            }
        }
    );

// ============================================================
// CRIAR TURMA
// ============================================================

document
    .getElementById(
        'btnSalvarNovaTurma'
    )
    ?.addEventListener(
        'click',
        async () => {

            if (
                !currentUser ||
                currentUserRole !== 'professor'
            ) {

                alert(
                    '⚠️ Somente professores podem criar turmas.'
                );

                return;
            }

            const nome =
                document
                    .getElementById('novaTurmaNome')
                    ?.value
                    .trim() || '';

            const codigo =
                document
                    .getElementById('novaTurmaCodigo')
                    ?.value
                    .trim() || '';

            const confirmar =
                document
                    .getElementById(
                        'novaTurmaCodigoConfirmar'
                    )
                    ?.value
                    .trim() || '';

            const descricao =
                document
                    .getElementById(
                        'novaTurmaDescricao'
                    )
                    ?.value
                    .trim() || '';

            const selecionados =
                Array.from(
                    document.querySelectorAll(
                        '#turmaProfessoresCheckboxes .turma-professor-check:checked'
                    )
                );

            const professoresSelecionados =
                selecionados.map(
                    checkbox => ({
                        uid:
                            checkbox.dataset.uid || '',
                        nome:
                            checkbox.dataset.nome ||
                            checkbox.value ||
                            'Professor',
                        email:
                            checkbox.dataset.email ||
                            ''
                    })
                );

            const btn =
                document.getElementById(
                    'btnSalvarNovaTurma'
                );

            if (!nome) {
                alert('⚠️ Informe o nome da turma.');
                return;
            }

            if (!codigo) {
                alert('⚠️ Informe o código da turma.');
                return;
            }

            if (codigo.length < 3) {

                alert(
                    '⚠️ O código precisa ter pelo menos 3 caracteres.'
                );

                return;
            }

            if (codigo !== confirmar) {

                alert(
                    '❌ Os códigos não são iguais.'
                );

                return;
            }

            if (!professoresSelecionados.length) {

                alert(
                    '⚠️ Selecione pelo menos um professor para a turma.'
                );

                return;
            }

            try {

                if (btn) {

                    btn.disabled = true;

                    btn.innerHTML =
                        '<i class="fas fa-spinner fa-spin"></i> Criando...';
                }

                const turmas =
                    await buscarTodasTurmas();

                const codigoNormalizado =
                    codigo.toUpperCase();

                const existe =
                    turmas.some(
                        turma =>
                            normalizarTexto(
                                turma.codigo
                            ) ===
                            normalizarTexto(
                                codigoNormalizado
                            )
                    );

                if (existe) {

                    alert(
                        '❌ Já existe uma turma com esse código.'
                    );

                    return;
                }

                const novaRef =
                    push(
                        ref(
                            db,
                            'turmas'
                        )
                    );

                const turmaId =
                    novaRef.key;

                const professoresDaTurma = {};

                professoresSelecionados.forEach(
                    professor => {

                        if (!professor.uid) {
                            return;
                        }

                        professoresDaTurma[
                            professor.uid
                        ] = {

                            uid:
                                professor.uid,

                            nome:
                                professor.nome,

                            email:
                                professor.email,

                            tipo:
                                professor.uid ===
                                currentUser.uid
                                    ? 'criador'
                                    : 'vinculado',

                            vinculadoEm:
                                Date.now()
                        };
                    }
                );

                if (
                    currentUser?.uid &&
                    !professoresDaTurma[
                        currentUser.uid
                    ]
                ) {

                    professoresDaTurma[
                        currentUser.uid
                    ] = {

                        uid:
                            currentUser.uid,

                        nome:
                            obterNomeUsuario(),

                        email:
                            currentUser.email || '',

                        tipo:
                            'criador',

                        vinculadoEm:
                            Date.now()
                    };
                }

                const novaTurma = {

                    id:
                        turmaId,

                    nome:
                        nome,

                    codigo:
                        codigoNormalizado,

                    descricao:
                        descricao,

                    criadoEm:
                        new Date()
                            .toLocaleString(
                                'pt-BR'
                            ),

                    criadoPorUid:
                        currentUser.uid,

                    criadoPorNome:
                        obterNomeUsuario(),

                    criadoPorEmail:
                        currentUser.email || '',

                    ativo:
                        true,

                    professores:
                        professoresDaTurma,

                    alunos:
                        {},

                    materiais:
                        {},

                    lixeira_materiais:
                        {},

                    moinho:
                        {
                            materiais: [],
                            capacidadeMax: 900,
                            historico: []
                        },

                    historico:
                        {}
                };

                await set(
                    novaRef,
                    novaTurma
                );

                for (
                    const professor
                    of professoresSelecionados
                ) {

                    if (!professor.uid) {
                        continue;
                    }

                    await update(
                        ref(
                            db,
                            `usuarios/${professor.uid}`
                        ),
                        {
                            [`turmasVinculadas/${turmaId}`]:
                                true
                        }
                    );

                    if (professor.email) {

                        await update(
                            ref(
                                db,
                                `professores/${professor.email.replace(
                                    /[.#$[\]]/g,
                                    '_'
                                )}`
                            ),
                            {
                                [`turmasVinculadas/${turmaId}`]:
                                    true
                            }
                        );
                    }
                }

                await update(
                    ref(
                        db,
                        `usuarios/${currentUser.uid}`
                    ),
                    {

                        turmaAtualId:
                            turmaId,

                        turmaAtualNome:
                            novaTurma.nome,

                        turmaAtualCodigo:
                            novaTurma.codigo,

                        [`turmasVinculadas/${turmaId}`]:
                            true
                    }
                );

                definirTurmaAtual(
                    novaTurma
                );

                window.senaiTurmaAtualId =
                    turmaId;

                limparFormularioCriarTurma();

                if (criarTurmaModal) {
                    criarTurmaModal.style.display = 'none';
                }

                alert(
                    '✅ Turma criada com sucesso!'
                );

                await renderTurmasPagina();

                atualizarTurmaInterface();

            } catch (error) {

                console.error(
                    'Erro criando turma:',
                    error
                );

                alert(
                    '❌ Erro ao criar turma:\n' +
                    error.message
                );

            } finally {

                if (btn) {

                    btn.disabled = false;

                    btn.innerHTML =
                        '<i class="fas fa-plus"></i> Criar turma';
                }
            }
        }
    );

// ============================================================
// PROFESSOR PODE APAGAR TURMA
// Criador OU professor vinculado
// ============================================================

function professorPodeApagarTurma(turma) {

    if (
        currentUserRole !== 'professor' ||
        !currentUser?.uid ||
        !turma
    ) {
        return false;
    }

    const uid =
        String(
            currentUser.uid
        );

    if (
        String(
            turma.criadoPorUid || ''
        ) === uid
    ) {
        return true;
    }

    return obterProfessoresTurma(
        turma
    ).some(
        professor =>
            typeof professor !== 'string' &&
            String(
                professor?.uid || ''
            ) === uid
    );
}

// ============================================================
// ABA TURMAS
// ============================================================

function garantirAbaTurmasProfessor() {

    if (
        currentUserRole !==
        'professor'
    ) {
        return null;
    }

    const nav =
        document.querySelector(
            '.sidebar-menu'
        );

    const tabs =
        document.querySelector(
            '.tabs-container'
        );

    if (
        !nav ||
        !tabs
    ) {
        return null;
    }

    let button =
        nav.querySelector(
            '.sidebar-item[data-tab="turmas"]'
        );

    if (!button) {

        button =
            document.createElement(
                'button'
            );

        button.type =
            'button';

        button.id =
            'sidebarTurmasBtn';

        button.className =
            'sidebar-item';

        button.dataset.tab =
            'turmas';

        button.innerHTML = `
            <i class="fas fa-users"></i>
            <span>Turmas</span>
        `;

        const referencia =
            nav.querySelector(
                '.sidebar-item[data-tab="historico"]'
            );

        if (referencia) {

            referencia.insertAdjacentElement(
                'afterend',
                button
            );

        } else {

            nav.appendChild(
                button
            );
        }

        button.addEventListener(
            'click',
            () => {

                window.showTab(
                    'turmas'
                );
            }
        );
    }

    let section =
        document.getElementById(
            'tabTurmas'
        );

    if (!section) {

        section =
            document.createElement(
                'section'
            );

        section.id =
            'tabTurmas';

        section.className =
            'tab-content';

        section.innerHTML = `

            <div class="turmas-page">

                <div class="turmas-page-header">

                    <div>

                        <span class="turmas-page-label">
                            GERENCIAMENTO
                        </span>

                        <h2>
                            Turmas
                        </h2>

                        <p>
                            Filtre uma turma vinculada ao seu perfil,
                            entre com o código ou crie uma nova turma.
                        </p>

                    </div>

                    <button
                        type="button"
                        id="btnCriarTurmaPagina"
                        class="btn-primary btn-turma-criar-pagina">

                        <i class="fas fa-plus"></i>

                        Criar nova turma

                    </button>

                </div>

                <div class="turmas-page-filter">

                    <i class="fas fa-search"></i>

                    <input
                        type="search"
                        id="filtroTurmasPagina"
                        placeholder="Pesquisar turma ou código...">

                </div>

                <div
                    id="turmasPaginaLista"
                    class="turmas-page-list">
                </div>

            </div>
        `;

        tabs.appendChild(
            section
        );

        section
            .querySelector(
                '#btnCriarTurmaPagina'
            )
            ?.addEventListener(
                'click',
                abrirCriarTurmaModal
            );
    }

    const filtroTurmas =
        document.getElementById(
            'filtroTurmasPagina'
        );

    if (
        filtroTurmas &&
        filtroTurmas.dataset.listenerFiltro !== 'true'
    ) {

        filtroTurmas.dataset.listenerFiltro =
            'true';

        filtroTurmas.addEventListener(
            'input',
            () => {

                renderTurmasPagina();
            }
        );
    }

    const botaoCriar =
        document.getElementById(
            'btnCriarTurmaPagina'
        );

    if (
        botaoCriar &&
        botaoCriar.dataset.listenerCriar !== 'true'
    ) {

        botaoCriar.dataset.listenerCriar =
            'true';

        botaoCriar.addEventListener(
            'click',
            abrirCriarTurmaModal
        );
    }

    return section;
}

// ============================================================
// RENDERIZAR TURMAS DO PROFESSOR
// ============================================================

async function renderTurmasPagina() {

    if (
        currentUserRole !==
        'professor'
    ) {
        return;
    }

    garantirAbaTurmasProfessor();

    const container =
        document.getElementById(
            'turmasPaginaLista'
        );

    if (!container) {
        return;
    }

    container.innerHTML = `

        <div class="loading">

            <i class="fas fa-spinner fa-spin"></i>

            Carregando turmas...

        </div>

    `;

    try {

        await carregarTurmasDisponiveis();

        const filtro =
            document.getElementById(
                'filtroTurmasPagina'
            )?.value || '';

        const lista =
            filtrarTurmas(
                turmasDisponiveis,
                filtro
            );

        if (!lista.length) {

            container.innerHTML = `

                <div class="turmas-empty">

                    <div class="turmas-empty-icon">
                        <i class="fas fa-users-slash"></i>
                    </div>

                    <strong>
                        Nenhuma turma encontrada
                    </strong>

                    <span>
                        Você pode criar uma nova turma
                        ou ajustar o filtro.
                    </span>

                </div>
            `;

            return;
        }

        container.innerHTML =
            lista
                .map(
                    turma => {

                        const ativa =
                            String(
                                currentTurma?.id
                            ) ===
                            String(
                                turma.id
                            );

                        const professores =
                            obterProfessoresTurma(
                                turma
                            );

                        return `

                            <div
                                class="
                                    turma-page-item
                                    ${ativa ? 'active' : ''}
                                ">

                                <div class="turma-page-main">

                                    <div class="turma-page-icon">
                                        <i class="fas fa-users"></i>
                                    </div>

                                    <div class="turma-page-info">

                                        <strong>
                                            ${escapeHtml(
                                                turma.nome ||
                                                'Turma sem nome'
                                            )}
                                        </strong>

                                        <span>
                                            ${
                                                professores.length
                                                    ? `${professores.length} professor(es) vinculado(s)`
                                                    : 'Nenhum professor vinculado'
                                            }
                                        </span>

                                        <small>
                                            ${escapeHtml(
                                                turma.descricao ||
                                                'Sem descrição'
                                            )}
                                        </small>

                                    </div>

                                </div>

                                <div class="turma-page-actions">

                                    ${
                                        ativa
                                            ? `
                                                <span class="turma-current-badge">

                                                    <i class="fas fa-check"></i>

                                                    Turma atual

                                                </span>
                                              `
                                            : ''
                                    }

                                    <button
                                        type="button"
                                        class="btn-edit turma-entrar-page"
                                        data-id="${escapeHtml(
                                            turma.id
                                        )}">

                                        <i class="fas fa-right-to-bracket"></i>

                                        Entrar

                                    </button>

                                    ${
                                        professorPodeApagarTurma(
                                            turma
                                        )
                                            ? `
                                                <button
                                                    type="button"
                                                    class="btn-danger turma-remover-page"
                                                    data-id="${escapeHtml(
                                                        turma.id
                                                    )}"
                                                    data-nome="${escapeHtml(
                                                        turma.nome || 'Turma'
                                                    )}">

                                                    <i class="fas fa-trash"></i>

                                                    Apagar turma

                                                </button>
                                              `
                                            : ''
                                    }

                                </div>

                            </div>

                        `;
                    }
                )
                .join('');

        container
            .querySelectorAll(
                '.turma-entrar-page'
            )
            .forEach(
                btn => {

                    btn.addEventListener(
                        'click',
                        () => {

                            const turma =
                                turmasDisponiveis.find(
                                    item =>
                                        String(
                                            item.id
                                        ) ===
                                        String(
                                            btn.dataset.id
                                        )
                                );

                            if (!turma) {
                                return;
                            }

                            turmaSelecionada =
                                turma;

                            mostrarGate(
                                'professor'
                            );

                            selecionarTurma(
                                turma
                            );
                        }
                    );
                }
            );

        container
            .querySelectorAll(
                '.turma-remover-page'
            )
            .forEach(
                btn => {

                    btn.addEventListener(
                        'click',
                        async event => {

                            event.preventDefault();
                            event.stopPropagation();

                            const turmaId =
                                btn.dataset.id;

                            const nome =
                                btn.dataset.nome ||
                                'Turma';

                            const turma =
                                turmasDisponiveis.find(
                                    item =>
                                        String(
                                            item.id
                                        ) ===
                                        String(
                                            turmaId
                                        )
                                );

                            if (
                                !turma ||
                                !professorPodeApagarTurma(
                                    turma
                                )
                            ) {

                                alert(
                                    '❌ Você não tem permissão para apagar esta turma.'
                                );

                                return;
                            }

                            const confirmou =
                                confirm(
                                    `⚠️ Deseja realmente apagar a turma "${nome}"?\n\n` +
                                    'Os dados exclusivos dessa turma serão removidos.'
                                );

                            if (!confirmou) {
                                return;
                            }

                            try {

                                btn.disabled = true;

                                btn.innerHTML =
                                    '<i class="fas fa-spinner fa-spin"></i> Apagando...';

                                const resultado =
                                    await removerTurma(
                                        turmaId,
                                        currentUser.uid
                                    );

                                if (!resultado?.success) {

                                    alert(
                                        '❌ ' +
                                        (
                                            resultado?.error ||
                                            'Não foi possível apagar a turma.'
                                        )
                                    );

                                    return;
                                }

                                if (
                                    String(
                                        obterTurmaAtualId() || ''
                                    ) ===
                                    String(
                                        turmaId
                                    )
                                ) {

                                    definirTurmaAtual(null);

                                    atualizarTurmaInterface();
                                }

                                alert(
                                    `✅ A turma "${nome}" foi apagada com sucesso.`
                                );

                                await renderTurmasPagina();

                            } catch (error) {

                                console.error(
                                    '❌ Erro ao apagar turma:',
                                    error
                                );

                                alert(
                                    '❌ Erro ao apagar turma:\n' +
                                    error.message
                                );

                            } finally {

                                btn.disabled = false;

                                btn.innerHTML =
                                    '<i class="fas fa-trash"></i> Apagar turma';
                            }
                        }
                    );
                }
            );

    } catch (error) {

        console.error(
            'Erro ao renderizar turmas:',
            error
        );

        container.innerHTML = `

            <div class="turmas-empty">

                <div class="turmas-empty-icon">

                    <i class="fas fa-circle-exclamation"></i>

                </div>

                <strong>
                    Erro ao carregar turmas
                </strong>

                <span>
                    ${escapeHtml(
                        error.message ||
                        'Tente novamente.'
                    )}
                </span>

            </div>

        `;
    }
}

// ============================================================
// LOGIN PROFESSOR
// ============================================================

loginProfBtn
    ?.addEventListener(
        'click',
        async () => {

            const email =
                document
                    .getElementById(
                        'loginProfEmail'
                    )
                    ?.value
                    .trim();

            const senha =
                document
                    .getElementById(
                        'loginProfPassword'
                    )
                    ?.value
                    .trim();

            if (
                !email ||
                !senha
            ) {

                alert(
                    '⚠️ Preencha email e senha!'
                );

                return;
            }

            try {

                loginIniciadoManualmente =
                    true;

                loginProfBtn.disabled =
                    true;

                loginProfBtn.innerHTML =
                    '<i class="fas fa-spinner fa-spin"></i> Entrando...';

                const result =
                    await loginProfessor(
                        email,
                        senha
                    );

                if (!result?.success) {

                    loginIniciadoManualmente =
                        false;

                    alert(
                        '❌ ' +
                        (
                            result?.error ||
                            'Email ou senha incorretos.'
                        )
                    );
                }

            } catch (error) {

                loginIniciadoManualmente =
                    false;

                console.error(
                    'Erro login professor:',
                    error
                );

                alert(
                    '❌ Erro ao entrar:\n' +
                    error.message
                );

            } finally {

                loginProfBtn.disabled =
                    false;

                loginProfBtn.innerHTML =
                    '<i class="fas fa-right-to-bracket"></i> Entrar';
            }
        }
    );

// ============================================================
// LOGIN ALUNO
// ============================================================

loginAlunoBtn
    ?.addEventListener(
        'click',
        async () => {

            const email =
                document
                    .getElementById(
                        'loginAlunoEmail'
                    )
                    ?.value
                    .trim();

            const senha =
                document
                    .getElementById(
                        'loginAlunoPassword'
                    )
                    ?.value
                    .trim();

            if (
                !email ||
                !senha
            ) {

                alert(
                    '⚠️ Preencha email e senha!'
                );

                return;
            }

            try {

                loginIniciadoManualmente =
                    true;

                loginAlunoBtn.disabled =
                    true;

                loginAlunoBtn.innerHTML =
                    '<i class="fas fa-spinner fa-spin"></i> Entrando...';

                const result =
                    await loginAluno(
                        email,
                        senha
                    );

                if (!result?.success) {

                    loginIniciadoManualmente =
                        false;

                    alert(
                        '❌ ' +
                        (
                            result?.error ||
                            'Email ou senha incorretos.'
                        )
                    );
                }

            } catch (error) {

                loginIniciadoManualmente =
                    false;

                console.error(
                    'Erro login aluno:',
                    error
                );

                alert(
                    '❌ Erro ao entrar:\n' +
                    error.message
                );

            } finally {

                loginAlunoBtn.disabled =
                    false;

                loginAlunoBtn.innerHTML =
                    '<i class="fas fa-right-to-bracket"></i> Entrar';
            }
        }
    );

// ============================================================
// PREPARAR APÓS LOGIN
// ============================================================

async function prepararPosLogin(
    user,
    role
) {

    if (!user) {

        mostrarSomenteLogin();

        return;
    }

    if (
        ultimaSessaoPreparada ===
        `${user.uid}:${role}` &&

        currentUser?.uid ===
        user.uid &&

        currentUserRole ===
        role
    ) {

        return;
    }

    currentUser =
        user;

    currentUserRole =
        role;

    try {

        setDashboardData(
            user,
            role,
            isUsingLocalData
        );

        setMateriaisData(
            user,
            role,
            isUsingLocalData
        );

        setMoinhoData(
            user,
            role,
            isUsingLocalData
        );

        setHistoricoData(
            user,
            role,
            isUsingLocalData
        );

        setMeuPerfilData(
            user,
            role,
            isUsingLocalData
        );

        if (
            role ===
            'professor'
        ) {

            setProfessorData(
                user,
                isUsingLocalData
            );

        } else {

            setAlunoData(
                user,
                isUsingLocalData
            );
        }

        atualizarUsuarioInterface(
            user,
            role
        );

        showConnectionStatus();

        ultimaSessaoPreparada =
            `${user.uid}:${role}`;

        if (
            role ===
            'professor'
        ) {

            garantirAbaTurmasProfessor();

            mostrarApp();

            atualizarVisibilidadeTurmas();

            window.showTab(
                'turmas'
            );

            return;
        }

        mostrarGate(
            'aluno'
        );

    } catch (error) {

        console.error(
            'Erro preparando pós-login:',
            error
        );

        ultimaSessaoPreparada =
            null;

        mostrarSomenteLogin();

        alert(
            '❌ Erro preparando o acesso:\n' +
            error.message
        );
    }
}

// ============================================================
// VISIBILIDADE DA ABA TURMAS
// ============================================================

function atualizarVisibilidadeTurmas() {

    const btn =
        document.querySelector(
            '.sidebar-item[data-tab="turmas"]'
        );

    if (!btn) {
        return;
    }

    btn.style.display =
        currentUserRole ===
        'professor'
            ? 'flex'
            : 'none';
}

// ============================================================
// INTERFACE DO USUÁRIO
// ============================================================

function atualizarUsuarioInterface(
    user,
    role
) {

    const nome =
        userExtraInfo?.nome ||
        user?.email?.split('@')[0] ||
        'Usuário';

    const cargo =
        role === 'professor'
            ? 'Professor'
            : 'Aluno';

    const headerUserName =
        document.getElementById(
            'headerUserName'
        );

    const headerUserRole =
        document.getElementById(
            'headerUserRole'
        );

    if (headerUserName) {

        headerUserName.textContent =
            nome;
    }

    if (headerUserRole) {

        headerUserRole.textContent =
            cargo;
    }

    if (sidebarUserName) {

        sidebarUserName.textContent =
            nome;
    }

    if (sidebarUserRole) {

        sidebarUserRole.textContent =
            cargo;
    }

    // A atualização dos elementos antigos:
    // userNameDisplay
    // userRoleBadge
    // userTurnoDisplay
    // foi removida para que "Seu turno" e
    // "Perfil: Professor" não sejam preenchidos
    // automaticamente no Dashboard.
}

// ============================================================
// LOGOUT
// ============================================================

logoutBtn
    ?.addEventListener(
        'click',
        async () => {

            try {

                const result =
                    await logoutUser();

                if (
                    result?.success ===
                    false
                ) {

                    alert(
                        '❌ Não foi possível sair:\n' +
                        result.error
                    );

                    return;
                }

                currentUser =
                    null;

                currentUserRole =
                    null;

                currentTurma =
                    null;

                turmaSelecionada =
                    null;

                turmasDisponiveis =
                    [];

                ultimaSessaoPreparada =
                    null;

                loginIniciadoManualmente =
                    false;

                localStorage.removeItem(
                    'turmaAtual'
                );

                mostrarSomenteLogin();

            } catch (error) {

                console.error(
                    'Erro ao sair:',
                    error
                );
            }
        }
    );

// ============================================================
// NAVEGAÇÃO
// ============================================================

window.showTab =
    function (
        tabName
    ) {

        if (
            tabName ===
            'turmas' &&
            currentUserRole !==
            'professor'
        ) {

            return;
        }

        if (
            tabName ===
            'turmas'
        ) {

            garantirAbaTurmasProfessor();
        }

        document
            .querySelectorAll(
                '.sidebar-item'
            )
            .forEach(
                item => {

                    item.classList.toggle(
                        'active',
                        item.dataset.tab ===
                        tabName
                    );
                }
            );

        if (
            window.innerWidth <=
            900
        ) {

            closeSidebar();
        }

        document
            .querySelectorAll(
                '.tab-content'
            )
            .forEach(
                tab => {

                    tab.classList.remove(
                        'active'
                    );
                }
            );

        const id =
            'tab' +
            tabName
                .charAt(0)
                .toUpperCase() +
            tabName.slice(1);

        const target =
            document.getElementById(
                id
            );

        if (!target) {

            console.warn(
                `A aba ${id} não existe no HTML.`
            );

            return;
        }

        target.classList.add(
            'active'
        );

        const title =
            document.querySelector(
                '.page-title h1'
            );

        const subtitle =
            document.querySelector(
                '.page-title p'
            );

        const nomes = {

            dashboard:
                'Dashboard',

            materiais:
                'Materiais',

            moinho:
                'Moinho',

            historico:
                'Histórico',

            turmas:
                'Turmas',

            perfil:
                'Meu Perfil',

            configuracoes:
                'Configurações'
        };

        const subtitulos = {

            dashboard:
                'Visão geral do gerenciamento de plástico',

            materiais:
                'Gerenciamento de materiais',

            moinho:
                'Controle do moinho',

            historico:
                'Histórico de acessos',

            turmas:
                'Selecione e gerencie as turmas vinculadas',

            perfil:
                'Informações da sua conta e seus últimos acessos',

            configuracoes:
                'Configurações da aparência e da sua conta'
        };

        if (title) {

            title.textContent =
                nomes[tabName] ||
                'Dashboard';
        }

        if (subtitle) {

            subtitle.textContent =
                subtitulos[tabName] ||
                'Gerenciamento de plástico';
        }

        if (
            tabName ===
            'turmas'
        ) {

            renderTurmasPagina();
        }

        if (
            tabName ===
            'perfil' &&
            currentUser
        ) {

            try {

                setMeuPerfilData(
                    currentUser,
                    currentUserRole,
                    isUsingLocalData
                );

                renderMeuPerfil();

            } catch (error) {

                console.error(
                    'Erro ao renderizar perfil:',
                    error
                );
            }
        }
    };

    // ============================================================
// SIDEBAR MOBILE
// ============================================================

function openSidebar() {

    if (!sidebar) {
        return;
    }

    sidebar.classList.add(
        'open'
    );

    sidebarOverlay?.classList.add(
        'active'
    );

    document.body.classList.add(
        'sidebar-open'
    );

    mobileMenuBtn?.setAttribute(
        'aria-expanded',
        'true'
    );
}

function closeSidebar() {

    if (sidebar) {

        sidebar.classList.remove(
            'open'
        );
    }

    sidebarOverlay?.classList.remove(
        'active'
    );

    document.body.classList.remove(
        'sidebar-open'
    );

    mobileMenuBtn?.setAttribute(
        'aria-expanded',
        'false'
    );
}

function toggleSidebarMenu() {

    if (
        sidebar?.classList.contains(
            'open'
        )
    ) {

        closeSidebar();

    } else {

        openSidebar();
    }
}

window.toggleSidebar =
    toggleSidebarMenu;

window.openSidebar =
    openSidebar;

window.closeSidebar =
    closeSidebar;

mobileMenuBtn
    ?.addEventListener(
        'click',
        event => {

            event.preventDefault();
            event.stopPropagation();

            toggleSidebarMenu();
        }
    );

sidebarOverlay
    ?.addEventListener(
        'click',
        closeSidebar
    );

document.addEventListener(
    'keydown',
    event => {

        if (
            event.key ===
            'Escape'
        ) {

            closeSidebar();
        }
    }
);

// ============================================================
// VOLTAR DA SELEÇÃO
// ============================================================

async function voltarDaSelecaoTurma(event) {

    if (event) {

        event.preventDefault();
        event.stopPropagation();
    }

    console.log(
        '↩️ Botão Voltar pressionado.'
    );

    if (!currentUser) {

        mostrarSomenteLogin();

        return;
    }

    if (
        currentUserRole ===
        'professor'
    ) {

        console.log(
            '↩️ Professor voltando para Turmas.'
        );

        const gate =
            document.getElementById(
                'turmaGate'
            );

        if (gate) {

            gate.style.display =
                'none';
        }

        turmaSelecionada =
            null;

        garantirAbaTurmasProfessor();

        atualizarVisibilidadeTurmas();

        mostrarApp();

        window.showTab(
            'turmas'
        );

        await renderTurmasPagina();

        return;
    }

    if (
        currentUserRole ===
        'aluno'
    ) {

        console.log(
            '↩️ Aluno voltando para o login.'
        );

        try {

            const result =
                await logoutUser();

            if (
                result?.success ===
                false
            ) {

                alert(
                    '❌ Não foi possível voltar para o login:\n' +
                    result.error
                );

                return;
            }

        } catch (error) {

            console.error(
                'Erro ao voltar para o login:',
                error
            );
        }

        currentUser =
            null;

        currentUserRole =
            null;

        currentTurma =
            null;

        turmaSelecionada =
            null;

        turmasDisponiveis =
            [];

        ultimaSessaoPreparada =
            null;

        loginIniciadoManualmente =
            false;

        localStorage.removeItem(
            'turmaAtual'
        );

        localStorage.removeItem(
            'turmaAtualId'
        );

        localStorage.removeItem(
            'turmaAtualNome'
        );

        localStorage.removeItem(
            'turmaAtualCodigo'
        );

        window.senaiTurmaAtualId =
            null;

        mostrarSomenteLogin();

        return;
    }

    mostrarSomenteLogin();
}

// ============================================================
// BOTÕES DE VOLTAR
// ============================================================

document.addEventListener(
    'click',
    event => {

        const btn =
            event.target.closest(
                '#btnVoltarTurma, #btnVoltarLoginTurma'
            );

        if (!btn) {
            return;
        }

        voltarDaSelecaoTurma(
            event
        );
    }
);

// ============================================================
// TEMA
// ============================================================

window.toggleTheme =
    function () {

        document.body.classList.add(
            'dark-mode'
        );

        localStorage.setItem(
            'tema',
            'escuro'
        );
    };

document.body.classList.add(
    'dark-mode'
);

localStorage.setItem(
    'tema',
    'escuro'
);

// ============================================================
// MODAIS
// ============================================================

function fecharTodosModais() {

    [
        editModal,
        removeModal,
        cadastrarProfModal,
        cadastrarAlunoModal,
        esqueciSenhaModal,
        gerenciarAlunosModal,
        gerenciarProfessoresModal,
        criarTurmaModal
    ]
    .forEach(
        modal => {

            if (modal) {

                modal.style.display =
                    'none';
            }
        }
    );
}

// ============================================================
// FECHAR MODAIS PELOS BOTÕES
// ============================================================

document
    .querySelectorAll(
        `
        .close-modal,
        .close-remove-modal,
        .close-gerenciar-alunos,
        .close-gerenciar-profs
        `
    )
    .forEach(
        btn => {

            btn.addEventListener(
                'click',
                fecharTodosModais
            );
        }
    );

// ============================================================
// CANCELAR MODAL EDITAR
// ============================================================

document
    .getElementById(
        'cancelModalBtn'
    )
    ?.addEventListener(
        'click',
        () => {

            if (editModal) {

                editModal.style.display =
                    'none';
            }
        }
    );

// ============================================================
// CANCELAR MODAL REMOVER
// ============================================================

document
    .getElementById(
        'cancelRemoveModal'
    )
    ?.addEventListener(
        'click',
        () => {

            if (removeModal) {

                removeModal.style.display =
                    'none';
            }
        }
    );

// ============================================================
// FECHAR AO CLICAR FORA
// ============================================================

window.addEventListener(
    'click',
    event => {

        [
            editModal,
            removeModal,
            cadastrarProfModal,
            cadastrarAlunoModal,
            esqueciSenhaModal,
            gerenciarAlunosModal,
            gerenciarProfessoresModal,
            criarTurmaModal
        ]
        .forEach(
            modal => {

                if (
                    modal &&
                    event.target ===
                    modal
                ) {

                    modal.style.display =
                        'none';
                }
            }
        );
    }
);

// ============================================================
// EXCLUIR CONTA
// ============================================================

document.addEventListener(
    'click',
    async event => {

        const btn =
            event.target.closest(
                '#btnExcluirMinhaConta'
            );

        if (!btn) {
            return;
        }

        if (!currentUser) {

            alert(
                '⚠️ Nenhum usuário conectado.'
            );

            return;
        }

        const confirmou =
            confirm(
                '⚠️ Tem certeza que deseja excluir sua conta?\n\n' +
                'Essa ação removerá seus dados do sistema e não poderá ser desfeita.'
            );

        if (!confirmou) {
            return;
        }

        try {

            btn.disabled =
                true;

            btn.innerHTML =
                '<i class="fas fa-spinner fa-spin"></i> Excluindo...';

            const result =
                await excluirMinhaConta();

            if (
                !result?.success
            ) {

                alert(
                    '❌ Não foi possível excluir sua conta:\n\n' +
                    (
                        result?.error ||
                        'Erro desconhecido.'
                    )
                );

                return;
            }

            alert(
                '✅ Sua conta foi excluída com sucesso.'
            );

            currentUser =
                null;

            currentUserRole =
                null;

            currentTurma =
                null;

            turmaSelecionada =
                null;

            turmasDisponiveis =
                [];

            ultimaSessaoPreparada =
                null;

            loginIniciadoManualmente =
                false;

            mostrarSomenteLogin();

        } catch (error) {

            console.error(
                'Erro excluindo conta:',
                error
            );

            alert(
                '❌ Erro ao excluir conta:\n\n' +
                error.message
            );

        } finally {

            btn.disabled =
                false;

            btn.innerHTML =
                '<i class="fas fa-trash"></i> Excluir minha conta';
        }
    }
);

// ============================================================
// OBSERVAR AUTENTICAÇÃO
// ============================================================

onAuthStateChange(
    async state => {

        console.log(
            'Estado de autenticação:',
            state
        );

        if (
            state?.isLoggedIn
        ) {

            if (
                !loginIniciadoManualmente
            ) {

                console.log(
                    '⚠️ Sessão antiga detectada. Voltando ao login.'
                );

                try {

                    await logoutUser();

                } catch (error) {

                    console.error(
                        'Erro limpando sessão antiga:',
                        error
                    );
                }

                currentUser =
                    null;

                currentUserRole =
                    null;

                currentTurma =
                    null;

                turmaSelecionada =
                    null;

                turmasDisponiveis =
                    [];

                ultimaSessaoPreparada =
                    null;

                mostrarSomenteLogin();

                return;
            }

            if (
                state.extraInfo
            ) {

                userExtraInfo.nome =
                    state.extraInfo.nome ||
                    '';

                userExtraInfo.turno =
                    state.extraInfo.turno ||
                    '';

                userExtraInfo.professoresVinculados =
                    state.extraInfo.professoresVinculados ||
                    [];

                userExtraInfo.historicoLogins =
                    state.extraInfo.historicoLogins ||
                    [];

                userExtraInfo.dataHoraLogin =
                    state.extraInfo.dataHoraLogin ||
                    null;

                userExtraInfo.turmasVinculadas =
                    state.extraInfo.turmasVinculadas ||
                    {};

                userExtraInfo.turmaAtualId =
                    state.extraInfo.turmaAtualId ||
                    null;

                userExtraInfo.turmaAtualNome =
                    state.extraInfo.turmaAtualNome ||
                    '';

                userExtraInfo.turmaAtualCodigo =
                    state.extraInfo.turmaAtualCodigo ||
                    '';
            }

            await prepararPosLogin(
                state.user,
                state.role
            );

            return;
        }

        currentUser =
            null;

        currentUserRole =
            null;

        currentTurma =
            null;

        turmaSelecionada =
            null;

        turmasDisponiveis =
            [];

        ultimaSessaoPreparada =
            null;

        loginIniciadoManualmente =
            false;

        localStorage.removeItem(
            'turmaAtual'
        );

        localStorage.removeItem(
            'turmaAtualId'
        );

        localStorage.removeItem(
            'turmaAtualNome'
        );

        localStorage.removeItem(
            'turmaAtualCodigo'
        );

        mostrarSomenteLogin();
    }
);

// ============================================================
// RESPONSIVIDADE
// ============================================================

window.addEventListener(
    'resize',
    () => {

        if (
            window.innerWidth >
            900
        ) {

            closeSidebar();
        }
    }
);

// ============================================================
// INÍCIO
// ============================================================

mostrarSomenteLogin();

console.log(
    '🚀 SENAI Plásticos iniciado!'
);