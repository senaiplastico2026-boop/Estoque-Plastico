import { db } from './firebaseConfig.js'; 
 
import { 
    userExtraInfo, 
    isOnline 
} from './auth.js'; 
 
import { 
    ref, 
    get 
} from 'firebase/database'; 
 
 
let currentUserGlobal = null; 
let currentUserRole = null; 
let isUsingLocalData = false; 
 
 
// ========================================================= 
// USER DATA 
// ========================================================= 
 
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
 
 
// ========================================================= 
// BUSCAR DADOS 
// ========================================================= 
 
async function getData( 
    collectionName 
) { 
 
    try { 
 
        if ( 
            !isOnline || 
            isUsingLocalData 
        ) { 
            return []; 
        } 
 
 
        const snapshot = 
            await get( 
                ref( 
                    db, 
                    collectionName 
                ) 
            ); 
 
 
        if (!snapshot.exists()) { 
            return []; 
        } 
 
 
        const data = 
            snapshot.val(); 
 
 
        if ( 
            collectionName === 'materiais' 
        ) { 
 
            return Object.keys(data) 
                .map(key => ({ 
                    id: key, 
                    ...data[key] 
                })); 
        } 
 
 
        return data; 
 
    } catch (error) { 
 
        console.error( 
            'Erro buscando:', 
            collectionName, 
            error 
        ); 
 
        return []; 
    } 
} 
 
 
// ========================================================= 
// DASHBOARD 
// ========================================================= 
 
export async function renderDashboard() { 
 
    const container = 
        document.getElementById( 
            'tabDashboard' 
        ); 
 
 
    if (!container) { 
        return; 
    } 
 
 
    try { 
 
        const materiais = 
            await getData( 
                'materiais' 
            ); 
 
 
        const moinho = 
            await getData( 
                'moinho' 
            ); 
 
 
        const listaMoinho = 
            moinho?.materiais || []; 
 
 
        const totalMateriais = 
            materiais.length; 
 
 
        const totalQuantidade = 
            materiais.reduce( 
                (total, material) => 
                    total + 
                    Number( 
                        material.quantidade || 0 
                    ), 
                0 
            ); 
 
 
        const quantidadeMoinho = 
            listaMoinho.length; 
 
 
        const pesoMoinho = 
            listaMoinho.reduce( 
                (total, material) => 
                    total + 
                    Number( 
                        material.peso || 0 
                    ), 
                0 
            ); 
 
 
        const capacidade = 
            Number( 
                moinho?.capacidadeMax || 
                900 
            ); 
 
 
        const percentual = 
            capacidade > 0 
                ? Math.min( 
                    (pesoMoinho / capacidade) * 100, 
                    100 
                ) 
                : 0; 
 
 
        const nome = 
            userExtraInfo?.nome || 
            currentUserGlobal?.email?.split('@')[0] || 
            'Usuário'; 
 
 
        let statusTexto = 
            'Capacidade normal'; 
 
        let statusClass = 
            'normal'; 
 
 
        if (percentual >= 90) { 
 
            statusTexto = 
                'Capacidade crítica'; 
 
            statusClass = 
                'danger'; 
 
        } else if (percentual >= 70) { 
 
            statusTexto = 
                'Atenção à capacidade'; 
 
            statusClass = 
                'warning'; 
        } 
 
 
        container.innerHTML = ` 
 
            <!-- BOAS-VINDAS --> 
 
            <div class="dashboard-welcome"> 
 
                <div> 
 
                    <h2> 
                        Olá, ${nome}! 👋 
                    </h2> 
 
                    <p> 
                        Aqui está um resumo do gerenciamento de plásticos. 
                    </p> 
 
                </div> 
 
 
                <div class="dashboard-status"> 
 
                    <i class="fas fa-circle"></i> 
 
                    ${isOnline 
                        ? 'Sistema online' 
                        : 'Modo offline' 
                    } 
 
                </div> 
 
            </div> 
 
 
            <!-- CARDS --> 
 
            <div 
                class="dashboard-grid" 
                style=" 
                    gap:18px; 
                    margin-bottom:20px; 
                " 
            > 
 
 
                <div 
                    class="dashboard-card" 
                    style=" 
                        min-height:165px; 
                        padding:22px; 
                    " 
                > 
 
                    <div class="dashboard-card-top"> 
 
                        <div> 
 
                            <div class="dashboard-card-label"> 
                                Materiais cadastrados 
                            </div> 
 
                            <div class="dashboard-card-value"> 
                                ${totalMateriais} 
                            </div> 
 
                        </div> 
 
 
                        <div class="dashboard-icon"> 
 
                            <i class="fas fa-cubes"></i> 
 
                        </div> 
 
                    </div> 
 
 
                    <div class="dashboard-card-footer"> 
 
                        Quantidade total: 
                        <strong> 
                            ${totalQuantidade} kg 
                        </strong> 
 
                    </div> 
 
                </div> 
 
 
                <div 
                    class="dashboard-card" 
                    style=" 
                        min-height:165px; 
                        padding:22px; 
                    " 
                > 
 
                    <div class="dashboard-card-top"> 
 
                        <div> 
 
                            <div class="dashboard-card-label"> 
                                Materiais no moinho 
                            </div> 
 
                            <div class="dashboard-card-value"> 
                                ${quantidadeMoinho} 
                            </div> 
 
                        </div> 
 
 
                        <div class="dashboard-icon"> 
 
                            <i class="fas fa-recycle"></i> 
 
                        </div> 
 
                    </div> 
 
 
                    <div class="dashboard-card-footer"> 
 
                        Peso total: 
                        <strong> 
                            ${pesoMoinho} T 
                        </strong> 
 
                    </div> 
 
                </div> 
 
 
                <div 
                    class="dashboard-card" 
                    style=" 
                        min-height:165px; 
                        padding:22px; 
                    " 
                > 
 
                    <div class="dashboard-card-top"> 
 
                        <div> 
 
                            <div class="dashboard-card-label"> 
                                Capacidade do moinho 
                            </div> 
 
                            <div class="dashboard-card-value"> 
                                ${percentual.toFixed(1)}% 
                            </div> 
 
                        </div> 
 
 
                        <div class="dashboard-icon"> 
 
                            <i class="fas fa-gauge-high"></i> 
 
                        </div> 
 
                    </div> 
 
 
                    <div class="dashboard-card-footer"> 
 
                        ${statusTexto} 
 
                    </div> 
 
                </div> 
 
 
            </div> 
 
 
            <!-- MOINHO --> 
 
            <div 
                class="dashboard-card" 
                style=" 
                    margin-bottom:10px; 
                " 
            > 
 
                <div 
                    style=" 
                        display:flex; 
                        justify-content:space-between; 
                        align-items:center; 
                        gap:15px; 
                        margin-bottom:15px; 
                    " 
                > 
 
                    <div> 
 
                        <div 
                            style=" 
                                font-size:14px; 
                                font-weight:700; 
                                margin-bottom:4px; 
                            " 
                        > 
                            Capacidade do moinho 
                        </div> 
 
                        <div 
                            style=" 
                                font-size:11px; 
                                color:var(--text-secondary); 
                            " 
                        > 
                            Acompanhamento do material reciclado 
                        </div> 
 
                    </div> 
 
 
                    <strong> 
                        ${pesoMoinho} / ${capacidade} T 
                    </strong> 
 
                </div> 
 
 
                <div 
                    style=" 
                        width:100%; 
                        height:10px; 
                        background:var(--border); 
                        border-radius:20px; 
                        overflow:hidden; 
                    " 
                > 
 
                    <div 
                        style=" 
                            width:${percentual}%; 
                            height:100%; 
                            background: 
                                ${statusClass === 'danger' 
                                    ? '#dc2626' 
                                    : statusClass === 'warning' 
                                        ? '#f59e0b' 
                                        : '#10b981' 
                                }; 
                            border-radius:20px; 
                            transition:width .5s ease; 
                        " 
                    ></div> 
 
                </div> 
 
 
                <div 
                    style=" 
                        display:flex; 
                        justify-content:space-between; 
                        margin-top:8px; 
                        color:var(--text-secondary); 
                        font-size:10px; 
                    " 
                > 
 
                    <span> 
                        0 T 
                    </span> 
 
                    <span> 
                        ${capacidade} T 
                    </span> 
 
                </div> 
 
            </div> 
 
 
            <!-- INFORMAÇÃO --> 
 
            <div 
                class="dashboard-card" 
                style=" 
                    margin-top:10px; 
                    display:flex; 
                    align-items:center; 
                    gap:15px; 
                " 
            > 
 
                <div class="dashboard-icon"> 
 
                    <i class="fas fa-info"></i> 
 
                </div> 
 
 
                <div> 
 
                    <strong 
                        style=" 
                            display:block; 
                            margin-bottom:4px; 
                            font-size:13px; 
                        " 
                    > 
                        Gerenciamento de Plásticos 
                    </strong> 
 
                    <span 
                        style=" 
                            font-size:11px; 
                            color:var(--text-secondary); 
                        " 
                    > 
                        Sistema desenvolvido para auxiliar no controle 
                        dos materiais plásticos e do processo de reciclagem. 
                    </span> 
 
                </div> 
 
            </div> 
 
        `; 
 
    } catch (error) { 
 
        console.error( 
            'Erro dashboard:', 
            error 
        ); 
 
 
        container.innerHTML = ` 
 
            <div class="dashboard-card"> 
 
                <h3> 
                    Erro ao carregar dashboard 
                </h3> 
 
                <p> 
                    ${error.message} 
                </p> 
 
            </div> 
 
        `; 
    } 
}