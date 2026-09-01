import {
    listarUltimosAcessos
} from '../auth.js';


// =========================================================
// VARIÁVEIS
// =========================================================

let currentUserRole = null;
let currentUserGlobal = null;
let isUsingLocalData = false;


// =========================================================
// RECEBER DADOS DO USUÁRIO
// =========================================================

export function setUserData(
    user,
    role,
    localFlag
) {

    currentUserGlobal = user;

    currentUserRole = role;

    isUsingLocalData = localFlag || false;
}


// =========================================================
// ESCAPAR HTML
// Evita problemas caso o nome/email tenha caracteres especiais
// =========================================================

function escapeHTML(value) {

    if (value === null || value === undefined) {
        return '';
    }

    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}


// =========================================================
// RENDERIZAR HISTÓRICO
// SOMENTE LOGINS
// =========================================================

export async function renderHistorico() {

    try {

        // =====================================================
        // BUSCAR ÚLTIMOS 10 ACESSOS DE ALUNOS
        // =====================================================

        const ultimosAlunos =
            await listarUltimosAcessos(
                'aluno',
                10
            );


        // =====================================================
        // BUSCAR ÚLTIMOS 10 ACESSOS DE PROFESSORES
        // =====================================================

        const ultimosProfessores =
            await listarUltimosAcessos(
                'professor',
                10
            );


        // =====================================================
        // CONTAINER
        // =====================================================

        const container =
            document.getElementById(
                'tabHistorico'
            );


        if (!container) {
            return;
        }


        // =====================================================
        // HTML
        // =====================================================

        container.innerHTML = `

            <div class="historico-page">


                <!-- =================================================
                     CABEÇALHO
                ================================================== -->

                <div class="historico-page-header">

                    <div>

                        <span class="historico-page-label">
                            REGISTROS
                        </span>

                        <h2>
                            Histórico de Acessos
                        </h2>

                        <p>
                            Acompanhe os últimos acessos de alunos e professores ao sistema.
                        </p>

                    </div>

                </div>



                <!-- =================================================
                     CARDS
                ================================================== -->

                <div class="historico-acessos-grid">


                    <!-- =================================================
                         ALUNOS
                    ================================================== -->

                    <div class="form-card historico-acesso-card">


                        <div class="historico-card-header">

                            <div class="historico-card-title">

                                <div class="historico-icon aluno">

                                    <i class="fas fa-user-graduate"></i>

                                </div>

                                <div>

                                    <h3>
                                        Últimos Acessos
                                    </h3>

                                    <span>
                                        Alunos
                                    </span>

                                </div>

                            </div>


                            <div class="historico-count aluno">

                                ${ultimosAlunos.length}

                            </div>

                        </div>



                        <!-- LISTA -->

                        <div class="historico-list">


                            ${
                                ultimosAlunos.length > 0

                                ?

                                ultimosAlunos.map(
                                    login => {

                                        const nome =
                                            login.nome ||
                                            login.email ||
                                            'Aluno';

                                        const data =
                                            login.data ||
                                            'Data não informada';

                                        return `

                                            <div class="log-entry">


                                                <div class="log-user-area">


                                                    <div class="log-avatar aluno">

                                                        <i class="fas fa-user-graduate"></i>

                                                    </div>


                                                    <div class="log-user-info">

                                                        <strong class="log-user">

                                                            ${escapeHTML(nome)}

                                                        </strong>

                                                        <span class="log-role">

                                                            Aluno

                                                        </span>

                                                    </div>

                                                </div>


                                                <div class="log-date">

                                                    <i class="far fa-clock"></i>

                                                    <span>

                                                        ${escapeHTML(data)}

                                                    </span>

                                                </div>


                                            </div>

                                        `;

                                    }
                                ).join('')

                                :

                                `

                                    <div class="historico-vazio">

                                        <div class="historico-vazio-icon">

                                            <i class="fas fa-user-slash"></i>

                                        </div>

                                        <span>

                                            Nenhum acesso de aluno registrado.

                                        </span>

                                    </div>

                                `
                            }


                        </div>

                    </div>



                    <!-- =================================================
                         PROFESSORES
                    ================================================== -->

                    <div class="form-card historico-acesso-card">


                        <div class="historico-card-header">

                            <div class="historico-card-title">

                                <div class="historico-icon professor">

                                    <i class="fas fa-chalkboard-user"></i>

                                </div>

                                <div>

                                    <h3>
                                        Últimos Acessos
                                    </h3>

                                    <span>
                                        Professores
                                    </span>

                                </div>

                            </div>


                            <div class="historico-count professor">

                                ${ultimosProfessores.length}

                            </div>

                        </div>



                        <!-- LISTA -->

                        <div class="historico-list">


                            ${
                                ultimosProfessores.length > 0

                                ?

                                ultimosProfessores.map(
                                    login => {

                                        const nome =
                                            login.nome ||
                                            login.email ||
                                            'Professor';

                                        const data =
                                            login.data ||
                                            'Data não informada';

                                        return `

                                            <div class="log-entry">


                                                <div class="log-user-area">


                                                    <div class="log-avatar professor">

                                                        <i class="fas fa-chalkboard-user"></i>

                                                    </div>


                                                    <div class="log-user-info">

                                                        <strong class="log-user">

                                                            ${escapeHTML(nome)}

                                                        </strong>

                                                        <span class="log-role">

                                                            Professor

                                                        </span>

                                                    </div>

                                                </div>


                                                <div class="log-date">

                                                    <i class="far fa-clock"></i>

                                                    <span>

                                                        ${escapeHTML(data)}

                                                    </span>

                                                </div>


                                            </div>

                                        `;

                                    }
                                ).join('')

                                :

                                `

                                    <div class="historico-vazio">

                                        <div class="historico-vazio-icon">

                                            <i class="fas fa-user-slash"></i>

                                        </div>

                                        <span>

                                            Nenhum acesso de professor registrado.

                                        </span>

                                    </div>

                                `
                            }


                        </div>

                    </div>


                </div>

            </div>

        `;


    } catch (error) {

        console.error(
            'Erro ao renderizar histórico:',
            error
        );


        const container =
            document.getElementById(
                'tabHistorico'
            );


        if (container) {

            container.innerHTML = `

                <div class="form-card historico-erro">

                    <div class="historico-card-title">

                        <div class="historico-icon erro">

                            <i class="fas fa-circle-exclamation"></i>

                        </div>

                        <div>

                            <h3>
                                Erro ao carregar histórico
                            </h3>

                            <span>
                                Não foi possível carregar os acessos.
                            </span>

                        </div>

                    </div>


                    <button
                        type="button"
                        class="btn-primary"
                        onclick="location.reload()"
                    >

                        <i class="fas fa-rotate-right"></i>

                        Recarregar

                    </button>

                </div>

            `;

        }

    }

}