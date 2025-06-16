// Configuración de la API
const API_URL = '/api';

// Referencias DOM
const transactionForm = document.getElementById('transaction-form');
const transactionsList = document.getElementById('transactions-list');
const transactionTemplate = document.getElementById('transaction-template');
const refreshBtn = document.getElementById('refresh-btn');
const modal = document.getElementById('edit-modal');
const closeModal = document.querySelector('.close');
const editForm = document.getElementById('edit-form');

// Referencias para balance
const totalIncomeEl = document.getElementById('total-income');
const totalExpensesEl = document.getElementById('total-expenses');
const totalBalanceEl = document.getElementById('total-balance');

// Charts
let expensesChart = null;
let incomeChart = null;

// Estado de la aplicación
let transactions = [];

// Función para formatear moneda
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR'
    }).format(amount);
}

// Función para formatear fecha
function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

// Cargar transacciones desde la API
async function loadTransactions() {
    transactionsList.innerHTML = '<div class="loading">Cargando transacciones...</div>';
    
    try {
        const response = await fetch(`${API_URL}/transactions`);
        if (!response.ok) throw new Error('Error al cargar las transacciones');
        
        transactions = await response.json();
        renderTransactions();
        loadBalance();
        updateCharts();
    } catch (error) {
        console.error('Error:', error);
        transactionsList.innerHTML = '<div class="loading">Error al cargar las transacciones. Intenta de nuevo.</div>';
    }
}

// Renderizar lista de transacciones
function renderTransactions() {
    if (transactions.length === 0) {
        transactionsList.innerHTML = '<div class="loading">No hay transacciones registradas</div>';
        return;
    }
    
    transactionsList.innerHTML = '';
    
    transactions.forEach(transaction => {
        const transactionEl = document.importNode(transactionTemplate.content, true);
        
        transactionEl.querySelector('.transaction-description').textContent = transaction.description;
        
        const amountEl = transactionEl.querySelector('.transaction-amount');
        amountEl.textContent = formatCurrency(transaction.amount);
        amountEl.classList.add(transaction.transaction_type === 'income' ? 'transaction-income' : 'transaction-expense');
        
        transactionEl.querySelector('.transaction-category').textContent = transaction.category;
        transactionEl.querySelector('.transaction-date').textContent = formatDate(transaction.transaction_date);
        
        const transactionItem = transactionEl.querySelector('.transaction-item');
        transactionItem.dataset.id = transaction.id;
        
        // Configurar botones de acción
        const editBtn = transactionEl.querySelector('.btn-edit');
        editBtn.addEventListener('click', () => openEditModal(transaction));
        
        const deleteBtn = transactionEl.querySelector('.btn-delete');
        deleteBtn.addEventListener('click', () => deleteTransaction(transaction.id));
        
        transactionsList.appendChild(transactionEl);
    });
}

// Cargar información del balance
async function loadBalance() {
    try {
        const response = await fetch(`${API_URL}/balance`);
        if (!response.ok) throw new Error('Error al cargar el balance');
        
        const balanceData = await response.json();
        
        totalIncomeEl.textContent = formatCurrency(balanceData.total_income || 0);
        totalExpensesEl.textContent = formatCurrency(balanceData.total_expenses || 0);
        totalBalanceEl.textContent = formatCurrency(balanceData.balance || 0);
    } catch (error) {
        console.error('Error:', error);
    }
}

// Actualizar gráficos
async function updateCharts() {
    try {
        const response = await fetch(`${API_URL}/summary`);
        if (!response.ok) throw new Error('Error al cargar el resumen');
        
        const summaryData = await response.json();
        
        // Preparar datos para los gráficos
        const expensesData = summaryData
            .filter(item => item.transaction_type === 'expense')
            .sort((a, b) => b.total - a.total);
            
        const incomeData = summaryData
            .filter(item => item.transaction_type === 'income')
            .sort((a, b) => b.total - a.total);
        
        // Crear o actualizar los gráficos
        createExpensesChart(expensesData);
        createIncomeChart(incomeData);
    } catch (error) {
        console.error('Error:', error);
    }
}

// Crear gráfico de gastos
function createExpensesChart(data) {
    const ctx = document.getElementById('expenses-chart').getContext('2d');
    
    // Destruir el gráfico anterior si existe
    if (expensesChart) {
        expensesChart.destroy();
    }
    
    // Colores para las categorías
    const colors = [
        '#dc3545', '#fd7e14', '#ffc107', '#20c997', '#0dcaf0', 
        '#6610f2', '#6f42c1', '#d63384', '#198754', '#0d6efd'
    ];
    
    expensesChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: data.map(item => item.category),
            datasets: [{
                data: data.map(item => item.total),
                backgroundColor: colors.slice(0, data.length),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw;
                            return `${label}: ${formatCurrency(value)}`;
                        }
                    }
                }
            }
        }
    });
}

// Crear gráfico de ingresos
function createIncomeChart(data) {
    const ctx = document.getElementById('income-chart').getContext('2d');
    
    // Destruir el gráfico anterior si existe
    if (incomeChart) {
        incomeChart.destroy();
    }
    
    // Colores para las categorías
    const colors = [
        '#198754', '#0d6efd', '#20c997', '#0dcaf0', '#6610f2', 
        '#6f42c1', '#d63384', '#dc3545', '#fd7e14', '#ffc107'
    ];
    
    incomeChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: data.map(item => item.category),
            datasets: [{
                data: data.map(item => item.total),
                backgroundColor: colors.slice(0, data.length),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw;
                            return `${label}: ${formatCurrency(value)}`;
                        }
                    }
                }
            }
        }
    });
}

// Crear una nueva transacción
async function createTransaction(transactionData) {
    try {
        const response = await fetch(`${API_URL}/transactions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(transactionData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al crear la transacción');
        }
        
        // Recargar datos
        loadTransactions();
        
        // Resetear formulario
        transactionForm.reset();
        
        showNotification('Transacción creada correctamente', 'success');
    } catch (error) {
        console.error('Error:', error);
        showNotification(error.message, 'error');
    }
}

// Actualizar una transacción
async function updateTransaction(id, transactionData) {
    try {
        const response = await fetch(`${API_URL}/transactions/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(transactionData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al actualizar la transacción');
        }
        
        // Recargar datos
        loadTransactions();
        
        // Cerrar modal
        closeEditModal();
        
        showNotification('Transacción actualizada correctamente', 'success');
    } catch (error) {
        console.error('Error:', error);
        showNotification(error.message, 'error');
    }
}

// Eliminar una transacción
async function deleteTransaction(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta transacción?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/transactions/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al eliminar la transacción');
        }
        
        // Recargar datos
        loadTransactions();
        
        showNotification('Transacción eliminada correctamente', 'success');
    } catch (error) {
        console.error('Error:', error);
        showNotification(error.message, 'error');
    }
}

// Abrir modal de edición
function openEditModal(transaction) {
    document.getElementById('edit-id').value = transaction.id;
    document.getElementById('edit-description').value = transaction.description;
    document.getElementById('edit-amount').value = transaction.amount;
    document.getElementById('edit-category').value = transaction.category;
    
    if (transaction.transaction_type === 'income') {
        document.getElementById('edit-income').checked = true;
    } else {
        document.getElementById('edit-expense').checked = true;
    }
    
    modal.style.display = 'block';
}

// Cerrar modal de edición
function closeEditModal() {
    modal.style.display = 'none';
    editForm.reset();
}

// Mostrar notificación
function showNotification(message, type = 'info') {
    // Implementación simple de notificación
    alert(message);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Cargar datos iniciales
    loadTransactions();
    
    // Envío de formulario para nueva transacción
    transactionForm.addEventListener('submit', event => {
        event.preventDefault();
        
        const formData = new FormData(transactionForm);
        const transactionData = {
            description: formData.get('description'),
            amount: parseFloat(formData.get('amount')),
            category: formData.get('category'),
            transaction_type: formData.get('transaction_type')
        };
        
        createTransaction(transactionData);
    });
    
    // Envío de formulario para editar transacción
    editForm.addEventListener('submit', event => {
        event.preventDefault();
        
        const id = document.getElementById('edit-id').value;
        const formData = new FormData(editForm);
        const transactionData = {
            description: formData.get('description'),
            amount: parseFloat(formData.get('amount')),
            category: formData.get('category'),
            transaction_type: formData.get('transaction_type')
        };
        
        updateTransaction(id, transactionData);
    });
    
    // Botón de actualizar
    refreshBtn.addEventListener('click', () => {
        loadTransactions();
    });
    
    // Cerrar modal
    closeModal.addEventListener('click', closeEditModal);
    
    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', event => {
        if (event.target === modal) {
            closeEditModal();
        }
    });
});