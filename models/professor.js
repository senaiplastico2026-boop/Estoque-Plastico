// ============================================================
// PROFESSOR.JS
// SENAI PLÁSTICOS
// ============================================================

import {
    saveUserExtraInfo,
    userExtraInfo,
    isOnline,
    removerUsuario,
    listarProfessores,
    listarAlunosDaTurma,
    obterTurmaAtual
} from '../auth.js';


// ============================================================
// VARIÁVEIS
// ============================================================

let currentUserGlobal = null;
let isUsingLocalData = false;


// ============================================================
// RECEBER DADOS DO USUÁRIO
// ============================================================

export function setUserData(
    user,
    localFlag = false
) {

    currentUserGlobal =
        user;

    isUsingLocalData =
        localFlag || false;
}


// ============================================================
// ESCAPAR HTML
// Evita inserir caracteres especiais diretamente no HTML.
// ============================================================

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return '';
    }

    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}


// ============================================================
// OBTER TURMA ATUAL
// ============================================================

async function obterTurmaProfessorAtual() {

    const turmaId =
        userExtraInfo?.turmaAtualId ||
        null;

    if (!turmaId) {
        return null;
    }

    try {

        const turma =
            await obterTurmaAtual(
                turmaId
            );

        return turma || null;

    } catch (error) {

        console.error(
            'Erro ao buscar turma atual:',
            error
        );

        return null;
    }
}


// ============================================================
// RENDERIZAR PROFESSOR
// ============================================================

export async function renderProfessor() {

    const container =
        document.getElementById(
            'tabPerfil'
        );

    if (!container) {
        return;
    }


    // ========================================================
    // DADOS DO PROFESSOR
    // ========================================================

    const nome =
        userExtraInfo?.nome ||
        currentUserGlobal?.email
            ?.split('@')[0] ||
        'Professor';

    const email =
        currentUserGlobal?.email ||
        'Não informado';

    const turno =
        userExtraInfo?.turno ||
        'Não definido';

    const historicoLogins =
        Array.isArray(
            userExtraInfo?.historicoLogins
        )
            ? userExtraInfo.historicoLogins
            : [];


    const turmaAtual =
        await obterTurmaProfessorAtual();


    const turmaNome =
        turmaAtual?.nome ||
        userExtraInfo?.turmaAtualNome ||
        'Nenhuma turma';

    const turmaCodigo =
        turmaAtual?.codigo ||
        userExtraInfo?.turmaAtualCodigo ||
        '------';


    const turnoClass =
        turno === 'Manhã'
            ? 'manha'
            : turno === 'Tarde'
                ? 'tarde'
                : 'noite';


    // ========================================================
    // HISTÓRICO DE LOGIN
    // ========================================================

    const ultimosLogins =
        historicoLogins
            .slice(-10)
            .reverse();


    let historicoHTML = '';


    if (
        ultimosLogins.length > 0
    ) {

        historicoHTML =
            ultimosLogins
                .map(
                    (login, index) => {

                        const data =
                            login?.data ||
                            'Data não informada';

                        return `
                            <div class="profile-login-item">

                                <div class="profile-login-left">

                                    <div class="profile-login-index">

                                        ${index + 1}

                                    </div>

                                    <div class="profile-login-icon">

                                        <i class="fas fa-right-to-bracket"></i>

                                    </div>

                                    <div class="profile-login-user">

                                        <strong>
                                            Acesso realizado
                                        </strong>

                                        <span>
                                            ${escapeHTML(
                                                login?.email ||
                                                email
                                            )}
                                        </span>

                                    </div>

                                </div>

                                <div class="profile-login-date">

                                    <i class="far fa-clock"></i>

                                    ${escapeHTML(data)}

                                </div>

                            </div>
                        `;
                    }
                )
                .join('');

    } else {

        historicoHTML = `
            <div class="profile-history-empty">

                <div class="profile-history-empty-icon">

                    <i class="fas fa-clock-rotate-left"></i>

                </div>

                <span>
                    Nenhum login registrado.
                </span>

            </div>
        `;
    }


    // ========================================================
    // PROFESSORES DA TURMA
    // ========================================================

    let professoresTurma = [];


    if (turmaAtual?.professores) {

        professoresTurma =
            Object.values(
                turmaAtual.professores
            );
    }


    // ========================================================
    // FALLBACK
    // ========================================================

    if (
        professoresTurma.length === 0
    ) {

        professoresTurma = [
            {
                uid:
                    currentUserGlobal?.uid,

                nome:
                    nome,

                email:
                    email
            }
        ];
    }


    // ========================================================
    // PROFESSORES HTML
    // ========================================================

    const professoresHTML =
        professoresTurma
            .map(
                professor => {

                    const profNome =
                        professor?.nome ||
                        professor?.email
                            ?.split('@')[0] ||
                        'Professor';

                    return `
                        <div class="profile-linked-item">

                            <i class="fas fa-user-tie"></i>

                            <span>
                                ${escapeHTML(
                                    profNome
                                )}
                            </span>

                        </div>
                    `;
                }
            )
            .join('');


    // ========================================================
    // HTML
    // ========================================================

    container.innerHTML = `

        <div class="profile-page">


            <!-- =================================================
                 CABEÇALHO
            ================================================== -->

            <div class="profile-header-card">


                <div class="profile-avatar">

                    <i class="fas fa-user-tie"></i>

                </div>


                <div class="profile-header-info">


                    <span class="profile-header-label">

                        MEU PERFIL

                    </span>


                    <h2>

                        ${escapeHTML(nome)}

                    </h2>


                    <p>

                        ${escapeHTML(email)}

                    </p>


                    <div class="profile-badges">


                        <span class="profile-badge role">

                            <i class="fas fa-chalkboard-user"></i>

                            Professor

                        </span>


                        <span class="profile-badge shift">

                            <i class="fas fa-clock"></i>

                            ${escapeHTML(turno)}

                        </span>


                        <span class="profile-badge active">

                            <i class="fas fa-circle"></i>

                            ${isOnline
                                ? 'Online'
                                : 'Offline'
                            }

                        </span>


                    </div>


                </div>

            </div>



            <!-- =================================================
                 TURMA ATUAL
            ================================================== -->

            <div class="profile-info-card profile-class-card">


                <div class="profile-section-title">

                    <i class="fas fa-users"></i>

                    <span>
                        Turma atual
                    </span>

                </div>


                <div class="profile-class-content">


                    <div class="profile-class-main">

                        <span class="profile-info-label">

                            TURMA

                        </span>


                        <strong>

                            ${escapeHTML(
                                turmaNome
                            )}

                        </strong>

                    </div>


                    <div class="profile-class-code">

                        <span>

                            CÓDIGO

                        </span>


                        <strong>

                            ${userExtraInfo?.role === 'professor' && turmaAtual?.id && turmaCodigo !== '------'
                                ? `<button type="button" class="codigo-turma-botao" data-codigo-turma="atual"
                                    aria-haspopup="dialog" aria-controls="modalCodigoTurma"
                                    aria-label="Exibir código da turma: ${escapeHTML(turmaCodigo)}">${escapeHTML(turmaCodigo)}</button>`
                                : escapeHTML(turmaCodigo)}

                        </strong>

                    </div>


                </div>


                <div class="profile-class-description">

                    <i class="fas fa-circle-info"></i>

                    <span>
                        Você está trabalhando dentro desta turma.
                        Os alunos e professores mostrados abaixo
                        pertencem a ela.
                    </span>

                </div>

            </div>



            <!-- =================================================
                 DADOS DO PROFESSOR
            ================================================== -->

            <div class="profile-info-card">


                <div class="profile-section-title">

                    <i class="fas fa-user"></i>

                    <span>
                        Informações da conta
                    </span>

                </div>


                <div class="profile-info-grid">


                    <!-- NOME -->

                    <div class="profile-info-item">


                        <div class="profile-info-icon">

                            <i class="fas fa-user"></i>

                        </div>


                        <div class="profile-info-content">

                            <span class="profile-info-label">

                                NOME

                            </span>


                            <span class="profile-info-value">

                                ${escapeHTML(nome)}

                            </span>

                        </div>


                    </div>



                    <!-- EMAIL -->

                    <div class="profile-info-item">


                        <div class="profile-info-icon">

                            <i class="fas fa-envelope"></i>

                        </div>


                        <div class="profile-info-content">

                            <span class="profile-info-label">

                                E-MAIL

                            </span>


                            <span class="profile-info-value">

                                ${escapeHTML(email)}

                            </span>

                        </div>


                    </div>



                    <!-- TURNO -->

                    <div class="profile-info-item">


                        <div class="profile-info-icon">

                            <i class="fas fa-clock"></i>

                        </div>


                        <div class="profile-info-content">

                            <span class="profile-info-label">

                                TURNO

                            </span>


                            <span class="profile-info-value">

                                ${escapeHTML(turno)}

                            </span>

                        </div>


                    </div>



                    <!-- STATUS -->

                    <div class="profile-info-item">


                        <div class="profile-info-icon">

                            <i class="fas fa-wifi"></i>

                        </div>


                        <div class="profile-info-content">

                            <span class="profile-info-label">

                                STATUS

                            </span>


                            <span class="profile-info-value">

                                <span class="profile-status">

                                    <span class="profile-status-dot"></span>

                                    <span class="profile-status-text">

                                        ${isOnline
                                            ? 'Online'
                                            : 'Offline'
                                        }

                                    </span>

                                </span>

                            </span>

                        </div>


                    </div>


                </div>


                <!-- =================================================
                     EDITAR PERFIL
                ================================================== -->

                <div class="profile-edit-area">


                    <div class="profile-section-title">

                        <i class="fas fa-pen"></i>

                        <span>
                            Editar informações
                        </span>

                    </div>


                    <div class="profile-edit-grid">


                        <div class="form-group">

                            <label>

                                <i class="fas fa-user"></i>

                                Nome

                            </label>


                            <input
                                type="text"
                                id="editNomeInput"
                                value="${escapeHTML(
                                    userExtraInfo?.nome || ''
                                )}"
                                placeholder="Seu nome completo"
                            >

                        </div>


                        <div class="form-group">

                            <label>

                                <i class="fas fa-clock"></i>

                                Turno

                            </label>


                            <select id="editTurnoInput">


                                <option
                                    value="Manhã"
                                    ${
                                        turno === 'Manhã'
                                            ? 'selected'
                                            : ''
                                    }
                                >
                                    🌅 Manhã
                                </option>


                                <option
                                    value="Tarde"
                                    ${
                                        turno === 'Tarde'
                                            ? 'selected'
                                            : ''
                                    }
                                >
                                    ☀️ Tarde
                                </option>


                                <option
                                    value="Noite"
                                    ${
                                        turno === 'Noite'
                                            ? 'selected'
                                            : ''
                                    }
                                >
                                    🌙 Noite
                                </option>


                            </select>

                        </div>


                    </div>


                    <button
                        id="btnAtualizarPerfil"
                        type="button"
                        class="btn-primary profile-save-btn"
                    >

                        <i class="fas fa-save"></i>

                        Salvar alterações

                    </button>


                </div>


            </div>



            <!-- =================================================
                 PROFESSORES DA TURMA
            ================================================== -->

            <div class="profile-info-card">


                <div class="profile-section-title">

                    <i class="fas fa-user-tie"></i>

                    <span>
                        Professores vinculados à turma
                    </span>

                </div>


                <div class="profile-linked-list">

                    ${professoresHTML}

                </div>


            </div>



            <!-- =================================================
                 HISTÓRICO DE LOGINS
            ================================================== -->

            <div class="profile-history-card">


                <div class="profile-history-header">


                    <div class="profile-history-title">


                        <div class="profile-history-title-icon">

                            <i class="fas fa-clock-rotate-left"></i>

                        </div>


                        <div>

                            <h3>

                                Histórico de Logins

                            </h3>


                            <span>

                                Últimos acessos desta conta

                            </span>

                        </div>


                    </div>


                    <div class="profile-history-count">

                        ${ultimosLogins.length}

                    </div>


                </div>


                <div class="profile-login-list">

                    ${historicoHTML}

                </div>


                <div class="profile-current-login">


                    <i class="fas fa-circle"></i>


                    <span>

                        Esta conta está atualmente conectada.

                    </span>


                </div>


            </div>



            <!-- =================================================
                 GERENCIAMENTO DA TURMA
            ================================================== -->

            <div class="profile-info-card">


                <div class="profile-section-title">

                    <i class="fas fa-user-cog"></i>

                    <span>
                        Gerenciamento da turma
                    </span>

                </div>


                <p class="profile-management-description">

                    Como você está conectado à turma,
                    pode consultar e gerenciar os alunos
                    pertencentes a ela.

                </p>


                <div class="profile-management-actions">


                    <button
                        id="btnGerenciarAlunos"
                        type="button"
                        class="btn-primary btn-small-action"
                    >

                        <i class="fas fa-user-graduate"></i>

                        Alunos da turma

                    </button>


                    <button
                        id="btnGerenciarProfessores"
                        type="button"
                        class="btn-secondary-profile btn-small-action"
                    >

                        <i class="fas fa-users"></i>

                        Professores da turma

                    </button>


                </div>


            </div>


        </div>
    `;


    // ========================================================
    // ATUALIZAR PERFIL
    // ========================================================

    document
        .getElementById(
            'btnAtualizarPerfil'
        )
        ?.addEventListener(
            'click',
            async () => {

                const nomeInput =
                    document.getElementById(
                        'editNomeInput'
                    );

                const turnoInput =
                    document.getElementById(
                        'editTurnoInput'
                    );

                const nome =
                    nomeInput
                        ?.value
                        .trim();

                const novoTurno =
                    turnoInput?.value ||
                    '';

                if (!nome) {

                    alert(
                        '⚠️ Informe seu nome.'
                    );

                    return;
                }


                const btn =
                    document.getElementById(
                        'btnAtualizarPerfil'
                    );


                if (btn) {

                    btn.disabled =
                        true;

                    btn.innerHTML =
                        '<i class="fas fa-spinner fa-spin"></i> Salvando...';
                }


                try {

                    const result =
                        await saveUserExtraInfo(
                            currentUserGlobal.uid,
                            {
                                nome,
                                turno: novoTurno
                            }
                        );


                    if (
                        result &&
                        result.success === false
                    ) {

                        alert(
                            '❌ ' +
                            (
                                result.error ||
                                'Não foi possível atualizar o perfil.'
                            )
                        );

                        return;
                    }


                    userExtraInfo.nome =
                        nome;

                    userExtraInfo.turno =
                        novoTurno;


                    const userNameDisplay =
                        document.getElementById(
                            'userNameDisplay'
                        );

                    const userTurnoDisplay =
                        document.getElementById(
                            'userTurnoDisplay'
                        );

                    const headerUserName =
                        document.getElementById(
                            'headerUserName'
                        );

                    const sidebarUserName =
                        document.getElementById(
                            'sidebarUserName'
                        );


                    if (userNameDisplay) {

                        userNameDisplay.innerText =
                            nome;
                    }


                    if (userTurnoDisplay) {

                        userTurnoDisplay.innerText =
                            novoTurno
                                ? `Turno: ${novoTurno}`
                                : '';
                    }


                    if (headerUserName) {

                        headerUserName.textContent =
                            nome;
                    }


                    if (sidebarUserName) {

                        sidebarUserName.textContent =
                            nome;
                    }


                    alert(
                        '✅ Perfil atualizado com sucesso!'
                    );


                    await renderProfessor();

                } catch (error) {

                    console.error(
                        'Erro ao atualizar perfil:',
                        error
                    );

                    alert(
                        '❌ Erro ao atualizar perfil:\n' +
                        error.message
                    );

                } finally {

                    if (btn) {

                        btn.disabled =
                            false;

                        btn.innerHTML =
                            '<i class="fas fa-save"></i> Salvar alterações';
                    }
                }

            }
        );


    // ========================================================
    // GERENCIAR ALUNOS
    // ========================================================

    document
        .getElementById(
            'btnGerenciarAlunos'
        )
        ?.addEventListener(
            'click',
            async () => {

                const modal =
                    document.getElementById(
                        'gerenciarAlunosModal'
                    );

                if (modal) {

                    modal.style.display =
                        'block';
                }

                await carregarListaAlunosProfessor();

            }
        );


    // ========================================================
    // GERENCIAR PROFESSORES
    // ========================================================

    document
        .getElementById(
            'btnGerenciarProfessores'
        )
        ?.addEventListener(
            'click',
            async () => {

                const modal =
                    document.getElementById(
                        'gerenciarProfessoresModal'
                    );

                if (modal) {

                    modal.style.display =
                        'block';
                }

                await carregarListaProfessores();

            }
        );
}


// ============================================================
// LISTAR ALUNOS DA TURMA ATUAL
// ============================================================

async function carregarListaAlunosProfessor() {

    const container =
        document.getElementById(
            'listaAlunosContainer'
        );

    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="modal-loading">

            <i class="fas fa-spinner fa-spin"></i>

            Carregando alunos da turma...

        </div>

    `;


    const turmaId =
        userExtraInfo?.turmaAtualId ||
        null;


    if (!turmaId) {

        container.innerHTML = `

            <div class="modal-empty">

                <i class="fas fa-users-slash"></i>

                <strong>
                    Nenhuma turma atual
                </strong>

                <span>
                    Entre em uma turma antes de gerenciar os alunos.
                </span>

            </div>

        `;

        return;
    }


    try {

        const alunos =
            await listarAlunosDaTurma(
                turmaId
            );


        if (
            !alunos ||
            alunos.length === 0
        ) {

            container.innerHTML = `

                <div class="modal-empty">

                    <i class="fas fa-user-graduate"></i>

                    <strong>
                        Nenhum aluno na turma
                    </strong>

                    <span>
                        Ainda não há alunos vinculados a esta turma.
                    </span>

                </div>

            `;

            return;
        }


        let html = `

            <div class="user-list-header">

                <div>

                    <strong>
                        Alunos da turma
                    </strong>

                    <span>
                        ${alunos.length} aluno(s)
                    </span>

                </div>

            </div>

        `;


        alunos.forEach(
            aluno => {

                const alunoNome =
                    aluno?.nome ||
                    aluno?.email
                        ?.split('@')[0] ||
                    'Aluno';

                const alunoEmail =
                    aluno?.email ||
                    'Sem email';

                const alunoTurno =
                    aluno?.turno ||
                    'Não informado';


                html += `

                    <div class="user-list-item">

                        <div class="user-list-avatar aluno">

                            <i class="fas fa-user-graduate"></i>

                        </div>


                        <div class="user-info">

                            <span class="name">

                                ${escapeHTML(
                                    alunoNome
                                )}

                            </span>


                            <span class="email">

                                ${escapeHTML(
                                    alunoEmail
                                )}

                                ${
                                    alunoTurno
                                        ? ` · Turno: ${escapeHTML(alunoTurno)}`
                                        : ''
                                }

                            </span>

                        </div>


                        <div class="user-actions">

                            <button
                                type="button"
                                class="btn-danger btn-small-action remover-aluno"
                                data-uid="${escapeHTML(
                                    aluno.uid ||
                                    aluno.id ||
                                    ''
                                )}"
                                data-nome="${escapeHTML(
                                    alunoNome
                                )}"
                            >

                                <i class="fas fa-trash"></i>

                                Remover

                            </button>

                        </div>

                    </div>

                `;
            }
        );


        container.innerHTML =
            html;


        // ====================================================
        // REMOVER ALUNO
        // ====================================================

        container
            .querySelectorAll(
                '.remover-aluno'
            )
            .forEach(
                btn => {

                    btn.addEventListener(
                        'click',
                        async () => {

                            const uid =
                                btn.dataset.uid;

                            const nome =
                                btn.dataset.nome;


                            if (!uid) {

                                alert(
                                    '❌ UID do aluno não encontrado.'
                                );

                                return;
                            }


                            const confirmar =
                                confirm(
                                    `Remover o aluno "${nome}" permanentemente?`
                                );


                            if (!confirmar) {
                                return;
                            }


                            btn.disabled =
                                true;

                            btn.innerHTML =
                                '<i class="fas fa-spinner fa-spin"></i>';


                            try {

                                const result =
                                    await removerUsuario(
                                        uid
                                    );


                                if (
                                    result &&
                                    result.success
                                ) {

                                    alert(
                                        `✅ Aluno "${nome}" removido!`
                                    );

                                    await carregarListaAlunosProfessor();

                                } else {

                                    alert(
                                        '❌ ' +
                                        (
                                            result?.error ||
                                            'Não foi possível remover o aluno.'
                                        )
                                    );
                                }

                            } catch (error) {

                                console.error(
                                    'Erro ao remover aluno:',
                                    error
                                );

                                alert(
                                    '❌ Erro ao remover aluno:\n' +
                                    error.message
                                );

                            } finally {

                                btn.disabled =
                                    false;

                                btn.innerHTML =
                                    '<i class="fas fa-trash"></i> Remover';
                            }

                        }
                    );
                }
            );


    } catch (error) {

        console.error(
            'Erro ao carregar alunos da turma:',
            error
        );


        container.innerHTML = `

            <div class="modal-error">

                <i class="fas fa-circle-exclamation"></i>

                <strong>
                    Erro ao carregar alunos
                </strong>

                <span>
                    ${escapeHTML(
                        error.message
                    )}
                </span>

            </div>

        `;
    }
}


// ============================================================
// LISTAR PROFESSORES DA TURMA ATUAL
// ============================================================

async function carregarListaProfessores() {

    const container =
        document.getElementById(
            'listaProfessoresContainer'
        );

    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="modal-loading">

            <i class="fas fa-spinner fa-spin"></i>

            Carregando professores...

        </div>

    `;


    try {

        const turmaAtual =
            await obterTurmaProfessorAtual();


        let professores =
            [];


        if (
            turmaAtual?.professores
        ) {

            professores =
                Object.values(
                    turmaAtual.professores
                );

        }


        // ====================================================
        // FALLBACK
        // ====================================================

        if (
            professores.length === 0
        ) {

            professores =
                await listarProfessores();
        }


        if (
            !professores ||
            professores.length === 0
        ) {

            container.innerHTML = `

                <div class="modal-empty">

                    <i class="fas fa-user-tie"></i>

                    <strong>
                        Nenhum professor encontrado
                    </strong>

                    <span>
                        Não existem professores vinculados a esta turma.
                    </span>

                </div>

            `;

            return;
        }


        let html = `

            <div class="user-list-header">

                <div>

                    <strong>
                        Professores da turma
                    </strong>

                    <span>
                        ${professores.length} professor(es)
                    </span>

                </div>

            </div>

        `;


        professores.forEach(
            professor => {

                const profNome =
                    professor?.nome ||
                    professor?.email
                        ?.split('@')[0] ||
                    'Professor';

                const profEmail =
                    professor?.email ||
                    'Sem email';

                const ehUsuarioAtual =
                    professor?.uid ===
                    currentUserGlobal?.uid;


                html += `

                    <div class="user-list-item">

                        <div class="user-list-avatar professor">

                            <i class="fas fa-user-tie"></i>

                        </div>


                        <div class="user-info">

                            <span class="name">

                                ${escapeHTML(
                                    profNome
                                )}

                            </span>


                            <span class="email">

                                ${escapeHTML(
                                    profEmail
                                )}

                                ${
                                    ehUsuarioAtual
                                        ? ' · Você'
                                        : ''
                                }

                            </span>

                        </div>


                        <div class="user-actions">

                            ${
                                ehUsuarioAtual

                                    ? `

                                        <span class="current-user-label">

                                            <i class="fas fa-circle"></i>

                                            Conta atual

                                        </span>

                                    `

                                    : ''
                            }

                        </div>

                    </div>

                `;
            }
        );


        container.innerHTML =
            html;


    } catch (error) {

        console.error(
            'Erro ao carregar professores:',
            error
        );


        container.innerHTML = `

            <div class="modal-error">

                <i class="fas fa-circle-exclamation"></i>

                <strong>
                    Erro ao carregar professores
                </strong>

                <span>
                    ${escapeHTML(
                        error.message
                    )}
                </span>

            </div>

        `;
    }
}