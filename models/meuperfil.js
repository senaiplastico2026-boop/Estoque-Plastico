// ============================================================
// MEU PERFIL.JS
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
let currentUserRole = null;
let isUsingLocalData = false;


// ============================================================
// RECEBER DADOS DO USUÁRIO
// ============================================================

export function setUserData(
    user,
    role,
    localFlag = false
) {

    currentUserGlobal =
        user; 

    currentUserRole =
        role;

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
// TURMA ATUAL
// ============================================================

async function carregarTurmaAtual() {

    const turmaId =
        window.senaiTurmaAtualId ||
        userExtraInfo?.turmaAtualId ||
        localStorage.getItem('turmaAtualId') ||
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
            'Erro ao carregar turma atual:',
            error
        );

        return null;
    }
}


// ============================================================
// RENDERIZAR MEU PERFIL
// ============================================================

export async function renderMeuPerfil() {

    const container =
        document.getElementById(
            'tabPerfil'
        );

    if (!container) {
        return;
    }


    try {

        // ====================================================
        // DADOS DO USUÁRIO
        // ====================================================

        const nome =
            userExtraInfo?.nome ||
            currentUserGlobal?.email
                ?.split('@')[0] ||
            'Usuário';


        const email =
            currentUserGlobal?.email ||
            'Não informado';


        // ====================================================
        // HISTÓRICO DE LOGINS
        // ====================================================

        const historicoLogins =
            Array.isArray(
                userExtraInfo?.historicoLogins
            )
                ? userExtraInfo.historicoLogins
                : [];


        const ultimosLogins =
            historicoLogins
                .slice(-10)
                .reverse();


        // ====================================================
        // TURMA
        // ====================================================

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


        // ====================================================
        // PROFESSORES DA TURMA
        // ====================================================

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
        // FALLBACK DOS PROFESSORES
        // ====================================================

        if (
            professores.length === 0 &&
            Array.isArray(
                userExtraInfo?.professoresVinculados
            )
        ) {

            professores =
                userExtraInfo.professoresVinculados
                    .map(
                        professor => {

                            if (
                                typeof professor === 'string'
                            ) {

                                return {
                                    nome: professor
                                };

                            }

                            return professor;
                        }
                    );
        }


        // ====================================================
        // HTML DOS LOGINS
        // ====================================================

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


                            const loginEmail =
                                login?.email ||
                                email;


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
                                                    loginEmail
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


        // ====================================================
        // HTML DOS PROFESSORES
        // ====================================================

        let professoresHTML =
            '';


        if (
            professores.length > 0
        ) {

            professoresHTML =
                professores
                    .map(
                        professor => {

                            const professorNome =
                                professor?.nome ||
                                professor?.email
                                    ?.split('@')[0] ||
                                'Professor';


                            return `

                                <div class="profile-linked-item">


                                    <span class="profile-linked-icon">

                                        <i class="fas fa-user-tie"></i>

                                    </span>


                                    <span>

                                        ${escapeHTML(
                                            professorNome
                                        )}

                                    </span>


                                </div>

                            `;
                        }
                    )
                    .join('');

        } else {

            professoresHTML = `

                <div class="profile-history-empty profile-professores-empty">


                    <div class="profile-history-empty-icon">

                        <i class="fas fa-user-tie"></i>

                    </div>


                    <span>

                        Nenhum professor vinculado.

                    </span>


                </div>

            `;
        }


        // ====================================================
        // HTML PRINCIPAL
        // ====================================================

        container.innerHTML = `

            <div class="profile-page">


                <!-- =================================================
                     CABEÇALHO
                ================================================== -->

                <div class="profile-header-card">


                    <div class="profile-avatar">

                        <i
                            class="${
                                currentUserRole === 'professor'
                                    ? 'fas fa-user-tie'
                                    : 'fas fa-user-graduate'
                            }">
                        </i>

                    </div>


                    <div class="profile-header-info">


                        <span class="profile-header-label">

                            MEU PERFIL

                        </span>


                        <h2>

                            ${escapeHTML(
                                nome
                            )}

                        </h2>


                        <p>

                            ${escapeHTML(
                                email
                            )}

                        </p>


                        <div class="profile-badges">


                            <span class="profile-badge active">


                                <i class="fas fa-circle"></i>


                                ${
                                    isOnline
                                        ? 'Ativo'
                                        : 'Offline'
                                }


                            </span>


                        </div>


                    </div>


                </div>



                <!-- =================================================
                     INFORMAÇÕES DA CONTA
                ================================================== -->

                <div class="profile-info-card">


                    <div class="profile-section-title">


                        <span class="profile-section-icon">

                            <i class="fas fa-user"></i>

                        </span>


                        <div>

                            <h3>

                                Informações da conta

                            </h3>


                            <p>

                                Dados básicos do usuário

                            </p>

                        </div>


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


                    </div>


                </div>



                <!-- =================================================
                     TURMA
                ================================================== -->

                <div class="profile-info-card profile-class-card">


                    <div class="profile-section-title">


                        <span class="profile-section-icon">

                            <i class="fas fa-users"></i>

                        </span>


                        <div>

                            <h3>

                                Turma atual

                            </h3>


                            <p>

                                Turma conectada à sua conta

                            </p>

                        </div>


                    </div>


                    <div class="profile-class-content">


                        <div class="profile-class-main">


                            <span>

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

                                ${escapeHTML(
                                    turmaCodigo
                                )}

                            </strong>


                        </div>


                    </div>


                </div>



                <!-- =================================================
                     PROFESSORES
                ================================================== -->

                <div class="profile-info-card">


                    <div class="profile-section-title">


                        <span class="profile-section-icon">

                            <i class="fas fa-chalkboard-user"></i>

                        </span>


                        <div>

                            <h3>

                                Professores vinculados

                            </h3>


                            <p>

                                Professores associados à sua turma

                            </p>

                        </div>


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


    } catch (error) {

        console.error(
            'Erro ao renderizar meu perfil:',
            error
        );


        container.innerHTML = `

            <div class="form-card profile-error-card">


                <div class="profile-section-title">


                    <span class="profile-section-icon error">

                        <i class="fas fa-circle-exclamation"></i>

                    </span>


                    <div>

                        <h3>

                            Erro ao carregar perfil

                        </h3>


                        <p>

                            Não foi possível carregar suas informações.

                        </p>

                    </div>


                </div>


                <button
                    type="button"
                    class="btn-primary profile-reload-btn"
                    onclick="location.reload()"
                >

                    <i class="fas fa-rotate-right"></i>

                    Recarregar

                </button>


            </div>

        `;

    }
}