import { db } from '../firebaseConfig.js';

import {
    isOnline,
    userExtraInfo
} from '../auth.js';

import {
    ref,
    get,
    set,
    push,
    update,
    remove
} from "firebase/database";


let currentUserRole = null;
let currentUserGlobal = null;
let isUsingLocalData = false;


// ============================================================
// USUÁRIO
// ============================================================

export function setUserData(
    user,
    role,
    localFlag
) {

    currentUserGlobal = user;

    currentUserRole = role;

    isUsingLocalData =
        localFlag || false;

}


// ============================================================
// EDITOR / ADICIONADO POR
// ============================================================

function obterUsuarioAtual() {

    const nome =
        userExtraInfo?.nome ||
        currentUserGlobal?.displayName ||
        currentUserGlobal?.email?.split('@')[0] ||
        'Usuário';

    const perfil =
        currentUserRole === 'professor'
            ? 'Professor'
            : currentUserRole === 'aluno'
                ? 'Aluno'
                : 'Usuário';

    return `${nome} - ${perfil}`;

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

function obterTurmaId() {

    return (
        window.senaiTurmaAtualId ||
        localStorage.getItem('turmaAtualId') ||
        null
    );

}


// ============================================================
// DADOS LOCAIS
// ============================================================

let localData = {

    materiais: [],

    lixeira: []

};


// ============================================================
// BUSCAR MATERIAIS
// ============================================================

async function getMateriais() {

    try {

        const turmaId =
            obterTurmaId();


        if (
            isOnline &&
            !isUsingLocalData &&
            turmaId
        ) {

            const snapshot =
                await get(
                    ref(
                        db,
                        `turmas/${turmaId}/materiais`
                    )
                );


            if (
                snapshot.exists()
            ) {

                const data =
                    snapshot.val();


                return Object.keys(data)
                    .map(
                        key => ({

                            id:
                                key,

                            turmaId:
                                turmaId,

                            ...data[key]

                        })
                    );

            }

            return [];

        }


        if (
            isOnline &&
            !isUsingLocalData &&
            !turmaId
        ) {

            return [];

        }


        return localData.materiais || [];


    } catch (error) {

        console.error(
            'Erro ao buscar materiais:',
            error
        );

        return localData.materiais || [];

    }

}


// ============================================================
// BUSCAR LIXEIRA
// ============================================================

async function getLixeira() {

    try {

        const turmaId =
            obterTurmaId();


        if (
            isOnline &&
            !isUsingLocalData &&
            turmaId
        ) {

            const snapshot =
                await get(
                    ref(
                        db,
                        `turmas/${turmaId}/lixeira_materiais`
                    )
                );


            if (
                snapshot.exists()
            ) {

                const data =
                    snapshot.val();


                return Object.keys(data)
                    .map(
                        key => ({

                            id:
                                key,

                            turmaId:
                                turmaId,

                            ...data[key]

                        })
                    );

            }

            return [];

        }


        return localData.lixeira || [];


    } catch (error) {

        console.warn(
            'Erro ao buscar lixeira:',
            error
        );

        return localData.lixeira || [];

    }

}


// ============================================================
// SALVAR MATERIAL
// ============================================================

async function saveMaterial(
    data,
    id = null
) {

    try {

        const turmaId =
            obterTurmaId();


        if (
            !turmaId
        ) {

            throw new Error(
                'Selecione uma turma antes de cadastrar o material.'
            );

        }


        if (
            isOnline &&
            !isUsingLocalData
        ) {

            if (id) {

                await update(
                    ref(
                        db,
                        `turmas/${turmaId}/materiais/${id}`
                    ),
                    data
                );


                return id;

            }


            const newRef =
                push(
                    ref(
                        db,
                        `turmas/${turmaId}/materiais`
                    )
                );


            await set(
                newRef,
                {

                    ...data,

                    turmaId:
                        turmaId,

                    adicionadoPor:
                        data.adicionadoPor ||
                        obterUsuarioAtual(),

                    adicionadoPorUid:
                        data.adicionadoPorUid ||
                        currentUserGlobal?.uid ||
                        '',

                    dataAdicao:
                        data.dataAdicao ||
                        new Date()
                            .toLocaleString(
                                'pt-BR'
                            )

                }
            );


            return newRef.key;

        }


        if (id) {

            const idx =
                localData.materiais.findIndex(
                    m =>
                        m.id === id
                );


            if (
                idx !== -1
            ) {

                localData.materiais[idx] =
                    {

                        ...localData.materiais[idx],

                        ...data,

                        id

                    };

            }


            return id;

        }


        const newId =
            'm' +
            Date.now();


        localData.materiais.push({

            ...data,

            id:
                newId,

            turmaId:
                turmaId,

            adicionadoPor:
                data.adicionadoPor ||
                obterUsuarioAtual(),

            adicionadoPorUid:
                data.adicionadoPorUid ||
                currentUserGlobal?.uid ||
                '',

            dataAdicao:
                new Date()
                    .toLocaleString(
                        'pt-BR'
                    )

        });


        return newId;


    } catch (error) {

        console.error(
            'Erro ao salvar material:',
            error
        );

        throw error;

    }

}


// ============================================================
// REMOVER MATERIAL
// ============================================================

async function deleteMaterial(
    id
) {

    try {

        const turmaId =
            obterTurmaId();


        if (
            !turmaId
        ) {

            return {

                success:
                    false,

                error:
                    'Nenhuma turma selecionada.'

            };

        }


        let materialData = {};


        if (
            isOnline &&
            !isUsingLocalData
        ) {

            const materialRef =
                ref(
                    db,
                    `turmas/${turmaId}/materiais/${id}`
                );


            const snapshot =
                await get(
                    materialRef
                );


            if (
                snapshot.exists()
            ) {

                materialData =
                    snapshot.val();

            }


            await set(
                ref(
                    db,
                    `turmas/${turmaId}/lixeira_materiais/${id}`
                ),
                {

                    ...materialData,

                    turmaId:
                        turmaId,

                    dataExclusao:
                        new Date()
                            .toLocaleString(
                                'pt-BR'
                            ),

                    removidoPor:
                        obterUsuarioAtual(),

                    removidoPorUid:
                        currentUserGlobal?.uid ||
                        ''

                }
            );


            await remove(
                materialRef
            );


        } else {

            const idx =
                localData.materiais.findIndex(
                    m =>
                        m.id === id
                );


            if (
                idx !== -1
            ) {

                materialData =
                    localData.materiais[idx];


                localData.materiais.splice(
                    idx,
                    1
                );


                localData.lixeira.push({

                    ...materialData,

                    dataExclusao:
                        new Date()
                            .toLocaleString(
                                'pt-BR'
                            ),

                    removidoPor:
                        obterUsuarioAtual(),

                    removidoPorUid:
                        currentUserGlobal?.uid ||
                        ''

                });

            }

        }


        return {

            success:
                true

        };


    } catch (error) {

        console.error(
            '❌ Erro ao remover material:',
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
// RESTAURAR
// ============================================================

async function restaurarMaterialHandler(
    id
) {

    try {

        const turmaId =
            obterTurmaId();


        if (
            !turmaId
        ) {

            return {

                success:
                    false,

                error:
                    'Nenhuma turma selecionada.'

            };

        }


        if (
            isOnline &&
            !isUsingLocalData
        ) {

            const lixeiraRef =
                ref(
                    db,
                    `turmas/${turmaId}/lixeira_materiais/${id}`
                );


            const snapshot =
                await get(
                    lixeiraRef
                );


            if (
                snapshot.exists()
            ) {

                const data =
                    snapshot.val();


                delete data.dataExclusao;

                delete data.removidoPor;

                delete data.removidoPorUid;


                await set(
                    ref(
                        db,
                        `turmas/${turmaId}/materiais/${id}`
                    ),
                    data
                );


                await remove(
                    lixeiraRef
                );


                return {

                    success:
                        true

                };

            }

        } else {

            const idx =
                localData.lixeira.findIndex(
                    m =>
                        m.id === id
                );


            if (
                idx !== -1
            ) {

                const data =
                    {
                        ...localData.lixeira[idx]
                    };


                delete data.dataExclusao;

                delete data.removidoPor;

                delete data.removidoPorUid;


                localData.materiais.push({

                    ...data,

                    id

                });


                localData.lixeira.splice(
                    idx,
                    1
                );


                return {

                    success:
                        true

                };

            }

        }


        return {

            success:
                false,

            error:
                'Material não encontrado na lixeira.'

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
// DELETAR PERMANENTEMENTE
// ============================================================

async function deletarPermanentemente(
    id
) {

    try {

        const turmaId =
            obterTurmaId();


        if (
            isOnline &&
            !isUsingLocalData &&
            turmaId
        ) {

            await remove(
                ref(
                    db,
                    `turmas/${turmaId}/lixeira_materiais/${id}`
                )
            );

        } else {

            localData.lixeira =
                localData.lixeira.filter(
                    m =>
                        m.id !== id
                );

        }


        return {

            success:
                true

        };


    } catch (error) {

        console.error(
            '❌ Erro ao deletar permanentemente:',
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
// RENDERIZAR MATERIAIS
// ============================================================

export async function renderMateriais() {

    try {

        const materiaisList =
            await getMateriais();


        const lixeiraList =
            await getLixeira();


        let html = `

            <div class="form-card">

                <div class="form-title">

                    <i class="fas fa-plus-circle"></i>

                    Cadastrar Material

                </div>


                <div class="form-grid">

                    <div class="form-group">

                        <label>
                            Código
                        </label>

                        <input
                            type="text"
                            id="newMaterialCodigo"
                            placeholder="PP001"
                        >

                    </div>


                    <div class="form-group">

                        <label>
                            Nome
                        </label>

                        <input
                            type="text"
                            id="newMaterialNome"
                            placeholder="Nome"
                        >

                    </div>


                    <div class="form-group">

                        <label>
                            Quantidade (kg)
                        </label>

                        <input
                            type="number"
                            id="newMaterialQuantidade"
                            step="any"
                        >

                    </div>


                    <div class="form-group">

                        <label>
                            Categoria
                        </label>

                        <input
                            type="text"
                            id="newMaterialCategoria"
                            placeholder="Categoria"
                        >

                    </div>


                    <div class="form-group">

                        <label>
                            Fornecedor
                        </label>

                        <input
                            type="text"
                            id="newMaterialFornecedor"
                            placeholder="Fornecedor"
                        >

                    </div>


                    <div class="form-group">

                        <label>
                            Estado
                        </label>

                        <select id="newMaterialEstado">

                            <option value="Ótimo">
                                Ótimo
                            </option>

                            <option value="Bom" selected>
                                Bom
                            </option>

                            <option value="Regular">
                                Regular
                            </option>

                            <option value="Ruim">
                                Ruim
                            </option>

                        </select>

                    </div>


                    <div class="form-group">

                        <label>
                            Estoque Mínimo (kg)
                        </label>

                        <input
                            type="number"
                            id="newMaterialEstoqueMinimo"
                            step="any"
                        >

                    </div>

                </div>


                <button
                    id="btnAddMaterial"
                    type="button"
                    class="btn-primary"
                >

                    Cadastrar

                </button>

            </div>


            <div class="form-card">

                <div class="form-title">

                    <i class="fas fa-search"></i>

                    Filtros

                </div>


                <div class="filter-bar">

                    <input
                        type="text"
                        id="searchMaterialInput"
                        placeholder="Buscar..."
                    >


                    <input
                        type="text"
                        id="filterCategoriaInput"
                        placeholder="Categoria..."
                    >


                    <button
                        id="clearFiltersBtn"
                        type="button"
                        class="btn-warning"
                        style="
                            width:auto;
                            padding:8px 16px;
                        "
                    >

                        Limpar

                    </button>

                </div>

            </div>


            <div class="form-card">

                <div
                    class="form-header"
                    style="
                        display:flex;
                        justify-content:space-between;
                        align-items:center;
                        margin-bottom:16px;
                    "
                >

                    <h3
                        style="
                            font-size:16px;
                            font-weight:600;
                        "
                    >

                        Materiais (${materiaisList.length})

                    </h3>


                    <button
                        id="btnVerLixeira"
                        type="button"
                        class="btn-warning btn-small-action"
                    >

                        <i class="fas fa-trash"></i>

                        Lixeira (${lixeiraList.length})

                    </button>

                </div>


                <div class="table-container">

                    <table>

                        <thead>

                            <tr>

                                <th>
                                    Código
                                </th>

                                <th>
                                    Nome
                                </th>

                                <th>
                                    Qtd
                                </th>

                                <th>
                                    Categoria
                                </th>

                                <th>
                                    Fornecedor
                                </th>

                                <th>
                                    Estado
                                </th>

                                <th>
                                    Est. Mín
                                </th>

                                <th>
                                    Adicionado por
                                </th>

                                <th>
                                    Ações
                                </th>

                            </tr>

                        </thead>


                        <tbody
                            id="materiaisTableBody"
                        >

                            ${
                                materiaisList.length

                                    ? materiaisList
                                        .map(
                                            m => `

                                            <tr

                                                data-nome="${escapeHTML(
                                                    m.nome || ''
                                                ).toLowerCase()}"

                                                data-codigo="${escapeHTML(
                                                    m.codigo || ''
                                                ).toLowerCase()}"

                                                data-fornecedor="${escapeHTML(
                                                    m.fornecedor || ''
                                                ).toLowerCase()}"

                                                data-categoria="${escapeHTML(
                                                    m.categoria || ''
                                                ).toLowerCase()}"

                                            >

                                                <td>

                                                    <strong>
                                                        ${escapeHTML(
                                                            m.codigo || '-'
                                                        )}
                                                    </strong>

                                                </td>


                                                <td>

                                                    ${escapeHTML(
                                                        m.nome || '-'
                                                    )}

                                                </td>


                                                <td>

                                                    ${m.quantidade ?? 0}

                                                </td>


                                                <td>

                                                    ${escapeHTML(
                                                        m.categoria || '-'
                                                    )}

                                                </td>


                                                <td>

                                                    ${escapeHTML(
                                                        m.fornecedor || '-'
                                                    )}

                                                </td>


                                                <td>

                                                    ${escapeHTML(
                                                        m.estado || 'Bom'
                                                    )}

                                                </td>


                                                <td>

                                                    ${m.estoqueMinimo ?? '-'}

                                                </td>


                                                <td>

                                                    <span
                                                        class="text-primary"
                                                        style="
                                                            font-weight:600;
                                                            white-space:nowrap;
                                                        "
                                                    >

                                                        ${escapeHTML(
                                                            m.adicionadoPor ||
                                                            '-'
                                                        )}

                                                    </span>

                                                </td>


                                                <td>

                                                    <button
                                                        type="button"
                                                        class="btn-edit edit-material"

                                                        data-id="${escapeHTML(
                                                            m.id
                                                        )}"

                                                        data-nome="${escapeHTML(
                                                            m.nome || ''
                                                        )}"

                                                        data-codigo="${escapeHTML(
                                                            m.codigo || ''
                                                        )}"

                                                        data-quantidade="${m.quantidade ?? 0}"

                                                        data-categoria="${escapeHTML(
                                                            m.categoria || ''
                                                        )}"

                                                        data-fornecedor="${escapeHTML(
                                                            m.fornecedor || ''
                                                        )}"

                                                        data-estado="${escapeHTML(
                                                            m.estado || 'Bom'
                                                        )}"

                                                        data-estoqueminimo="${m.estoqueMinimo ?? 0}"

                                                    >

                                                        <i class="fas fa-edit"></i>

                                                    </button>


                                                    <button
                                                        type="button"
                                                        class="btn-danger remove-material"

                                                        data-id="${escapeHTML(
                                                            m.id
                                                        )}"

                                                        data-nome="${escapeHTML(
                                                            m.nome || 'Material'
                                                        )}"

                                                    >

                                                        <i class="fas fa-trash"></i>

                                                    </button>

                                                </td>

                                            </tr>

                                        `
                                        )
                                        .join('')

                                    : `

                                        <tr>

                                            <td colspan="9">

                                                Nenhum material

                                            </td>

                                        </tr>

                                    `
                            }

                        </tbody>

                    </table>

                </div>

            </div>


            <div
                id="lixeiraContainer"
                style="display:none;"
            >

                <div class="form-card">

                    <div
                        class="form-header"
                        style="
                            display:flex;
                            justify-content:space-between;
                            align-items:center;
                            margin-bottom:16px;
                        "
                    >

                        <h3
                            style="
                                font-size:16px;
                                font-weight:600;
                            "
                        >

                            <i class="fas fa-trash"></i>

                            Lixeira (${lixeiraList.length})

                        </h3>


                        <div
                            style="
                                display:flex;
                                gap:8px;
                            "
                        >

                            <button
                                id="btnRestaurarSelecionados"
                                type="button"
                                class="btn-success btn-small-action"
                                style="display:none;"
                            >

                                <i class="fas fa-undo"></i>

                                Restaurar Selecionados

                            </button>


                            <button
                                id="btnDeletarSelecionados"
                                type="button"
                                class="btn-danger btn-small-action"
                                style="display:none;"
                            >

                                <i class="fas fa-trash"></i>

                                Deletar Selecionados

                            </button>


                            <button
                                id="btnFecharLixeira"
                                type="button"
                                class="btn-cancel btn-small-action"
                            >

                                <i class="fas fa-times"></i>

                                Fechar

                            </button>

                        </div>

                    </div>


                    <div style="margin-bottom:12px;">

                        <label
                            style="
                                cursor:pointer;
                                font-size:13px;
                            "
                        >

                            <input
                                type="checkbox"
                                id="selectAllLixeira"
                            >

                            Selecionar Todos

                        </label>

                    </div>


                    <div class="table-container">

                        <table>

                            <thead>

                                <tr>

                                    <th>
                                        <input
                                            type="checkbox"
                                            id="selectAllLixeira2"
                                        >
                                    </th>

                                    <th>
                                        Código
                                    </th>

                                    <th>
                                        Nome
                                    </th>

                                    <th>
                                        Qtd
                                    </th>

                                    <th>
                                        Categoria
                                    </th>

                                    <th>
                                        Fornecedor
                                    </th>

                                    <th>
                                        Data Exclusão
                                    </th>

                                    <th>
                                        Ações
                                    </th>

                                </tr>

                            </thead>


                            <tbody
                                id="lixeiraTableBody"
                            >

                                ${
                                    lixeiraList.length

                                        ? lixeiraList
                                            .map(
                                                m => `

                                                <tr>

                                                    <td>

                                                        <input
                                                            type="checkbox"
                                                            class="lixeira-checkbox"
                                                            data-id="${escapeHTML(
                                                                m.id
                                                            )}"
                                                        >

                                                    </td>


                                                    <td>

                                                        <strong>
                                                            ${escapeHTML(
                                                                m.codigo || '-'
                                                            )}
                                                        </strong>

                                                    </td>


                                                    <td>

                                                        ${escapeHTML(
                                                            m.nome || '-'
                                                        )}

                                                    </td>


                                                    <td>

                                                        ${m.quantidade ?? 0}

                                                    </td>


                                                    <td>

                                                        ${escapeHTML(
                                                            m.categoria || '-'
                                                        )}

                                                    </td>


                                                    <td>

                                                        ${escapeHTML(
                                                            m.fornecedor || '-'
                                                        )}

                                                    </td>


                                                    <td>

                                                        ${escapeHTML(
                                                            m.dataExclusao || '-'
                                                        )}

                                                    </td>


                                                    <td>

                                                        <button
                                                            type="button"
                                                            class="btn-success btn-small-action restaurar-material"

                                                            data-id="${escapeHTML(
                                                                m.id
                                                            )}"

                                                            data-nome="${escapeHTML(
                                                                m.nome || 'Material'
                                                            )}"
                                                        >

                                                            <i class="fas fa-undo"></i>

                                                            Restaurar

                                                        </button>


                                                        <button
                                                            type="button"
                                                            class="btn-danger btn-small-action deletar-permanente"

                                                            data-id="${escapeHTML(
                                                                m.id
                                                            )}"

                                                            data-nome="${escapeHTML(
                                                                m.nome || 'Material'
                                                            )}"
                                                        >

                                                            <i class="fas fa-trash"></i>

                                                            Deletar

                                                        </button>

                                                    </td>

                                                </tr>

                                            `
                                            )
                                            .join('')

                                        : `

                                            <tr>

                                                <td colspan="8">

                                                    Lixeira vazia

                                                </td>

                                            </tr>

                                        `
                                }

                            </tbody>

                        </table>

                    </div>

                </div>

            </div>

        `;


        document.getElementById(
            'tabMateriais'
        ).innerHTML =
            html;


        // ====================================================
        // FILTRO
        // ====================================================

        function aplicarFiltroMateriais() {

            const search =
                document.getElementById(
                    'searchMaterialInput'
                )?.value
                    .toLowerCase()
                    .trim() ||
                '';


            const categoria =
                document.getElementById(
                    'filterCategoriaInput'
                )?.value
                    .toLowerCase()
                    .trim() ||
                '';


            document
                .querySelectorAll(
                    '#materiaisTableBody tr'
                )
                .forEach(
                    row => {

                        const nome =
                            row.dataset.nome ||
                            '';

                        const codigo =
                            row.dataset.codigo ||
                            '';

                        const fornecedor =
                            row.dataset.fornecedor ||
                            '';

                        const cat =
                            row.dataset.categoria ||
                            '';


                        const atendeBusca =
                            nome.includes(search) ||
                            codigo.includes(search) ||
                            fornecedor.includes(search);


                        const atendeCategoria =
                            !categoria ||
                            cat.includes(categoria);


                        row.style.display =
                            atendeBusca &&
                            atendeCategoria
                                ? ''
                                : 'none';

                    }
                );

        }


        document
            .getElementById(
                'searchMaterialInput'
            )
            ?.addEventListener(
                'input',
                aplicarFiltroMateriais
            );


        document
            .getElementById(
                'filterCategoriaInput'
            )
            ?.addEventListener(
                'input',
                aplicarFiltroMateriais
            );


        document
            .getElementById(
                'clearFiltersBtn'
            )
            ?.addEventListener(
                'click',
                () => {

                    const search =
                        document.getElementById(
                            'searchMaterialInput'
                        );

                    const categoria =
                        document.getElementById(
                            'filterCategoriaInput'
                        );


                    if (search) {

                        search.value =
                            '';

                    }


                    if (categoria) {

                        categoria.value =
                            '';

                    }


                    aplicarFiltroMateriais();

                }
            );


        // ====================================================
        // LIXEIRA
        // ====================================================

        document
            .getElementById(
                'btnVerLixeira'
            )
            ?.addEventListener(
                'click',
                () => {

                    const container =
                        document.getElementById(
                            'lixeiraContainer'
                        );


                    if (!container) {
                        return;
                    }


                    container.style.display =
                        container.style.display === 'none'
                            ? 'block'
                            : 'none';


                    document
                        .getElementById(
                            'btnRestaurarSelecionados'
                        )
                        .style.display =
                            'none';


                    document
                        .getElementById(
                            'btnDeletarSelecionados'
                        )
                        .style.display =
                            'none';

                }
            );


        document
            .getElementById(
                'btnFecharLixeira'
            )
            ?.addEventListener(
                'click',
                () => {

                    document
                        .getElementById(
                            'lixeiraContainer'
                        )
                        .style.display =
                            'none';

                }
            );


        // ====================================================
        // SELECIONAR TODOS
        // ====================================================

        function atualizarBotoesLixeira() {

            const checkboxes =
                document.querySelectorAll(
                    '.lixeira-checkbox:checked'
                );


            const btnRestaurar =
                document.getElementById(
                    'btnRestaurarSelecionados'
                );


            const btnDeletar =
                document.getElementById(
                    'btnDeletarSelecionados'
                );


            if (
                checkboxes.length > 0
            ) {

                btnRestaurar.style.display =
                    'inline-flex';

                btnDeletar.style.display =
                    'inline-flex';

            } else {

                btnRestaurar.style.display =
                    'none';

                btnDeletar.style.display =
                    'none';

            }

        }


        document
            .getElementById(
                'selectAllLixeira'
            )
            ?.addEventListener(
                'change',
                function () {

                    document
                        .querySelectorAll(
                            '.lixeira-checkbox'
                        )
                        .forEach(
                            checkbox => {

                                checkbox.checked =
                                    this.checked;

                            }
                        );


                    atualizarBotoesLixeira();

                }
            );


        document
            .querySelectorAll(
                '.lixeira-checkbox'
            )
            .forEach(
                checkbox => {

                    checkbox.addEventListener(
                        'change',
                        atualizarBotoesLixeira
                    );

                }
            );


        // ====================================================
        // RESTAURAR SELECIONADOS
        // ====================================================

        document
            .getElementById(
                'btnRestaurarSelecionados'
            )
            ?.addEventListener(
                'click',
                async () => {

                    const checkboxes =
                        document.querySelectorAll(
                            '.lixeira-checkbox:checked'
                        );


                    const ids =
                        Array.from(
                            checkboxes
                        )
                            .map(
                                checkbox =>
                                    checkbox.dataset.id
                            );


                    if (
                        !ids.length
                    ) {

                        return;

                    }


                    if (
                        confirm(
                            `Restaurar ${ids.length} item(ns)?`
                        )
                    ) {

                        for (
                            const id
                            of ids
                        ) {

                            await restaurarMaterialHandler(
                                id
                            );

                        }


                        alert(
                            `✅ ${ids.length} item(ns) restaurados!`
                        );


                        await renderMateriais();

                    }

                }
            );


        // ====================================================
        // DELETAR SELECIONADOS
        // ====================================================

        document
            .getElementById(
                'btnDeletarSelecionados'
            )
            ?.addEventListener(
                'click',
                async () => {

                    const checkboxes =
                        document.querySelectorAll(
                            '.lixeira-checkbox:checked'
                        );


                    const ids =
                        Array.from(
                            checkboxes
                        )
                            .map(
                                checkbox =>
                                    checkbox.dataset.id
                            );


                    if (
                        !ids.length
                    ) {

                        return;

                    }


                    if (
                        confirm(
                            `⚠️ Deletar permanentemente ${ids.length} item(ns)?`
                        )
                    ) {

                        for (
                            const id
                            of ids
                        ) {

                            await deletarPermanentemente(
                                id
                            );

                        }


                        alert(
                            `✅ ${ids.length} item(ns) deletados permanentemente!`
                        );


                        await renderMateriais();

                    }

                }
            );


        // ====================================================
        // ADICIONAR MATERIAL
        // ====================================================

        async function cadastrarMaterial() {

            const codigo =
                document
                    .getElementById(
                        'newMaterialCodigo'
                    )
                    ?.value
                    .trim() ||
                '';


            const nome =
                document
                    .getElementById(
                        'newMaterialNome'
                    )
                    ?.value
                    .trim() ||
                '';


            const quantidade =
                parseFloat(
                    document
                        .getElementById(
                            'newMaterialQuantidade'
                        )
                        ?.value
                );


            const categoria =
                document
                    .getElementById(
                        'newMaterialCategoria'
                    )
                    ?.value
                    .trim() ||
                '';


            const fornecedor =
                document
                    .getElementById(
                        'newMaterialFornecedor'
                    )
                    ?.value
                    .trim() ||
                '';


            const estado =
                document
                    .getElementById(
                        'newMaterialEstado'
                    )
                    ?.value ||
                'Bom';


            const estoqueMinimo =
                parseFloat(
                    document
                        .getElementById(
                            'newMaterialEstoqueMinimo'
                        )
                        ?.value
                ) ||
                0;


            if (
                !codigo ||
                !nome ||
                isNaN(quantidade)
            ) {

                alert(
                    '⚠️ Preencha código, nome e quantidade!'
                );

                return;

            }


            try {

                const btn =
                    document.getElementById(
                        'btnAddMaterial'
                    );


                if (btn) {

                    btn.disabled =
                        true;

                    btn.innerHTML =
                        '<i class="fas fa-spinner fa-spin"></i> Cadastrando...';

                }


                const editor =
                    obterUsuarioAtual();


                await saveMaterial({

                    codigo,

                    nome,

                    quantidade,

                    categoria,

                    fornecedor,

                    estado,

                    estoqueMinimo,

                    adicionadoPor:
                        editor,

                    adicionadoPorUid:
                        currentUserGlobal?.uid ||
                        '',

                    dataAdicao:
                        new Date()
                            .toLocaleString(
                                'pt-BR'
                            )

                });


                alert(
                    `✅ Material cadastrado!\n\nAdicionado por: ${editor}`
                );


                await renderMateriais();


            } catch (error) {

                console.error(
                    'Erro ao cadastrar material:',
                    error
                );


                alert(
                    '❌ Não foi possível cadastrar o material:\n\n' +
                    error.message
                );

            } finally {

                const btn =
                    document.getElementById(
                        'btnAddMaterial'
                    );


                if (btn) {

                    btn.disabled =
                        false;

                    btn.innerHTML =
                        'Cadastrar';

                }

            }

        }


        document
            .getElementById(
                'btnAddMaterial'
            )
            ?.addEventListener(
                'click',
                cadastrarMaterial
            );


        // ====================================================
        // EDITAR MATERIAL
        // ====================================================

        document
            .querySelectorAll(
                '.edit-material'
            )
            .forEach(
                btn => {

                    btn.addEventListener(
                        'click',
                        () => {

                            openEditMaterialModal(

                                btn.dataset.id,

                                btn.dataset.nome,

                                btn.dataset.codigo,

                                btn.dataset.quantidade,

                                btn.dataset.categoria,

                                btn.dataset.fornecedor,

                                btn.dataset.estado,

                                btn.dataset.estoqueminimo

                            );

                        }
                    );

                }
            );


        // ====================================================
        // REMOVER MATERIAL
        // ====================================================

        document
            .querySelectorAll(
                '.remove-material'
            )
            .forEach(
                btn => {

                    btn.addEventListener(
                        'click',
                        async () => {

                            const nome =
                                btn.dataset.nome ||
                                'Material';


                            if (
                                confirm(
                                    `Mover "${nome}" para a lixeira?`
                                )
                            ) {

                                const result =
                                    await deleteMaterial(
                                        btn.dataset.id
                                    );


                                if (
                                    result.success
                                ) {

                                    alert(
                                        `✅ Material "${nome}" movido para a lixeira!`
                                    );


                                    await renderMateriais();

                                } else {

                                    alert(
                                        '❌ ' +
                                        result.error
                                    );

                                }

                            }

                        }
                    );

                }
            );


        // ====================================================
        // RESTAURAR
        // ====================================================

        document
            .querySelectorAll(
                '.restaurar-material'
            )
            .forEach(
                btn => {

                    btn.addEventListener(
                        'click',
                        async () => {

                            const nome =
                                btn.dataset.nome ||
                                'Material';


                            const result =
                                await restaurarMaterialHandler(
                                    btn.dataset.id
                                );


                            if (
                                result.success
                            ) {

                                alert(
                                    `✅ "${nome}" restaurado!`
                                );


                                await renderMateriais();

                            } else {

                                alert(
                                    '❌ ' +
                                    result.error
                                );

                            }

                        }
                    );

                }
            );


        // ====================================================
        // DELETAR PERMANENTE
        // ====================================================

        document
            .querySelectorAll(
                '.deletar-permanente'
            )
            .forEach(
                btn => {

                    btn.addEventListener(
                        'click',
                        async () => {

                            const nome =
                                btn.dataset.nome ||
                                'Material';


                            if (
                                confirm(
                                    `⚠️ Deletar permanentemente "${nome}"?`
                                )
                            ) {

                                const result =
                                    await deletarPermanentemente(
                                        btn.dataset.id
                                    );


                                if (
                                    result.success
                                ) {

                                    alert(
                                        `✅ "${nome}" deletado permanentemente!`
                                    );


                                    await renderMateriais();

                                } else {

                                    alert(
                                        '❌ ' +
                                        result.error
                                    );

                                }

                            }

                        }
                    );

                }
            );


    } catch (error) {

        console.error(
            'Erro ao renderizar materiais:',
            error
        );


        const container =
            document.getElementById(
                'tabMateriais'
            );


        if (container) {

            container.innerHTML = `

                <p
                    style="
                        color:#ef4444;
                    "
                >

                    Erro ao carregar materiais.

                </p>

            `;

        }

    }

}


// ============================================================
// MODAL EDITAR MATERIAL
// ============================================================

function openEditMaterialModal(
    id,
    nome,
    codigo,
    quantidade,
    categoria,
    fornecedor,
    estado,
    estoqueMinimo
) {

    document.getElementById(
        'modalTitle'
    ).innerHTML =
        '<i class="fas fa-edit"></i> Editar Material';


    document.getElementById(
        'modalBody'
    ).innerHTML = `

        <div class="form-group">

            <label>
                Código
            </label>

            <input
                type="text"
                id="editMaterialCodigo"
                value="${escapeHTML(codigo || '')}"
            >

        </div>


        <div class="form-group">

            <label>
                Nome
            </label>

            <input
                type="text"
                id="editMaterialNome"
                value="${escapeHTML(nome || '')}"
            >

        </div>


        <div class="form-group">

            <label>
                Quantidade (kg)
            </label>

            <input
                type="number"
                id="editMaterialQuantidade"
                value="${quantidade || 0}"
                step="any"
            >

        </div>


        <div class="form-group">

            <label>
                Categoria
            </label>

            <input
                type="text"
                id="editMaterialCategoria"
                value="${escapeHTML(categoria || '')}"
            >

        </div>


        <div class="form-group">

            <label>
                Fornecedor
            </label>

            <input
                type="text"
                id="editMaterialFornecedor"
                value="${escapeHTML(fornecedor || '')}"
            >

        </div>


        <div class="form-group">

            <label>
                Estado
            </label>

            <select id="editMaterialEstado">

                <option
                    value="Ótimo"
                    ${estado === 'Ótimo' ? 'selected' : ''}
                >
                    Ótimo
                </option>

                <option
                    value="Bom"
                    ${estado === 'Bom' ? 'selected' : ''}
                >
                    Bom
                </option>

                <option
                    value="Regular"
                    ${estado === 'Regular' ? 'selected' : ''}
                >
                    Regular
                </option>

                <option
                    value="Ruim"
                    ${estado === 'Ruim' ? 'selected' : ''}
                >
                    Ruim
                </option>

            </select>

        </div>


        <div class="form-group">

            <label>
                Estoque Mínimo (kg)
            </label>

            <input
                type="number"
                id="editMaterialEstoqueMinimo"
                value="${estoqueMinimo || 0}"
                step="any"
            >

        </div>

    `;


    document.getElementById(
        'editModal'
    ).style.display =
        'block';


    document.getElementById(
        'saveModalBtn'
    ).onclick =
        async () => {

            try {

                const data = {

                    codigo:
                        document
                            .getElementById(
                                'editMaterialCodigo'
                            )
                            .value
                            .trim(),

                    nome:
                        document
                            .getElementById(
                                'editMaterialNome'
                            )
                            .value
                            .trim(),

                    quantidade:
                        parseFloat(
                            document
                                .getElementById(
                                    'editMaterialQuantidade'
                                )
                                .value
                        ),

                    categoria:
                        document
                            .getElementById(
                                'editMaterialCategoria'
                            )
                            .value
                            .trim(),

                    fornecedor:
                        document
                            .getElementById(
                                'editMaterialFornecedor'
                            )
                            .value
                            .trim(),

                    estado:
                        document
                            .getElementById(
                                'editMaterialEstado'
                            )
                            .value,

                    estoqueMinimo:
                        parseFloat(
                            document
                                .getElementById(
                                    'editMaterialEstoqueMinimo'
                                )
                                .value
                        ) || 0

                };


                if (
                    !data.nome ||
                    isNaN(data.quantidade)
                ) {

                    alert(
                        '⚠️ Preencha nome e quantidade!'
                    );

                    return;

                }


                /*
                 * IMPORTANTE:
                 *
                 * Não substituímos adicionadoPor.
                 * Portanto permanece o usuário original
                 * que cadastrou o material.
                 */

                await saveMaterial(
                    data,
                    id
                );


                alert(
                    '✅ Material atualizado!'
                );


                document.getElementById(
                    'editModal'
                ).style.display =
                    'none';


                await renderMateriais();

            } catch (error) {

                console.error(
                    'Erro ao editar material:',
                    error
                );


                alert(
                    '❌ Não foi possível atualizar o material:\n\n' +
                    error.message
                );

            }

        };

}