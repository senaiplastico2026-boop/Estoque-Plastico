// ============================================================
// ALUNO.JS
// SENAI PLÁSTICOS
// ============================================================

import {
    saveUserExtraInfo,
    userExtraInfo,
    isOnline,
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
// BUSCAR TURMA ATUAL
// ============================================================

async function carregarTurmaAtual() {

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
            'Erro ao carregar turma do aluno:',
            error
        );

        return null;
    }
}


// ============================================================
// RENDERIZAR ALUNO
// ============================================================

export async function renderAluno() {

    const container =
        document.getElementById(
            'tabPerfil'
        );

    if (!container) {
        return;
    }


    // ========================================================
    // DADOS
    // ========================================================

    const nome =
        userExtraInfo?.nome ||
        currentUserGlobal?.email
            ?.split('@')[0] ||
        'Aluno';

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


    const professoresVinculados =
        Array.isArray(
            userExtraInfo?.professoresVinculados
        )
            ? userExtraInfo.professoresVinculados
            : [];


    // ========================================================
    // TURMA ATUAL
    // ========================================================

    const turmaAtual =
        await carregarTurmaAtual();


    const turmaNome =
        turmaAtual?.nome ||
        userExtraInfo?.turmaAtualNome ||
        'Nenhuma turma selecionada';


    const turmaCodigo =
        turmaAtual?.codigo ||
        userExtraInfo?.turmaAtualCodigo ||
        '------';


    // ========================================================
    // PROFESSORES DA TURMA
    // ========================================================

    let professoresTurma =
        [];


    if (
        turmaAtual?.professores
    ) {

        professoresTurma =
            Object.values(
                turmaAtual.professores
            );
    }


    // Caso a turma ainda não tenha
    // os professores estruturados,
    // usa os dados salvos do aluno.

    if (
        professoresTurma.length === 0
    ) {

        professoresTurma =
            professoresVinculados
                .map(
                    professor => ({
                        nome:
                            typeof professor === 'string'
                                ? professor
                                : professor?.nome,

                        email:
                            typeof professor === 'object'
                                ? professor?.email
                                : ''
                    })
                );
    }


    // ========================================================
    // CLASSE DO TURNO
    // ========================================================

    const turnoClass =
        turno === 'Manhã'
            ? 'manha'
            : turno === 'Tarde'
                ? 'tarde'
                : 'noite';


    // ========================================================
    // ÚLTIMOS 10 LOGINS
    // ========================================================

    const ultimosLogins =
        historicoLogins
            .slice(-10)
            .reverse();


    let historicoHTML =
        '';


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

                                    ${escapeHTML(
                                        data
                                    )}

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
    // PROFESSORES HTML
    // ========================================================

    let professoresHTML =
        '';


    if (
        professoresTurma.length > 0
    ) {

        professoresHTML =
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

    } else {

        professoresHTML = `

            <div class="profile-empty-message">

                <i class="fas fa-user-tie"></i>

                <span>

                    Nenhum professor vinculado à turma.

                </span>

            </div>

        `;
    }


    // ========================================================
    // HTML PRINCIPAL
    // ========================================================

    container.innerHTML = `

        <div class="profile-page">


            <!-- =================================================
                 CABEÇALHO
            ================================================== -->

            <div class="profile-header-card">


                <div class="profile-avatar">

                    <i class="fas fa-user-graduate"></i>

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

                            <i class="fas fa-user-graduate"></i>

                            Aluno

                        </span>


                        <span class="profile-badge shift">

                            <i class="fas fa-clock"></i>

                            ${escapeHTML(
                                turno
                            )}

                        </span>


                        <span class="profile-badge active">

                            <i class="fas fa-circle"></i>

                            ${
                                isOnline
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

                        Minha turma

                    </span>

                </div>


                <div class="profile-class-content">


                    <div class="profile-class-main">

                        <span class="profile-info-label">

                            TURMA ATUAL

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

                            ${escapeHTML(
                                turmaCodigo
                            )}

                        </strong>

                    </div>


                </div>


                <div class="profile-class-description">

                    <i class="fas fa-circle-info"></i>

                    <span>

                        Sua conta está vinculada a esta turma.
                        Os dados cadastrados no sistema são
                        compartilhados com os professores
                        vinculados à turma.

                    </span>

                </div>


            </div>



            <!-- =================================================
                 INFORMAÇÕES
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

                                ${escapeHTML(
                                    nome
                                )}

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

                                ${escapeHTML(
                                    email
                                )}

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

                                ${escapeHTML(
                                    turno
                                )}

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

                                        ${
                                            isOnline
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
                     ATUALIZAR DADOS
                ================================================== -->

                <div class="profile-edit-area">


                    <div class="profile-section-title">

                        <i class="fas fa-pen"></i>

                        <span>

                            Atualizar dados

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
                                    userExtraInfo?.nome ||
                                    ''
                                )}"
                                placeholder="Seu nome completo"
                            >


                        </div>


                        <div class="form-group">


                            <label>

                                <i class="fas fa-clock"></i>

                                Turno

                            </label>


                            <select
                                id="editTurnoInput"
                            >


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

                    <i class="fas fa-chalkboard-user"></i>

                    <span>

                        Professores da turma

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
                                'Não foi possível atualizar os dados.'
                            )
                        );

                        return;
                    }


                    userExtraInfo.nome =
                        nome;

                    userExtraInfo.turno =
                        novoTurno;


                    // --------------------------------------------
                    // ATUALIZAR HEADER
                    // --------------------------------------------

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

                        userNameDisplay.textContent =
                            nome;
                    }


                    if (userTurnoDisplay) {

                        userTurnoDisplay.textContent =
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
                        '✅ Dados atualizados com sucesso!'
                    );


                    await renderAluno();


                } catch (error) {

                    console.error(
                        'Erro ao atualizar aluno:',
                        error
                    );


                    alert(
                        '❌ Erro ao atualizar os dados:\n' +
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
}