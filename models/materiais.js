import { db } from '../firebaseConfig.js';
import { isOnline } from '../auth.js';
import { ref, get, set, push, update, remove } from "firebase/database";

let currentUserRole = null, currentUserGlobal = null, isUsingLocalData = false;

export function setUserData(user, role, localFlag) {
    currentUserGlobal = user;
    currentUserRole = role;
    isUsingLocalData = localFlag || false;
}

let localData = {
    materiais: [],
    lixeira: []
};


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
// MATERIAIS
// ============================================================

async function getMateriais() {

    try {

        const turmaId =
            obterTurmaId();

        if (!turmaId) {

            return [];

        }

        if (
            isOnline &&
            !isUsingLocalData
        ) {

            const snapshot =
                await get(
                    ref(
                        db,
                        `turmas/${turmaId}/materiais`
                    )
                );

            if (snapshot.exists()) {

                const data =
                    snapshot.val();

                return Object.keys(
                    data
                ).map(
                    key => ({
                        id: key,
                        turmaId: turmaId,
                        ...data[key]
                    })
                );

            }

        }

        return localData.materiais;

    } catch (error) {

        return localData.materiais;

    }

}


// ============================================================
// LIXEIRA
// ============================================================

async function getLixeira() {

    try {

        const turmaId =
            obterTurmaId();

        if (!turmaId) {

            return [];

        }

        if (
            isOnline &&
            !isUsingLocalData
        ) {

            const snapshot =
                await get(
                    ref(
                        db,
                        `turmas/${turmaId}/lixeira_materiais`
                    )
                );

            if (snapshot.exists()) {

                const data =
                    snapshot.val();

                return Object.keys(
                    data
                ).map(
                    key => ({
                        id: key,
                        turmaId: turmaId,
                        ...data[key]
                    })
                );

            }

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

        if (!turmaId) {

            console.warn(
                'Nenhuma turma selecionada para salvar material.'
            );

            return id;

        }


        const dadosComTurma =
            {
                ...data,
                turmaId: turmaId
            };


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
                    dadosComTurma
                );

            } else {

                const newRef =
                    push(
                        ref(
                            db,
                            `turmas/${turmaId}/materiais`
                        )
                    );

                await set(
                    newRef,
                    dadosComTurma
                );

                return newRef.key;

            }

            return id;

        }


        if (id) {

            const idx =
                localData.materiais.findIndex(
                    m =>
                        m.id === id
                );

            if (idx !== -1) {

                localData.materiais[idx] =
                    {
                        ...dadosComTurma,
                        id: id
                    };

            }

        } else {

            const newId =
                'm' +
                Date.now();

            localData.materiais.push(
                {
                    ...dadosComTurma,
                    id: newId
                }
            );

            return newId;

        }

        return id;

    } catch (error) {

        console.error(
            'Erro ao salvar material:',
            error
        );

        return id;

    }

}


// ============================================================
// EXCLUIR MATERIAL
// ============================================================

async function deleteMaterial(
    id
) {

    try {

        console.log(
            '🗑️ Removendo material:',
            id
        );


        const turmaId =
            obterTurmaId();


        if (!turmaId) {

            return {

                success: false,

                error:
                    'Nenhuma turma selecionada.'

            };

        }


        let materialData = {};


        if (isOnline) {

            const snapshot =
                await get(
                    ref(
                        db,
                        `turmas/${turmaId}/materiais/${id}`
                    )
                );


            if (snapshot.exists()) {

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
                            .toLocaleString()

                }
            );


            await remove(
                ref(
                    db,
                    `turmas/${turmaId}/materiais/${id}`
                )
            );


            console.log(
                '✅ Material movido para lixeira'
            );

        } else {

            const idx =
                localData.materiais.findIndex(
                    m =>
                        m.id === id
                );


            if (idx !== -1) {

                materialData =
                    localData.materiais[idx];


                localData.materiais.splice(
                    idx,
                    1
                );


                localData.lixeira.push(
                    {

                        ...materialData,

                        turmaId:
                            turmaId,

                        dataExclusao:
                            new Date()
                                .toLocaleString()

                    }
                );

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
// RESTAURAR MATERIAL
// ============================================================

async function restaurarMaterialHandler(
    id
) {

    try {

        console.log(
            '🔄 Restaurando material:',
            id
        );


        const turmaId =
            obterTurmaId();


        if (!turmaId) {

            return {

                success: false,

                error:
                    'Nenhuma turma selecionada.'

            };

        }


        if (isOnline) {

            const lixeiraRef =
                ref(
                    db,
                    `turmas/${turmaId}/lixeira_materiais/${id}`
                );


            const snapshot =
                await get(
                    lixeiraRef
                );


            if (snapshot.exists()) {

                const data =
                    snapshot.val();


                delete data.dataExclusao;


                await set(
                    ref(
                        db,
                        `turmas/${turmaId}/materiais/${id}`
                    ),
                    {

                        ...data,

                        turmaId:
                            turmaId

                    }
                );


                await remove(
                    lixeiraRef
                );


                console.log(
                    '✅ Material restaurado!'
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


            if (idx !== -1) {

                const data =
                    localData.lixeira[idx];


                delete data.dataExclusao;


                localData.materiais.push(
                    {

                        ...data,

                        id:
                            id,

                        turmaId:
                            turmaId

                    }
                );


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
                'Material não encontrado na lixeira'

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

        console.log(
            '🗑️ Deletando permanentemente:',
            id
        );


        const turmaId =
            obterTurmaId();


        if (!turmaId) {

            return {

                success: false,

                error:
                    'Nenhuma turma selecionada.'

            };

        }


        if (isOnline) {

            await remove(
                ref(
                    db,
                    `turmas/${turmaId}/lixeira_materiais/${id}`
                )
            );


            console.log(
                '✅ Material deletado permanentemente'
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

        let materiaisList =
            await getMateriais();


        let lixeiraList =
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
                            placeholder="PP001">

                    </div>


                    <div class="form-group">

                        <label>
                            Nome
                        </label>

                        <input
                            type="text"
                            id="newMaterialNome"
                            placeholder="Nome">

                    </div>


                    <div class="form-group">

                        <label>
                            Quantidade (kg)
                        </label>

                        <input
                            type="number"
                            id="newMaterialQuantidade"
                            step="any">

                    </div>


                    <div class="form-group">

                        <label>
                            Categoria
                        </label>

                        <input
                            type="text"
                            id="newMaterialCategoria"
                            placeholder="Categoria">

                    </div>


                    <div class="form-group">

                        <label>
                            Fornecedor
                        </label>

                        <input
                            type="text"
                            id="newMaterialFornecedor"
                            placeholder="Fornecedor">

                    </div>


                    <div class="form-group">

                        <label>
                            Estado
                        </label>

                        <select
                            id="newMaterialEstado">

                            <option value="Ótimo">
                                Ótimo
                            </option>

                            <option
                                value="Bom"
                                selected>

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
                            step="any">

                    </div>

                </div>


                <button
                    id="btnAddMaterial"
                    class="btn-primary">

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
                        placeholder="Buscar...">


                    <input
                        type="text"
                        id="filterCategoriaInput"
                        placeholder="Categoria...">


                    <button
                        id="clearFiltersBtn"
                        class="btn-warning"
                        style="width:auto; padding:8px 16px;">

                        Limpar

                    </button>

                </div>

            </div>


            <div class="form-card">

                <div
                    class="form-header"
                    style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">

                    <h3
                        style="font-size:16px; font-weight:600;">

                        Materiais (${materiaisList.length})

                    </h3>


                    <button
                        id="btnVerLixeira"
                        class="btn-warning btn-small-action">

                        <i class="fas fa-trash"></i>

                        Lixeira (${lixeiraList.length})

                    </button>

                </div>


                <div class="table-container">

                    <table>

                        <thead>

                            <tr>

                                <th>Código</th>

                                <th>Nome</th>

                                <th>Qtd</th>

                                <th>Categoria</th>

                                <th>Fornecedor</th>

                                <th>Estado</th>

                                <th>Est. Mín</th>

                                <th>Ações</th>

                            </tr>

                        </thead>


                        <tbody
                            id="materiaisTableBody">

                            ${materiaisList.map(
                                m => `

                                <tr
                                    data-nome="${(m.nome||'').toLowerCase()}"
                                    data-codigo="${(m.codigo||'').toLowerCase()}"
                                    data-fornecedor="${(m.fornecedor||'').toLowerCase()}"
                                    data-categoria="${(m.categoria||'').toLowerCase()}">

                                    <td>

                                        <strong>
                                            ${m.codigo}
                                        </strong>

                                    </td>


                                    <td>
                                        ${m.nome}
                                    </td>


                                    <td>
                                        ${m.quantidade}
                                    </td>


                                    <td>
                                        ${m.categoria || '-'}
                                    </td>


                                    <td>
                                        ${m.fornecedor || '-'}
                                    </td>


                                    <td>
                                        ${m.estado || 'Bom'}
                                    </td>


                                    <td>
                                        ${m.estoqueMinimo || '-'}
                                    </td>


                                    <td>

                                        <button
                                            class="btn-edit edit-material"
                                            data-id="${m.id}"
                                            data-nome="${m.nome}"
                                            data-codigo="${m.codigo}"
                                            data-quantidade="${m.quantidade}"
                                            data-categoria="${m.categoria||''}"
                                            data-fornecedor="${m.fornecedor||''}"
                                            data-estado="${m.estado||'Bom'}"
                                            data-estoqueminimo="${m.estoqueMinimo||0}">

                                            <i class="fas fa-edit"></i>

                                        </button>


                                        <button
                                            class="btn-danger remove-material"
                                            data-id="${m.id}"
                                            data-nome="${m.nome}">

                                            <i class="fas fa-trash"></i>

                                        </button>

                                    </td>

                                </tr>

                            `
                            ).join('') || `

                                <tr>

                                    <td colspan="8">
                                        Nenhum material
                                    </td>

                                </tr>

                            `}

                        </tbody>

                    </table>

                </div>

            </div>


            <div
                id="lixeiraContainer"
                style="display:none;">

                <div class="form-card">

                    <div
                        class="form-header"
                        style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">

                        <h3
                            style="font-size:16px; font-weight:600;">

                            <i class="fas fa-trash"></i>

                            Lixeira (${lixeiraList.length})

                        </h3>


                        <div
                            style="display:flex; gap:8px;">

                            <button
                                id="btnRestaurarSelecionados"
                                class="btn-success btn-small-action"
                                style="display:none;">

                                <i class="fas fa-undo"></i>

                                Restaurar Selecionados

                            </button>


                            <button
                                id="btnDeletarSelecionados"
                                class="btn-danger btn-small-action"
                                style="display:none;">

                                <i class="fas fa-trash"></i>

                                Deletar Selecionados

                            </button>


                            <button
                                id="btnFecharLixeira"
                                class="btn-cancel btn-small-action">

                                <i class="fas fa-times"></i>

                                Fechar

                            </button>

                        </div>

                    </div>


                    <div style="margin-bottom:12px;">

                        <label
                            style="cursor:pointer; font-size:13px;">

                            <input
                                type="checkbox"
                                id="selecionarTodosLixeira">

                            Selecionar Todos

                        </label>

                    </div>


                    <div class="table-container">

                        <table>

                            <thead>

                                <tr>

                                    <th style="width:30px;">

                                        <input
                                            type="checkbox"
                                            id="selectAllLixeira">

                                    </th>

                                    <th>Código</th>

                                    <th>Nome</th>

                                    <th>Qtd</th>

                                    <th>Categoria</th>

                                    <th>Fornecedor</th>

                                    <th>Data Exclusão</th>

                                    <th>Ações</th>

                                </tr>

                            </thead>


                            <tbody
                                id="lixeiraTableBody">

                                ${lixeiraList.map(
                                    m => `

                                    <tr>

                                        <td>

                                            <input
                                                type="checkbox"
                                                class="lixeira-checkbox"
                                                data-id="${m.id}">

                                        </td>


                                        <td>
                                            <strong>
                                                ${m.codigo}
                                            </strong>
                                        </td>


                                        <td>
                                            ${m.nome}
                                        </td>


                                        <td>
                                            ${m.quantidade}
                                        </td>


                                        <td>
                                            ${m.categoria || '-'}
                                        </td>


                                        <td>
                                            ${m.fornecedor || '-'}
                                        </td>


                                        <td>
                                            ${m.dataExclusao || '-'}
                                        </td>


                                        <td>

                                            <button
                                                class="btn-success btn-small-action restaurar-material"
                                                data-id="${m.id}"
                                                data-nome="${m.nome}">

                                                <i class="fas fa-undo"></i>

                                                Restaurar

                                            </button>


                                            <button
                                                class="btn-danger btn-small-action deletar-permanente"
                                                data-id="${m.id}"
                                                data-nome="${m.nome}">

                                                <i class="fas fa-trash"></i>

                                                Deletar

                                            </button>

                                        </td>

                                    </tr>

                                `
                                ).join('') || `

                                    <tr>

                                        <td colspan="8">
                                            Lixeira vazia
                                        </td>

                                    </tr>

                                `}

                            </tbody>

                        </table>

                    </div>

                </div>

            </div>

        `;


        document.getElementById(
            'tabMateriais'
        ).innerHTML = html;


        // ====================================================
        // FILTRO DE MATERIAIS
        // ====================================================

        document
            .getElementById(
                'searchMaterialInput'
            )
            ?.addEventListener(
                'input',
                () => {

                    const search =
                        document
                            .getElementById(
                                'searchMaterialInput'
                            )
                            .value
                            .toLowerCase();


                    const categoria =
                        document
                            .getElementById(
                                'filterCategoriaInput'
                            )
                            .value
                            .toLowerCase();


                    document
                        .querySelectorAll(
                            '#materiaisTableBody tr'
                        )
                        .forEach(
                            row => {

                                const nome =
                                    row.dataset.nome || '';

                                const codigo =
                                    row.dataset.codigo || '';

                                const fornecedor =
                                    row.dataset.fornecedor || '';

                                const cat =
                                    row.dataset.categoria || '';


                                row.style.display =

                                    (
                                        nome.includes(search) ||
                                        codigo.includes(search) ||
                                        fornecedor.includes(search)
                                    ) &&

                                    (
                                        !categoria ||
                                        cat.includes(categoria)
                                    )

                                        ? ''
                                        : 'none';

                            }
                        );

                }
            );


        document
            .getElementById(
                'filterCategoriaInput'
            )
            ?.addEventListener(
                'input',
                () => {

                    const search =
                        document
                            .getElementById(
                                'searchMaterialInput'
                            )
                            .value
                            .toLowerCase();


                    const categoria =
                        document
                            .getElementById(
                                'filterCategoriaInput'
                            )
                            .value
                            .toLowerCase();


                    document
                        .querySelectorAll(
                            '#materiaisTableBody tr'
                        )
                        .forEach(
                            row => {

                                const nome =
                                    row.dataset.nome || '';

                                const codigo =
                                    row.dataset.codigo || '';

                                const fornecedor =
                                    row.dataset.fornecedor || '';

                                const cat =
                                    row.dataset.categoria || '';


                                row.style.display =

                                    (
                                        nome.includes(search) ||
                                        codigo.includes(search) ||
                                        fornecedor.includes(search)
                                    ) &&

                                    (
                                        !categoria ||
                                        cat.includes(categoria)
                                    )

                                        ? ''
                                        : 'none';

                            }
                        );

                }
            );


        document
            .getElementById(
                'clearFiltersBtn'
            )
            ?.addEventListener(
                'click',
                () => {

                    document
                        .getElementById(
                            'searchMaterialInput'
                        )
                        .value = '';


                    document
                        .getElementById(
                            'filterCategoriaInput'
                        )
                        .value = '';


                    document
                        .querySelectorAll(
                            '#materiaisTableBody tr'
                        )
                        .forEach(
                            row =>
                                row.style.display = ''
                        );

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


                    container.style.display =

                        container.style.display ===
                        'none'

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


        document
            .getElementById(
                'selectAllLixeira'
            )
            ?.addEventListener(
                'change',
                function () {

                    const checkboxes =
                        document.querySelectorAll(
                            '.lixeira-checkbox'
                        );


                    checkboxes.forEach(
                        cb =>
                            cb.checked =
                                this.checked
                    );


                    toggleBotoesLixeira();

                }
            );


        document
            .querySelectorAll(
                '.lixeira-checkbox'
            )
            .forEach(
                cb => {

                    cb.addEventListener(
                        'change',
                        toggleBotoesLixeira
                    );

                }
            );


        function toggleBotoesLixeira() {

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
                            cb =>
                                cb.dataset.id
                        );


                    if (
                        ids.length === 0
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


                        renderMateriais();

                    }

                }
            );


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
                            cb =>
                                cb.dataset.id
                        );


                    if (
                        ids.length === 0
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


                        renderMateriais();

                    }

                }
            );


        // ====================================================
        // CADASTRAR
        // ====================================================

        document
            .getElementById(
                'btnAddMaterial'
            )
            ?.addEventListener(
                'click',
                addMaterial
            );


        // ====================================================
        // EDITAR
        // ====================================================

        document
            .querySelectorAll(
                '.edit-material'
            )
            .forEach(
                btn => {

                    btn.addEventListener(
                        'click',
                        () =>
                            openEditMaterialModal(

                                btn.dataset.id,

                                btn.dataset.nome,

                                btn.dataset.codigo,

                                btn.dataset.quantidade,

                                btn.dataset.categoria,

                                btn.dataset.fornecedor,

                                btn.dataset.estado,

                                btn.dataset.estoqueminimo

                            )
                    );

                }
            );


        // ====================================================
        // REMOVER
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
                                btn.dataset.nome;


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


                                    renderMateriais();

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
                                btn.dataset.nome;


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


                                renderMateriais();

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
        // DELETAR PERMANENTEMENTE
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
                                btn.dataset.nome;


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


                                    renderMateriais();

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


        document.getElementById(
            'tabMateriais'
        ).innerHTML =
            '<p style="color:#ef4444;">Erro ao carregar materiais.</p>';

    }

}


// ============================================================
// ADICIONAR MATERIAL
// ============================================================

async function addMaterial() {

    const turmaId =
        obterTurmaId();


    if (!turmaId) {

        alert(
            '⚠️ Selecione uma turma antes de cadastrar materiais!'
        );

        return;

    }


    const codigo =
        document
            .getElementById(
                'newMaterialCodigo'
            )
            .value;


    const nome =
        document
            .getElementById(
                'newMaterialNome'
            )
            .value;


    const quantidade =
        parseFloat(
            document
                .getElementById(
                    'newMaterialQuantidade'
                )
                .value
        );


    const categoria =
        document
            .getElementById(
                'newMaterialCategoria'
            )
            .value;


    const fornecedor =
        document
            .getElementById(
                'newMaterialFornecedor'
            )
            .value;


    const estado =
        document
            .getElementById(
                'newMaterialEstado'
            )
            .value;


    const estoqueMinimo =
        parseFloat(
            document
                .getElementById(
                    'newMaterialEstoqueMinimo'
                )
                .value
        ) || 0;


    if (
        !codigo ||
        !nome ||
        isNaN(
            quantidade
        )
    ) {

        alert(
            'Preencha código, nome e quantidade!'
        );

        return;

    }


    await saveMaterial(

        {

            codigo,

            nome,

            quantidade,

            categoria,

            fornecedor,

            estado,

            estoqueMinimo,

            turmaId

        }

    );


    alert(
        '✅ Material cadastrado!'
    );


    renderMateriais();

}


// ============================================================
// EDITAR MATERIAL
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
                value="${codigo}">

        </div>


        <div class="form-group">

            <label>
                Nome
            </label>

            <input
                type="text"
                id="editMaterialNome"
                value="${nome}">

        </div>


        <div class="form-group">

            <label>
                Quantidade (kg)
            </label>

            <input
                type="number"
                id="editMaterialQuantidade"
                value="${quantidade}"
                step="any">

        </div>


        <div class="form-group">

            <label>
                Categoria
            </label>

            <input
                type="text"
                id="editMaterialCategoria"
                value="${categoria || ''}">

        </div>


        <div class="form-group">

            <label>
                Fornecedor
            </label>

            <input
                type="text"
                id="editMaterialFornecedor"
                value="${fornecedor || ''}">

        </div>


        <div class="form-group">

            <label>
                Estado
            </label>

            <select
                id="editMaterialEstado">

                <option
                    value="Ótimo"
                    ${estado === 'Ótimo' ? 'selected' : ''}>

                    Ótimo

                </option>


                <option
                    value="Bom"
                    ${estado === 'Bom' ? 'selected' : ''}>

                    Bom

                </option>


                <option
                    value="Regular"
                    ${estado === 'Regular' ? 'selected' : ''}>

                    Regular

                </option>


                <option
                    value="Ruim"
                    ${estado === 'Ruim' ? 'selected' : ''}>

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
                step="any">

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


            const turmaId =
                obterTurmaId();


            if (!turmaId) {

                alert(
                    '⚠️ Nenhuma turma selecionada.'
                );

                return;

            }


            const data = {

                codigo:
                    document.getElementById(
                        'editMaterialCodigo'
                    ).value,

                nome:
                    document.getElementById(
                        'editMaterialNome'
                    ).value,

                quantidade:
                    parseFloat(
                        document.getElementById(
                            'editMaterialQuantidade'
                        ).value
                    ),

                categoria:
                    document.getElementById(
                        'editMaterialCategoria'
                    ).value,

                fornecedor:
                    document.getElementById(
                        'editMaterialFornecedor'
                    ).value,

                estado:
                    document.getElementById(
                        'editMaterialEstado'
                    ).value,

                estoqueMinimo:
                    parseFloat(
                        document.getElementById(
                            'editMaterialEstoqueMinimo'
                        ).value
                    ) || 0,

                turmaId:
                    turmaId

            };


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


            renderMateriais();

        };

}