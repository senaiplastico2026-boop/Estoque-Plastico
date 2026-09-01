// ============================================================
// AUTH.JS - SENAI PLÁSTICOS
// AUTENTICAÇÃO + USUÁRIOS + TURMAS
// ============================================================

import { auth, db } from './firebaseConfig.js';

import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    updatePassword,
    sendPasswordResetEmail,
    deleteUser
} from 'firebase/auth';

import {
    ref,
    get,
    set,
    update,
    remove,
    push
} from 'firebase/database';

// ============================================================
// ESTADO GLOBAL
// ============================================================

let currentUser = null;
let userRole = null;

let userExtraInfo = {
    nome: '',
    turno: '',
    professoresVinculados: [],
    dataHoraLogin: null,
    historicoLogins: [],
    turmasVinculadas: {},
    turmaAtualId: null,
    turmaAtualNome: '',
    turmaAtualCodigo: ''
};

let isOnline = navigator.onLine;

window.addEventListener('online', () => {
    isOnline = true;
    console.log('🟢 Internet conectada.');
});

window.addEventListener('offline', () => {
    isOnline = false;
    console.log('🔴 Internet desconectada.');
});

// ============================================================
// UTILITÁRIOS
// ============================================================

function sanitizeEmail(email) {
    return String(email || '').replace(/[.#$\[\]]/g, '_');
}

async function salvarComRetry(caminho, dados, tentativas = 5) {
    for (let i = 0; i < tentativas; i++) {
        try {
            await set(ref(db, caminho), dados);
            return { success: true };
        } catch (error) {
            if (i === tentativas - 1) throw error;

            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        1000 * (i + 1)
                    )
            );
        }
    }

    return {
        success: false
    };
}

function resetarDadosLocais() {

    userExtraInfo = {

        nome: '',

        turno: '',

        professoresVinculados: [],

        dataHoraLogin: null,

        historicoLogins: [],

        turmasVinculadas: {},

        turmaAtualId: null,

        turmaAtualNome: '',

        turmaAtualCodigo: ''

    };

}

// ============================================================
// LOGIN PROFESSOR
// ============================================================

async function loginProfessor(
    email,
    password
) {

    try {

        const userCredential =
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

        const user =
            userCredential.user;


        await loadUserExtraInfo(
            user.uid
        );


        const emailKey =
            sanitizeEmail(
                email
            );


        const profSnapshot =
            await get(
                ref(
                    db,
                    `professores/${emailKey}`
                )
            );


        let profData =
            profSnapshot.exists()
                ? profSnapshot.val()
                : null;


        let isProfessor =
            profData?.role ===
            'professor';


        if (
            !isProfessor
        ) {

            const userSnapshot =
                await get(
                    ref(
                        db,
                        `usuarios/${user.uid}`
                    )
                );


            if (
                userSnapshot.exists()
            ) {

                const data =
                    userSnapshot.val();


                if (
                    data.role ===
                    'professor'
                ) {

                    profData =
                        data;

                    isProfessor =
                        true;

                }

            }

        }


        if (
            !isProfessor
        ) {

            await signOut(
                auth
            );


            return {

                success:
                    false,

                error:
                    '❌ Esta conta não é de um professor. Use a aba "Aluno".'

            };

        }


        userRole =
            'professor';


        userExtraInfo =
            {
                ...userExtraInfo,
                ...(profData || {})
            };


        const dataAgora =
            new Date()
                .toLocaleString(
                    'pt-BR'
                );


        const loginData = {

            data:
                dataAgora,

            email:
                user.email,

            role:
                'professor',

            nome:
                userExtraInfo.nome ||
                user.email
                    ?.split('@')[0] ||
                'Professor',

            timestamp:
                Date.now()

        };


        userExtraInfo.historicoLogins =
            Array.isArray(
                userExtraInfo.historicoLogins
            )
                ? userExtraInfo.historicoLogins
                : [];


        userExtraInfo.historicoLogins.push(
            loginData
        );


        userExtraInfo.dataHoraLogin =
            dataAgora;


        await saveUserExtraInfo(
            user.uid,
            {

                ultimoLogin:
                    dataAgora,

                historicoLogins:
                    userExtraInfo.historicoLogins,

                role:
                    'professor',

                email:
                    user.email

            }
        );


        try {

            await push(
                ref(
                    db,
                    'historico_logins'
                ),
                loginData
            );

        } catch (e) {

            console.warn(
                'Erro ao salvar histórico global:',
                e
            );

        }


        console.log(
            `✅ Login professor ${email} realizado!`
        );


        return {

            success:
                true,

            user,

            role:
                'professor'

        };


    } catch (error) {

        console.error(
            '❌ Erro no login professor:',
            error
        );


        const mensagens = {

            'auth/user-not-found':
                '❌ Professor não encontrado. Cadastre-se ou use o botão "Cadastrar Professor".',

            'auth/wrong-password':
                '❌ Senha incorreta.',

            'auth/invalid-credential':
                '❌ Credenciais inválidas. Verifique seu email e senha.'

        };


        return {

            success:
                false,

            error:
                mensagens[error.code] ||
                `❌ ${error.message}`

        };

    }

}

// ============================================================
// LOGIN ALUNO
// ============================================================

async function loginAluno(
    email,
    password
) {

    try {

        const userCredential =
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );


        const user =
            userCredential.user;


        await loadUserExtraInfo(
            user.uid
        );


        const emailKey =
            sanitizeEmail(
                email
            );


        const alunoSnapshot =
            await get(
                ref(
                    db,
                    `alunos/${emailKey}`
                )
            );


        let alunoData =
            alunoSnapshot.exists()
                ? alunoSnapshot.val()
                : null;


        let isAluno =
            alunoData?.role ===
            'aluno';


        if (
            !isAluno
        ) {

            const userSnapshot =
                await get(
                    ref(
                        db,
                        `usuarios/${user.uid}`
                    )
                );


            if (
                userSnapshot.exists()
            ) {

                const data =
                    userSnapshot.val();


                if (
                    data.role ===
                    'aluno'
                ) {

                    alunoData =
                        data;

                    isAluno =
                        true;

                }

            }

        }


        if (
            !isAluno
        ) {

            await signOut(
                auth
            );


            return {

                success:
                    false,

                error:
                    '❌ Esta conta não é de um aluno. Use a aba "Professor".'

            };

        }


        userRole =
            'aluno';


        userExtraInfo =
            {
                ...userExtraInfo,
                ...(alunoData || {})
            };


        const dataAgora =
            new Date()
                .toLocaleString(
                    'pt-BR'
                );


        const loginData = {

            data:
                dataAgora,

            email:
                user.email,

            role:
                'aluno',

            nome:
                userExtraInfo.nome ||
                user.email
                    ?.split('@')[0] ||
                'Aluno',

            timestamp:
                Date.now()

        };


        userExtraInfo.historicoLogins =
            Array.isArray(
                userExtraInfo.historicoLogins
            )
                ? userExtraInfo.historicoLogins
                : [];


        userExtraInfo.historicoLogins.push(
            loginData
        );


        userExtraInfo.dataHoraLogin =
            dataAgora;


        await saveUserExtraInfo(
            user.uid,
            {

                ultimoLogin:
                    dataAgora,

                historicoLogins:
                    userExtraInfo.historicoLogins,

                role:
                    'aluno',

                email:
                    user.email

            }
        );


        try {

            await push(
                ref(
                    db,
                    'historico_logins'
                ),
                loginData
            );

        } catch (e) {

            console.warn(
                'Erro ao salvar histórico global:',
                e
            );

        }


        console.log(
            `✅ Login aluno ${email} realizado!`
        );


        return {

            success:
                true,

            user,

            role:
                'aluno'

        };


    } catch (error) {

        console.error(
            '❌ Erro no login aluno:',
            error
        );


        const mensagens = {

            'auth/user-not-found':
                '❌ Aluno não encontrado. Cadastre-se ou use o botão "Cadastrar Aluno".',

            'auth/wrong-password':
                '❌ Senha incorreta.',

            'auth/invalid-credential':
                '❌ Credenciais inválidas. Verifique seu email e senha.'

        };


        return {

            success:
                false,

            error:
                mensagens[error.code] ||
                `❌ ${error.message}`

        };

    }

}

// ============================================================
// CADASTRAR PROFESSOR
// ============================================================

async function cadastrarProfessor(
    email,
    senha
) {

    try {

        const emailKey =
            sanitizeEmail(
                email
            );


        const profSnapshot =
            await get(
                ref(
                    db,
                    `professores/${emailKey}`
                )
            );


        if (
            profSnapshot.exists()
        ) {

            return {

                success:
                    false,

                error:
                    '❌ Este email já está cadastrado como professor.'

            };

        }


        const alunoSnapshot =
            await get(
                ref(
                    db,
                    `alunos/${emailKey}`
                )
            );


        if (
            alunoSnapshot.exists()
        ) {

            return {

                success:
                    false,

                error:
                    '❌ Este email já está cadastrado como aluno. Use a aba "Aluno".'

            };

        }


        const userCredential =
            await createUserWithEmailAndPassword(
                auth,
                email,
                senha
            );


        const user =
            userCredential.user;


        const nome =
            email
                .split('@')[0];


        const userData = {

            nome,

            email,

            role:
                'professor',

            dataCriacao:
                new Date()
                    .toLocaleString(
                        'pt-BR'
                    ),

            historicoLogins:
                [],

            turmasVinculadas:
                {}

        };


        await salvarComRetry(
            `usuarios/${user.uid}`,
            userData
        );


        await salvarComRetry(
            `professores/${emailKey}`,
            {
                ...userData,
                uid: user.uid
            }
        );


        console.log(
            `✅ Professor ${email} cadastrado!`
        );


        return {

            success:
                true,

            user,

            email

        };


    } catch (error) {

        console.error(
            '❌ Erro no cadastro professor:',
            error
        );


        const mensagens = {

            'auth/email-already-in-use':
                '❌ Este email já está em uso no sistema.',

            'auth/weak-password':
                '❌ A senha deve ter pelo menos 6 caracteres.'

        };


        return {

            success:
                false,

            error:
                mensagens[error.code] ||
                `❌ ${error.message}`

        };

    }

}

// ============================================================
// CADASTRAR ALUNO
// ============================================================

async function cadastrarAluno(
    email,
    senha,
    turno,
    professores
) {

    try {

        const emailKey =
            sanitizeEmail(
                email
            );


        const nome =
            email
                .split('@')[0];


        const alunoSnapshot =
            await get(
                ref(
                    db,
                    `alunos/${emailKey}`
                )
            );


        if (
            alunoSnapshot.exists()
        ) {

            return {

                success:
                    false,

                error:
                    '❌ Este email já está cadastrado como aluno.'

            };

        }


        const profSnapshot =
            await get(
                ref(
                    db,
                    `professores/${emailKey}`
                )
            );


        if (
            profSnapshot.exists()
        ) {

            return {

                success:
                    false,

                error:
                    '❌ Este email já está cadastrado como professor. Use a aba "Professor".'

            };

        }


        const userCredential =
            await createUserWithEmailAndPassword(
                auth,
                email,
                senha
            );


        const user =
            userCredential.user;


        const userData = {

            nome,

            email,

            role:
                'aluno',

            turno:
                turno ||
                'Manhã',

            professoresVinculados:
                Array.isArray(
                    professores
                )
                    ? professores
                    : [],

            dataCriacao:
                new Date()
                    .toLocaleString(
                        'pt-BR'
                    ),

            historicoLogins:
                [],

            turmasVinculadas:
                {},

            turmaAtualId:
                null,

            turmaAtualNome:
                '',

            turmaAtualCodigo:
                ''

        };


        await salvarComRetry(
            `usuarios/${user.uid}`,
            userData
        );


        await salvarComRetry(
            `alunos/${emailKey}`,
            {
                ...userData,
                uid: user.uid
            }
        );


        console.log(
            `✅ Aluno ${email} cadastrado!`
        );


        return {

            success:
                true,

            user

        };


    } catch (error) {

        console.error(
            '❌ Erro no cadastro aluno:',
            error
        );


        const mensagens = {

            'auth/email-already-in-use':
                '❌ Este email já está em uso no sistema.',

            'auth/weak-password':
                '❌ A senha deve ter pelo menos 6 caracteres.'

        };


        return {

            success:
                false,

            error:
                mensagens[error.code] ||
                `❌ ${error.message}`

        };

    }

}

// ============================================================
// REDEFINIR SENHA
// ============================================================

async function redefinirSenha(
    email,
    novaSenha,
    confirmarSenha
) {

    try {

        if (
            novaSenha !==
            confirmarSenha
        ) {

            return {

                success:
                    false,

                error:
                    '❌ Senhas não coincidem!'

            };

        }


        if (
            !novaSenha ||
            novaSenha.length < 6
        ) {

            return {

                success:
                    false,

                error:
                    '❌ A senha deve ter pelo menos 6 caracteres!'

            };

        }


        const usuariosSnapshot =
            await get(
                ref(
                    db,
                    'usuarios'
                )
            );


        let uidEncontrado =
            null;


        if (
            usuariosSnapshot.exists()
        ) {

            for (
                const [
                    uid,
                    data
                ]
                of Object.entries(
                    usuariosSnapshot.val()
                )
            ) {

                if (
                    String(
                        data.email || ''
                    )
                        .toLowerCase() ===
                    String(
                        email || ''
                    )
                        .toLowerCase()
                ) {

                    uidEncontrado =
                        uid;

                    break;

                }

            }

        }


        if (
            !uidEncontrado
        ) {

            return {

                success:
                    false,

                error:
                    '❌ Usuário não encontrado!'

            };

        }


        const user =
            auth.currentUser;


        if (
            user &&
            user.uid ===
            uidEncontrado
        ) {

            await updatePassword(
                user,
                novaSenha
            );


            await update(
                ref(
                    db,
                    `usuarios/${uidEncontrado}`
                ),
                {

                    senhaAtualizada:
                        true,

                    ultimaAlteracaoSenha:
                        new Date()
                            .toLocaleString(
                                'pt-BR'
                            )

                }
            );


            return {

                success:
                    true,

                message:
                    '✅ Senha redefinida com sucesso!'

            };

        }


        await sendPasswordResetEmail(
            auth,
            email
        );


        return {

            success:
                true,

            message:
                '📧 Email de redefinição enviado! Verifique sua caixa de entrada.'

        };


    } catch (error) {

        console.error(
            '❌ Erro ao redefinir senha:',
            error
        );


        return {

            success:
                false,

            error:
                `❌ ${error.message}`

        };

    }

}

// ============================================================
// EXCLUIR MINHA CONTA
// ============================================================

async function excluirMinhaConta() {

    try {

        const user =
            auth.currentUser;


        if (
            !user
        ) {

            return {

                success:
                    false,

                error:
                    'Nenhum usuário está conectado.'

            };

        }


        const uid =
            user.uid;


        const email =
            user.email || '';


        const emailKey =
            sanitizeEmail(
                email
            );


        let userData =
            {};


        const userSnapshot =
            await get(
                ref(
                    db,
                    `usuarios/${uid}`
                )
            );


        if (
            userSnapshot.exists()
        ) {

            userData =
                userSnapshot.val();

        }


        /*
         * IMPORTANTE:
         *
         * NÃO removemos o usuário das turmas.
         *
         * As estruturas:
         *
         * turmas/{turmaId}/professores
         *
         * permanecem intactas.
         *
         * Isso permite que outros professores
         * continuem vinculados e possam administrar
         * a turma.
         */


        await remove(
            ref(
                db,
                `usuarios/${uid}`
            )
        );


        if (
            userData.role ===
            'professor' &&
            email
        ) {

            await remove(
                ref(
                    db,
                    `professores/${emailKey}`
                )
            );

        }


        if (
            userData.role ===
            'aluno' &&
            email
        ) {

            await remove(
                ref(
                    db,
                    `alunos/${emailKey}`
                )
            );

        }


        await deleteUser(
            user
        );


        currentUser =
            null;


        userRole =
            null;


        resetarDadosLocais();


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


        return {

            success:
                true

        };


    } catch (error) {

        console.error(
            '❌ Erro ao excluir minha conta:',
            error
        );


        return {

            success:
                false,

            error:
                error.message

        };

    }

}

// ============================================================
// REMOVER USUÁRIO
// ============================================================

async function removerUsuario(
    uid
) {

    try {

        const snapshot =
            await get(
                ref(
                    db,
                    `usuarios/${uid}`
                )
            );


        const data =
            snapshot.exists()
                ? snapshot.val()
                : {};


        await remove(
            ref(
                db,
                `usuarios/${uid}`
            )
        );


        if (
            data.role ===
            'professor' &&
            data.email
        ) {

            await remove(
                ref(
                    db,
                    `professores/${sanitizeEmail(data.email)}`
                )
            );

        }


        if (
            data.role ===
            'aluno' &&
            data.email
        ) {

            await remove(
                ref(
                    db,
                    `alunos/${sanitizeEmail(data.email)}`
                )
            );

        }


        return {

            success:
                true

        };


    } catch (error) {

        return {

            success:
                false,

            error:
                error.message

        };

    }

}

// ============================================================
// LISTAR PROFESSORES
// ============================================================

async function listarProfessores() {

    try {

        const snapshot =
            await get(
                ref(
                    db,
                    'professores'
                )
            );


        if (
            !snapshot.exists()
        ) {

            return [];

        }


        return Object.keys(
            snapshot.val()
        ).map(
            key => ({

                id:
                    key,

                ...snapshot.val()[key]

            })
        );


    } catch (error) {

        console.error(
            'Erro ao listar professores:',
            error
        );


        return [];

    }

}

// ============================================================
// LISTAR ALUNOS
// ============================================================

async function listarAlunos() {

    try {

        const snapshot =
            await get(
                ref(
                    db,
                    'alunos'
                )
            );


        if (
            !snapshot.exists()
        ) {

            return [];

        }


        return Object.keys(
            snapshot.val()
        ).map(
            key => ({

                id:
                    key,

                ...snapshot.val()[key]

            })
        );


    } catch (error) {

        console.error(
            'Erro ao listar alunos:',
            error
        );


        return [];

    }

}

// ============================================================
// LISTAR ALUNOS POR PROFESSOR
// ============================================================

async function listarAlunosPorProfessor(
    professor
) {

    try {

        const alunos =
            await listarAlunos();


        const nomeProfessor =
            typeof professor ===
            'string'
                ? professor
                : professor?.nome;


        const uidProfessor =
            typeof professor ===
            'object'
                ? professor?.uid
                : null;


        return alunos.filter(
            aluno => {

                const vinculados =
                    aluno.professoresVinculados ||
                    [];


                if (
                    !Array.isArray(
                        vinculados
                    )
                ) {

                    return false;

                }


                return vinculados.some(
                    item => {

                        if (
                            typeof item ===
                            'string'
                        ) {

                            return (
                                item ===
                                nomeProfessor
                            );

                        }


                        if (
                            item?.uid &&
                            uidProfessor
                        ) {

                            return (
                                item.uid ===
                                uidProfessor
                            );

                        }


                        if (
                            item?.nome &&
                            nomeProfessor
                        ) {

                            return (
                                item.nome ===
                                nomeProfessor
                            );

                        }


                        if (
                            item?.email &&
                            typeof professor ===
                            'object'
                        ) {

                            return (
                                item.email ===
                                professor.email
                            );

                        }


                        return false;

                    }
                );

            }
        );


    } catch (error) {

        console.error(
            'Erro ao listar alunos por professor:',
            error
        );


        return [];

    }

}

// ============================================================
// ÚLTIMOS ACESSOS
// ============================================================

async function listarUltimosAcessos(
    role = null,
    limite = 20
) {

    try {

        const snapshot =
            await get(
                ref(
                    db,
                    'historico_logins'
                )
            );


        if (
            !snapshot.exists()
        ) {

            return [];

        }


        let lista =
            Object.keys(
                snapshot.val()
            ).map(
                key => ({

                    id:
                        key,

                    ...snapshot.val()[key]

                })
            );


        if (
            role
        ) {

            lista =
                lista.filter(
                    item =>
                        item.role ===
                        role
                );

        }


        lista.sort(
            (a, b) =>
                (
                    b.timestamp ||
                    0
                ) -
                (
                    a.timestamp ||
                    0
                )
        );


        return lista.slice(
            0,
            limite
        );


    } catch (error) {

        console.error(
            'Erro ao listar últimos acessos:',
            error
        );


        return [];

    }

}

// ============================================================
// LOGOUT
// ============================================================

async function logoutUser() {

    try {

        await signOut(
            auth
        );


        currentUser =
            null;


        userRole =
            null;


        resetarDadosLocais();


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


        return {

            success:
                true

        };


    } catch (error) {

        return {

            success:
                false,

            error:
                error.message

        };

    }

}

// ============================================================
// DADOS DO USUÁRIO
// ============================================================

async function loadUserExtraInfo(
    uid
) {

    try {

        const snapshot =
            await get(
                ref(
                    db,
                    `usuarios/${uid}`
                )
            );


        if (
            snapshot.exists()
        ) {

            userExtraInfo = {

                ...userExtraInfo,

                ...snapshot.val()

            };

        }


        return userExtraInfo;


    } catch (error) {

        console.error(
            'Erro ao carregar informações:',
            error
        );


        return userExtraInfo;

    }

}


async function saveUserExtraInfo(
    uid,
    data
) {

    try {

        await update(
            ref(
                db,
                `usuarios/${uid}`
            ),
            data
        );


        userExtraInfo = {

            ...userExtraInfo,

            ...data

        };


        return {

            success:
                true

        };


    } catch (error) {

        console.error(
            'Erro ao salvar informações:',
            error
        );


        return {

            success:
                false,

            error:
                error.message

        };

    }

}

// ============================================================
// TURMAS
// ============================================================

function gerarCodigoTurma() {

    const caracteres =
        'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';


    let codigo =
        '';


    for (
        let i = 0;
        i < 6;
        i++
    ) {

        codigo +=
            caracteres[
                Math.floor(
                    Math.random() *
                    caracteres.length
                )
            ];

    }


    return codigo;

}

// ============================================================
// LISTAR TODAS AS TURMAS
// ============================================================

async function listarTurmas() {

    try {

        const snapshot =
            await get(
                ref(
                    db,
                    'turmas'
                )
            );


        if (
            !snapshot.exists()
        ) {

            return [];

        }


        const data =
            snapshot.val();


        return Object.keys(
            data
        ).map(
            key => ({

                id:
                    key,

                ...data[key]

            })
        );


    } catch (error) {

        console.error(
            'Erro ao listar turmas:',
            error
        );


        return [];

    }

}

// ============================================================
// CRIAR TURMA
// ============================================================

async function criarTurma(
    nomeTurma,
    codigo,
    professorPrincipal
) {

    try {

        if (
            !nomeTurma ||
            !codigo ||
            !professorPrincipal?.uid
        ) {

            return {

                success:
                    false,

                error:
                    'Preencha corretamente os dados da turma.'

            };

        }


        const turmas =
            await listarTurmas();


        const codigoNormalizado =
            String(
                codigo
            )
                .trim()
                .toUpperCase();


        const codigoExiste =
            turmas.some(
                turma =>
                    String(
                        turma.codigo ||
                        ''
                    )
                        .trim()
                        .toUpperCase() ===
                    codigoNormalizado
            );


        if (
            codigoExiste
        ) {

            return {

                success:
                    false,

                error:
                    'Este código de turma já está sendo utilizado.'

            };

        }


        const turmaRef =
            push(
                ref(
                    db,
                    'turmas'
                )
            );


        const turmaId =
            turmaRef.key;


        const nomeProfessor =
            professorPrincipal.nome ||
            professorPrincipal.email
                ?.split('@')[0] ||
            'Professor';


        const turmaData = {

            id:
                turmaId,

            nome:
                String(
                    nomeTurma
                ).trim(),

            codigo:
                codigoNormalizado,

            criadoPorUid:
                professorPrincipal.uid,

            criadoPorNome:
                nomeProfessor,

            criadoPorEmail:
                professorPrincipal.email ||
                '',

            criadoEm:
                Date.now(),

            ativo:
                true,


            professores: {

                [professorPrincipal.uid]:
                    {

                        uid:
                            professorPrincipal.uid,

                        nome:
                            nomeProfessor,

                        email:
                            professorPrincipal.email ||
                            '',

                        tipo:
                            'criador',

                        vinculadoEm:
                            Date.now()

                    }

            },


            alunos:
                {},


            /*
             * Cada turma começa com os próprios
             * dados zerados.
             */

            materiais:
                {},

            lixeira_materiais:
                {},

            moinho:
                {

                    materiais:
                        [],

                    capacidadeMax:
                        900,

                    historico:
                        []

                },

            historico:
                {}

        };


        await set(
            turmaRef,
            turmaData
        );


        await update(
            ref(
                db,
                `usuarios/${professorPrincipal.uid}`
            ),
            {

                [`turmasVinculadas/${turmaId}`]:
                    true,

                turmaAtualId:
                    turmaId,

                turmaAtualNome:
                    turmaData.nome,

                turmaAtualCodigo:
                    turmaData.codigo

            }
        );


        if (
            professorPrincipal.email
        ) {

            await update(
                ref(
                    db,
                    `professores/${sanitizeEmail(professorPrincipal.email)}`
                ),
                {

                    [`turmasVinculadas/${turmaId}`]:
                        true

                }
            );

        }


        return {

            success:
                true,

            turma:
                turmaData

        };


    } catch (error) {

        console.error(
            'Erro ao criar turma:',
            error
        );


        return {

            success:
                false,

            error:
                error.message

        };

    }

}

// ============================================================
// TURMAS DO PROFESSOR
// ============================================================

async function listarTurmasDoProfessor(
    professorUid
) {

    try {

        if (
            !professorUid
        ) {

            return [];

        }


        const turmas =
            await listarTurmas();


        return turmas.filter(
            turma => {

                if (
                    turma.criadoPorUid ===
                    professorUid
                ) {

                    return true;

                }


                if (
                    turma.professores &&
                    !Array.isArray(
                        turma.professores
                    ) &&
                    turma.professores[
                        professorUid
                    ]
                ) {

                    return true;

                }


                if (
                    Array.isArray(
                        turma.professores
                    )
                ) {

                    return turma.professores.some(
                        item =>
                            item?.uid ===
                            professorUid
                    );

                }


                return false;

            }
        );


    } catch (error) {

        console.error(
            'Erro ao listar turmas do professor:',
            error
        );


        return [];

    }

}

// ============================================================
// TURMAS POR PROFESSORES
// ============================================================

async function listarTurmasPorProfessores(
    professores
) {

    try {

        if (
            !Array.isArray(
                professores
            ) ||
            professores.length ===
            0
        ) {

            return [];

        }


        const turmas =
            await listarTurmas();


        const normalizados =
            professores.map(
                professor => ({

                    uid:
                        typeof professor ===
                        'string'
                            ? null
                            : (
                                professor?.uid ||
                                professor?.id ||
                                null
                            ),

                    nome:
                        typeof professor ===
                        'string'
                            ? professor
                            : (
                                professor?.nome ||
                                ''
                            ),

                    email:
                        typeof professor ===
                        'string'
                            ? ''
                            : (
                                professor?.email ||
                                ''
                            )

                })
            );


        return turmas.filter(
            turma => {

                const profs =
                    turma.professores;


                if (
                    !profs
                ) {

                    return false;

                }


                const lista =
                    Array.isArray(
                        profs
                    )
                        ? profs
                        : Object.values(
                            profs
                        );


                return normalizados.some(
                    professor =>
                        lista.some(
                            item =>

                                (
                                    professor.uid &&
                                    item?.uid ===
                                    professor.uid
                                ) ||

                                (
                                    professor.nome &&
                                    item?.nome ===
                                    professor.nome
                                ) ||

                                (
                                    professor.email &&
                                    item?.email ===
                                    professor.email
                                )

                        )
                );

            }
        );


    } catch (error) {

        console.error(
            'Erro ao filtrar turmas por professores:',
            error
        );


        return [];

    }

}

// ============================================================
// VINCULAR PROFESSOR À TURMA
// ============================================================

async function vincularProfessorTurma(
    turmaId,
    professor
) {

    try {

        if (
            !turmaId ||
            !professor?.uid
        ) {

            return {

                success:
                    false,

                error:
                    'Professor ou turma inválidos.'

            };

        }


        const turmaSnapshot =
            await get(
                ref(
                    db,
                    `turmas/${turmaId}`
                )
            );


        if (
            !turmaSnapshot.exists()
        ) {

            return {

                success:
                    false,

                error:
                    'Turma não encontrada.'

            };

        }


        const turma =
            turmaSnapshot.val();


        const nomeProfessor =
            professor.nome ||
            professor.email
                ?.split('@')[0] ||
            'Professor';


        await update(
            ref(
                db,
                `turmas/${turmaId}/professores/${professor.uid}`
            ),
            {

                uid:
                    professor.uid,

                nome:
                    nomeProfessor,

                email:
                    professor.email ||
                    '',

                tipo:
                    'vinculado',

                vinculadoEm:
                    Date.now()

            }
        );


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


        if (
            professor.email
        ) {

            await update(
                ref(
                    db,
                    `professores/${sanitizeEmail(professor.email)}`
                ),
                {

                    [`turmasVinculadas/${turmaId}`]:
                        true

                }
            );

        }


        return {

            success:
                true,

            turma: {

                id:
                    turmaId,

                ...turma

            }

        };


    } catch (error) {

        console.error(
            'Erro ao vincular professor:',
            error
        );


        return {

            success:
                false,

            error:
                error.message

        };

    }

}

// ============================================================
// REMOVER TURMA
// ============================================================

async function removerTurma(
    turmaId,
    professorUid
) {

    try {

        if (
            !turmaId ||
            !professorUid
        ) {

            return {

                success:
                    false,

                error:
                    'Turma ou professor inválidos.'

            };

        }


        const turmaRef =
            ref(
                db,
                `turmas/${turmaId}`
            );


        const snapshot =
            await get(
                turmaRef
            );


        if (
            !snapshot.exists()
        ) {

            return {

                success:
                    false,

                error:
                    'Turma não encontrada.'

            };

        }


        const turma =
            snapshot.val();


        let autorizado =
            String(
                turma.criadoPorUid ||
                ''
            ) ===
            String(
                professorUid
            );


        /*
         * Aceita também professor vinculado.
         */

        if (
            !autorizado &&
            turma.professores
        ) {

            if (
                Array.isArray(
                    turma.professores
                )
            ) {

                autorizado =
                    turma.professores.some(
                        item =>
                            String(
                                item?.uid ||
                                ''
                            ) ===
                            String(
                                professorUid
                            )
                    );

            } else if (
                typeof turma.professores ===
                'object'
            ) {

                autorizado =
                    Boolean(
                        turma.professores[
                            professorUid
                        ]
                    );

            }

        }


        if (
            !autorizado
        ) {

            return {

                success:
                    false,

                error:
                    'Você não está autorizado a apagar esta turma.'

            };

        }


        /*
         * Remove somente esta turma.
         *
         * Os dados de outras turmas não são tocados.
         */

        await remove(
            turmaRef
        );


        return {

            success:
                true

        };


    } catch (error) {

        console.error(
            '❌ Erro ao remover turma:',
            error
        );


        return {

            success:
                false,

            error:
                error.message

        };

    }

}

// ============================================================
// ENTRAR NA TURMA
// ============================================================

async function entrarNaTurma(
    turmaId,
    codigoInformado,
    userUid,
    role
) {

    try {

        if (
            !turmaId ||
            !userUid
        ) {

            return {

                success:
                    false,

                error:
                    'Dados insuficientes para entrar na turma.'

            };

        }


        const snapshot =
            await get(
                ref(
                    db,
                    `turmas/${turmaId}`
                )
            );


        if (
            !snapshot.exists()
        ) {

            return {

                success:
                    false,

                error:
                    'Turma não encontrada.'

            };

        }


        const turma =
            snapshot.val();


        if (
            turma.ativo ===
            false
        ) {

            return {

                success:
                    false,

                error:
                    'Esta turma está desativada.'

            };

        }


        const codigoBanco =
            String(
                turma.codigo ||
                ''
            )
                .trim()
                .toUpperCase();


        const codigoDigitado =
            String(
                codigoInformado ||
                ''
            )
                .trim()
                .toUpperCase();


        if (
            codigoBanco !==
            codigoDigitado
        ) {

            return {

                success:
                    false,

                error:
                    'Código da turma incorreto.'

            };

        }


        if (
            role ===
            'professor'
        ) {

            const possuiAcesso =

                String(
                    turma.criadoPorUid ||
                    ''
                ) ===
                String(
                    userUid
                ) ||

                Boolean(
                    turma.professores &&
                    (
                        Array.isArray(
                            turma.professores
                        )

                            ? turma.professores.some(
                                item =>
                                    String(
                                        item?.uid ||
                                        ''
                                    ) ===
                                    String(
                                        userUid
                                    )
                            )

                            : turma.professores[
                                userUid
                            ]
                    )
                );


            if (
                !possuiAcesso
            ) {

                return {

                    success:
                        false,

                    error:
                        'Você não está vinculado a esta turma.'

                };

            }

        }


        if (
            role ===
            'aluno'
        ) {

            await update(
                ref(
                    db,
                    `usuarios/${userUid}`
                ),
                {

                    turmaAtualId:
                        turmaId,

                    turmaAtualNome:
                        turma.nome ||
                        '',

                    turmaAtualCodigo:
                        turma.codigo ||
                        '',

                    turmaSelecionadaEm:
                        Date.now(),

                    [`turmasVinculadas/${turmaId}`]:
                        true

                }
            );


            const userSnapshot =
                await get(
                    ref(
                        db,
                        `usuarios/${userUid}`
                    )
                );


            if (
                userSnapshot.exists() &&
                userSnapshot.val().email
            ) {

                const emailKey =
                    sanitizeEmail(
                        userSnapshot
                            .val()
                            .email
                    );


                await update(
                    ref(
                        db,
                        `alunos/${emailKey}`
                    ),
                    {

                        turmaAtualId:
                            turmaId,

                        turmaAtualNome:
                            turma.nome ||
                            '',

                        turmaAtualCodigo:
                            turma.codigo ||
                            '',

                        [`turmasVinculadas/${turmaId}`]:
                            true

                    }
                );

            }

        }


        localStorage.setItem(
            'turmaAtualId',
            turmaId
        );


        localStorage.setItem(
            'turmaAtualNome',
            turma.nome ||
            ''
        );


        localStorage.setItem(
            'turmaAtualCodigo',
            turma.codigo ||
            ''
        );


        userExtraInfo.turmaAtualId =
            turmaId;


        userExtraInfo.turmaAtualNome =
            turma.nome ||
            '';


        userExtraInfo.turmaAtualCodigo =
            turma.codigo ||
            '';


        return {

            success:
                true,

            turma: {

                id:
                    turmaId,

                ...turma

            }

        };


    } catch (error) {

        console.error(
            'Erro ao entrar na turma:',
            error
        );


        return {

            success:
                false,

            error:
                error.message

        };

    }

}

// ============================================================
// SALVAR TURMA ATUAL
// ============================================================

async function salvarTurmaAtual(
    userUid,
    turma
) {

    try {

        if (
            !userUid ||
            !turma?.id
        ) {

            return {

                success:
                    false,

                error:
                    'Usuário ou turma inválidos.'

            };

        }


        await update(
            ref(
                db,
                `usuarios/${userUid}`
            ),
            {

                turmaAtualId:
                    turma.id,

                turmaAtualNome:
                    turma.nome ||
                    '',

                turmaAtualCodigo:
                    turma.codigo ||
                    '',

                turmaSelecionadaEm:
                    Date.now()

            }
        );


        userExtraInfo.turmaAtualId =
            turma.id;


        userExtraInfo.turmaAtualNome =
            turma.nome ||
            '';


        userExtraInfo.turmaAtualCodigo =
            turma.codigo ||
            '';


        localStorage.setItem(
            'turmaAtualId',
            turma.id
        );


        localStorage.setItem(
            'turmaAtualNome',
            turma.nome ||
            ''
        );


        localStorage.setItem(
            'turmaAtualCodigo',
            turma.codigo ||
            ''
        );


        return {

            success:
                true

        };


    } catch (error) {

        return {

            success:
                false,

            error:
                error.message

        };

    }

}

// ============================================================
// TURMA ATUAL
// ============================================================

async function obterTurmaAtual(
    turmaId
) {

    try {

        if (
            !turmaId
        ) {

            return null;

        }


        const snapshot =
            await get(
                ref(
                    db,
                    `turmas/${turmaId}`
                )
            );


        if (
            !snapshot.exists()
        ) {

            return null;

        }


        return {

            id:
                turmaId,

            ...snapshot.val()

        };


    } catch (error) {

        console.error(
            'Erro ao obter turma atual:',
            error
        );


        return null;

    }

}

// ============================================================
// ASSOCIAR ALUNO À TURMA
// ============================================================

async function adicionarAlunoNaTurma(
    turmaId,
    aluno
) {

    try {

        if (
            !turmaId ||
            !aluno?.uid
        ) {

            return {

                success:
                    false,

                error:
                    'Aluno ou turma inválidos.'

            };

        }


        const turmaSnapshot =
            await get(
                ref(
                    db,
                    `turmas/${turmaId}`
                )
            );


        if (
            !turmaSnapshot.exists()
        ) {

            return {

                success:
                    false,

                error:
                    'Turma não encontrada.'

            };

        }


        const nomeAluno =
            aluno.nome ||
            aluno.email
                ?.split('@')[0] ||
            'Aluno';


        await update(
            ref(
                db,
                `turmas/${turmaId}/alunos/${aluno.uid}`
            ),
            {

                uid:
                    aluno.uid,

                nome:
                    nomeAluno,

                email:
                    aluno.email ||
                    '',

                turno:
                    aluno.turno ||
                    '',

                adicionadoEm:
                    Date.now()

            }
        );


        await update(
            ref(
                db,
                `usuarios/${aluno.uid}`
            ),
            {

                [`turmasVinculadas/${turmaId}`]:
                    true

            }
        );


        return {

            success:
                true

        };


    } catch (error) {

        console.error(
            'Erro ao adicionar aluno à turma:',
            error
        );


        return {

            success:
                false,

            error:
                error.message

        };

    }

}

// ============================================================
// LISTAR ALUNOS DA TURMA
// ============================================================

async function listarAlunosDaTurma(
    turmaId
) {

    try {

        if (
            !turmaId
        ) {

            return [];

        }


        const snapshot =
            await get(
                ref(
                    db,
                    `turmas/${turmaId}/alunos`
                )
            );


        if (
            !snapshot.exists()
        ) {

            return [];

        }


        const data =
            snapshot.val();


        return Object.keys(
            data
        ).map(
            key => ({

                id:
                    key,

                ...data[key]

            })
        );


    } catch (error) {

        console.error(
            'Erro ao listar alunos da turma:',
            error
        );


        return [];

    }

}

// ============================================================
// AUTH STATE
// ============================================================

function onAuthStateChange(
    callback
) {

    return onAuthStateChanged(
        auth,
        async user => {

            if (
                user
            ) {

                currentUser =
                    user;


                await loadUserExtraInfo(
                    user.uid
                );


                userRole =
                    userExtraInfo.role ||
                    'aluno';


                callback({

                    isLoggedIn:
                        true,

                    user,

                    role:
                        userRole,

                    extraInfo:
                        userExtraInfo

                });

            } else {

                currentUser =
                    null;


                userRole =
                    null;


                resetarDadosLocais();


                callback({

                    isLoggedIn:
                        false,

                    user:
                        null

                });

            }

        }
    );

}

// ============================================================
// EXPORTS
// ============================================================

export {

    loginProfessor,

    loginAluno,

    cadastrarAluno,

    cadastrarProfessor,

    redefinirSenha,

    logoutUser,

    excluirMinhaConta,

    onAuthStateChange,


    removerUsuario,

    listarProfessores,

    listarAlunos,

    listarAlunosPorProfessor,

    listarUltimosAcessos,


    loadUserExtraInfo,

    saveUserExtraInfo,

    currentUser,

    userRole,

    userExtraInfo,

    isOnline,

    sanitizeEmail,


    gerarCodigoTurma,

    listarTurmas,

    criarTurma,

    listarTurmasDoProfessor,

    listarTurmasPorProfessores,

    vincularProfessorTurma,

    removerTurma,

    entrarNaTurma,

    salvarTurmaAtual,

    obterTurmaAtual,

    adicionarAlunoNaTurma,

    listarAlunosDaTurma

};