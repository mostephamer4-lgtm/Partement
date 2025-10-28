// ===================================
// Data Management
// ===================================

class PropertyManager {
    constructor() {
        this.properties = [];
        this.expenses = [];
        this.settings = {
            currency: 'UM',
            businessName: 'نظام إدارة العقارات الذكي'
        };
        this.loadData();
    }

    // Load data from LocalStorage
    loadData() {
        const propertiesData = localStorage.getItem('properties');
        const expensesData = localStorage.getItem('expenses');
        const settingsData = localStorage.getItem('settings');

        this.properties = propertiesData ? JSON.parse(propertiesData) : [];
        this.expenses = expensesData ? JSON.parse(expensesData) : [];
        this.settings = settingsData ? JSON.parse(settingsData) : this.settings;
    }

    // Save data to LocalStorage
    saveData() {
        localStorage.setItem('properties', JSON.stringify(this.properties));
        localStorage.setItem('expenses', JSON.stringify(this.expenses));
        localStorage.setItem('settings', JSON.stringify(this.settings));
    }

    // Add a new property
    addProperty(property) {
        property.id = Date.now();
        this.properties.push(property);
        this.saveData();
        return property;
    }

    // Update a property
    updateProperty(id, updatedProperty) {
        const index = this.properties.findIndex(p => p.id === id);
        if (index !== -1) {
            this.properties[index] = { ...this.properties[index], ...updatedProperty, id };
            this.saveData();
            return this.properties[index];
        }
        return null;
    }

    // Delete a property
    deleteProperty(id) {
        this.properties = this.properties.filter(p => p.id !== id);
        this.expenses = this.expenses.filter(e => e.propertyId !== id);
        this.saveData();
    }

    // Get all properties
    getProperties() {
        return this.properties;
    }

    // Get property by ID
    getPropertyById(id) {
        return this.properties.find(p => p.id === id);
    }

    // Add expense
    addExpense(expense) {
        expense.id = Date.now();
        this.expenses.push(expense);
        this.saveData();
        return expense;
    }

    // Get expenses for a property and month
    getExpenses(propertyId, month) {
        return this.expenses.filter(e => e.propertyId === propertyId && e.month === month);
    }

    // Get all expenses
    getAllExpenses() {
        return this.expenses;
    }

    // Delete expense
    deleteExpense(id) {
        this.expenses = this.expenses.filter(e => e.id !== id);
        this.saveData();
    }

    // Calculate statistics
    getStatistics() {
        const totalProperties = this.properties.length;
        const rentedProperties = this.properties.filter(p => p.status === 'rented').length;
        const vacantProperties = totalProperties - rentedProperties;

        const currentMonth = new Date().toISOString().slice(0, 7);
        const monthlyIncome = this.properties
            .filter(p => p.status === 'rented')
            .reduce((sum, p) => sum + parseFloat(p.monthlyRent || 0), 0);

        const monthlyExpenses = this.expenses
            .filter(e => e.month === currentMonth)
            .reduce((sum, e) => {
                return sum + parseFloat(e.electricity || 0) + parseFloat(e.water || 0) + parseFloat(e.other || 0);
            }, 0);

        const netProfit = monthlyIncome - monthlyExpenses;

        return {
            totalProperties,
            rentedProperties,
            vacantProperties,
            monthlyIncome,
            monthlyExpenses,
            netProfit
        };
    }

    // Export all data as JSON
    exportData() {
        return {
            properties: this.properties,
            expenses: this.expenses,
            settings: this.settings,
            exportDate: new Date().toISOString()
        };
    }

    // Import data from JSON
    importData(data) {
        if (data.properties) this.properties = data.properties;
        if (data.expenses) this.expenses = data.expenses;
        if (data.settings) this.settings = data.settings;
        this.saveData();
    }

    // Clear all data
    clearAllData() {
        this.properties = [];
        this.expenses = [];
        this.settings = {
            currency: 'UM',
            businessName: 'نظام إدارة العقارات الذكي'
        };
        this.saveData();
    }
}

// Initialize Property Manager
const manager = new PropertyManager();

// ===================================
// UI Functions
// ===================================

// Show page
function showPage(pageName) {
    const pages = document.querySelectorAll('.page-content');
    pages.forEach(page => page.style.display = 'none');
    
    const page = document.getElementById(pageName);
    if (page) {
        page.style.display = 'block';
        
        // Call page-specific initialization
        if (pageName === 'properties') {
            loadProperties();
        } else if (pageName === 'expenses') {
            loadExpensesList();
            populateExpensePropertySelect();
        } else if (pageName === 'dashboard') {
            updateDashboard();
        }
    }
}

// Update dashboard statistics
function updateDashboard() {
    const stats = manager.getStatistics();
    
    document.getElementById('totalProperties').textContent = stats.totalProperties;
    document.getElementById('rentedProperties').textContent = stats.rentedProperties;
    document.getElementById('vacantProperties').textContent = stats.vacantProperties;
    document.getElementById('monthlyIncome').textContent = `${stats.monthlyIncome.toFixed(2)} ${manager.settings.currency}`;
    document.getElementById('totalExpenses').textContent = `${stats.monthlyExpenses.toFixed(2)} ${manager.settings.currency}`;
    document.getElementById('netProfit').textContent = `${stats.netProfit.toFixed(2)} ${manager.settings.currency}`;
}

// Show add property modal
function showAddPropertyModal() {
    document.getElementById('propertyForm').reset();
    document.getElementById('propertyModalTitle').textContent = 'إضافة عقار جديد';
    document.getElementById('propertyForm').dataset.mode = 'add';
    document.getElementById('propertyForm').dataset.id = '';
    
    const modal = new bootstrap.Modal(document.getElementById('propertyModal'));
    modal.show();
}

// Show edit property modal
function showEditPropertyModal(id) {
    const property = manager.getPropertyById(id);
    if (!property) return;

    document.getElementById('propertyName').value = property.name;
    document.getElementById('tenantName').value = property.tenant;
    document.getElementById('monthlyRent').value = property.monthlyRent;
    document.getElementById('rentalDate').value = property.rentalDate;
    document.getElementById('paymentDate').value = property.paymentDate;
    document.getElementById('propertyStatus').value = property.status;
    document.getElementById('propertyNotes').value = property.notes || '';

    document.getElementById('propertyModalTitle').textContent = 'تعديل العقار';
    document.getElementById('propertyForm').dataset.mode = 'edit';
    document.getElementById('propertyForm').dataset.id = id;

    const modal = new bootstrap.Modal(document.getElementById('propertyModal'));
    modal.show();
}

// Save property
function saveProperty() {
    const name = document.getElementById('propertyName').value.trim();
    const tenant = document.getElementById('tenantName').value.trim();
    const monthlyRent = parseFloat(document.getElementById('monthlyRent').value);
    const rentalDate = document.getElementById('rentalDate').value;
    const paymentDate = parseInt(document.getElementById('paymentDate').value);
    const status = document.getElementById('propertyStatus').value;
    const notes = document.getElementById('propertyNotes').value.trim();

    if (!name || !tenant || !monthlyRent || !rentalDate || !paymentDate) {
        alert('يرجى ملء جميع الحقول المطلوبة');
        return;
    }

    const property = {
        name,
        tenant,
        monthlyRent,
        rentalDate,
        paymentDate,
        status,
        notes
    };

    const mode = document.getElementById('propertyForm').dataset.mode;
    const id = parseInt(document.getElementById('propertyForm').dataset.id);

    if (mode === 'add') {
        manager.addProperty(property);
        alert('تم إضافة العقار بنجاح');
    } else {
        manager.updateProperty(id, property);
        alert('تم تحديث العقار بنجاح');
    }

    bootstrap.Modal.getInstance(document.getElementById('propertyModal')).hide();
    loadProperties();
    updateDashboard();
}

// Load and display properties
function loadProperties() {
    const properties = manager.getProperties();
    const table = document.getElementById('propertiesTable');

    if (properties.length === 0) {
        table.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">لا توجد عقارات مسجلة حتى الآن</td></tr>';
        return;
    }

    table.innerHTML = properties.map(property => {
        const statusBadge = property.status === 'rented' 
            ? '<span class="badge badge-rented">مؤجر</span>' 
            : '<span class="badge badge-vacant">شاغر</span>';

        return `
            <tr>
                <td><strong>${property.name}</strong></td>
                <td>${property.tenant}</td>
                <td>${property.monthlyRent.toFixed(2)} ${manager.settings.currency}</td>
                <td>${statusBadge}</td>
                <td>${new Date(property.rentalDate).toLocaleDateString('ar-SA')}</td>
                <td>
                    <button class="btn btn-sm btn-info action-btn" onclick="showEditPropertyModal(${property.id})">
                        <i class="fas fa-edit"></i> تعديل
                    </button>
                    <button class="btn btn-sm btn-danger action-btn" onclick="deletePropertyConfirm(${property.id})">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Delete property confirmation
function deletePropertyConfirm(id) {
    if (confirm('هل أنت متأكد من حذف هذا العقار؟')) {
        manager.deleteProperty(id);
        loadProperties();
        updateDashboard();
        alert('تم حذف العقار بنجاح');
    }
}

// Populate expense property select
function populateExpensePropertySelect() {
    const properties = manager.getProperties();
    const select = document.getElementById('expenseProperty');
    
    select.innerHTML = '<option value="">-- اختر عقاراً --</option>' + 
        properties.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
}

// Handle expense form submission
document.addEventListener('DOMContentLoaded', function() {
    const expenseForm = document.getElementById('expenseForm');
    if (expenseForm) {
        expenseForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const propertyId = parseInt(document.getElementById('expenseProperty').value);
            const month = document.getElementById('expenseMonth').value;
            const electricity = parseFloat(document.getElementById('electricityBill').value) || 0;
            const water = parseFloat(document.getElementById('waterBill').value) || 0;
            const other = parseFloat(document.getElementById('otherExpenses').value) || 0;

            if (!propertyId || !month) {
                alert('يرجى اختيار العقار والشهر');
                return;
            }

            const expense = {
                propertyId,
                month,
                electricity,
                water,
                other
            };

            manager.addExpense(expense);
            alert('تم تسجيل المصاريف بنجاح');
            
            expenseForm.reset();
            loadExpensesList();
            updateDashboard();
        });
    }

    // Set current month in expense and report forms
    const today = new Date();
    const currentMonth = today.toISOString().slice(0, 7);
    const expenseMonth = document.getElementById('expenseMonth');
    const reportMonth = document.getElementById('reportMonth');
    
    if (expenseMonth) expenseMonth.value = currentMonth;
    if (reportMonth) reportMonth.value = currentMonth;

    // Load expenses list
    loadExpensesList();
    
    // Load settings
    loadSettings();
});

// Load and display expenses
function loadExpensesList() {
    const expenses = manager.getAllExpenses();
    const list = document.getElementById('expensesList');

    if (expenses.length === 0) {
        list.innerHTML = '<p class="text-muted text-center">لا توجد مصاريف مسجلة</p>';
        return;
    }

    const groupedExpenses = {};
    expenses.forEach(expense => {
        const property = manager.getPropertyById(expense.propertyId);
        const key = `${expense.month}-${expense.propertyId}`;
        if (!groupedExpenses[key]) {
            groupedExpenses[key] = {
                month: expense.month,
                propertyName: property ? property.name : 'عقار محذوف',
                expenses: []
            };
        }
        groupedExpenses[key].expenses.push(expense);
    });

    list.innerHTML = Object.values(groupedExpenses).map(group => {
        const expense = group.expenses[0];
        const total = expense.electricity + expense.water + expense.other;
        
        return `
            <div class="card mb-2">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <strong>${group.propertyName}</strong><br>
                            <small class="text-muted">${group.month}</small>
                        </div>
                        <div class="text-end">
                            <div><strong>${total.toFixed(2)} ${manager.settings.currency}</strong></div>
                            <small class="text-muted">
                                كهرباء: ${expense.electricity.toFixed(2)}<br>
                                ماء: ${expense.water.toFixed(2)}<br>
                                أخرى: ${expense.other.toFixed(2)}
                            </small>
                        </div>
                        <button class="btn btn-sm btn-danger" onclick="deleteExpenseConfirm(${expense.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Delete expense confirmation
function deleteExpenseConfirm(id) {
    if (confirm('هل أنت متأكد من حذف هذه المصاريف؟')) {
        manager.deleteExpense(id);
        loadExpensesList();
        updateDashboard();
        alert('تم حذف المصاريف بنجاح');
    }
}

// Load monthly report
function loadMonthlyReport() {
    const month = document.getElementById('reportMonth').value;
    
    if (!month) {
        alert('يرجى اختيار الشهر والسنة');
        return;
    }

    const properties = manager.getProperties();
    const reportContent = document.getElementById('reportContent');

    if (properties.length === 0) {
        reportContent.innerHTML = '<p class="text-center text-muted">لا توجد عقارات مسجلة</p>';
        return;
    }

    let html = '';

    properties.forEach(property => {
        const expenses = manager.getExpenses(property.propertyId || property.id, month);
        const expense = expenses.length > 0 ? expenses[0] : { electricity: 0, water: 0, other: 0 };
        
        const totalExpenses = expense.electricity + expense.water + expense.other;
        const netIncome = (property.status === 'rented' ? property.monthlyRent : 0) - totalExpenses;

        const [year, monthNum] = month.split('-');
        const monthName = new Date(year, monthNum - 1).toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' });

        html += `
            <div class="report-card">
                <div class="report-header">
                    <div class="report-title">تقرير الإيجار الشهري</div>
                    <div class="report-subtitle">العقار: ${property.name} | الشهر: ${monthName}</div>
                </div>

                <table class="report-table">
                    <tr>
                        <th>البند</th>
                        <th>القيمة</th>
                    </tr>
                    <tr>
                        <td>اسم العقار</td>
                        <td>${property.name}</td>
                    </tr>
                    <tr>
                        <td>المستأجر</td>
                        <td>${property.tenant}</td>
                    </tr>
                    <tr>
                        <td>مبلغ الإيجار الشهري</td>
                        <td>${property.monthlyRent.toFixed(2)} ${manager.settings.currency}</td>
                    </tr>
                    <tr>
                        <td>تاريخ الدفع</td>
                        <td>اليوم ${property.paymentDate} من كل شهر</td>
                    </tr>
                    <tr>
                        <td>فاتورة الكهرباء</td>
                        <td>${expense.electricity.toFixed(2)} ${manager.settings.currency}</td>
                    </tr>
                    <tr>
                        <td>فاتورة الماء</td>
                        <td>${expense.water.toFixed(2)} ${manager.settings.currency}</td>
                    </tr>
                    <tr>
                        <td>مصاريف إضافية</td>
                        <td>${expense.other.toFixed(2)} ${manager.settings.currency}</td>
                    </tr>
                    <tr style="background-color: #f8f9fa; font-weight: bold;">
                        <td>صافي دخل المالك</td>
                        <td>${netIncome.toFixed(2)} ${manager.settings.currency}</td>
                    </tr>
                </table>

                <div class="report-summary">
                    <div class="report-summary-item">
                        <span class="report-summary-label">✅ حالة الدفع:</span>
                        <span class="report-summary-value">تم الدفع كاملًا في تاريخه</span>
                    </div>
                    <div class="report-summary-item">
                        <span class="report-summary-label">📅 تاريخ التقرير:</span>
                        <span class="report-summary-value">${new Date().toLocaleDateString('ar-SA')}</span>
                    </div>
                    <div class="report-summary-item">
                        <span class="report-summary-label">🏠 النظام:</span>
                        <span class="report-summary-value">${manager.settings.businessName}</span>
                    </div>
                </div>

                <div class="mt-3">
                    <button class="btn btn-success" onclick="exportReportToPDF('${property.id}', '${month}', '${property.name}')">
                        <i class="fas fa-file-pdf"></i> تصدير PDF
                    </button>
                </div>
            </div>
        `;
    });

    reportContent.innerHTML = html;
}

// Export report to PDF
function exportReportToPDF(propertyId, month, propertyName) {
    const property = manager.getProperties().find(p => p.id == propertyId) || 
                     manager.getProperties().find(p => p.name === propertyName);
    
    if (!property) {
        alert('لم يتم العثور على العقار');
        return;
    }

    const expenses = manager.getExpenses(property.id, month);
    const expense = expenses.length > 0 ? expenses[0] : { electricity: 0, water: 0, other: 0 };
    
    const totalExpenses = expense.electricity + expense.water + expense.other;
    const netIncome = (property.status === 'rented' ? property.monthlyRent : 0) - totalExpenses;

    const [year, monthNum] = month.split('-');
    const monthName = new Date(year, monthNum - 1).toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' });

    const htmlContent = `
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <style>
                body {
                    font-family: 'Cairo', 'Tajawal', sans-serif;
                    padding: 20px;
                    direction: rtl;
                    text-align: right;
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 3px solid #0d6efd;
                    padding-bottom: 20px;
                }
                .header h1 {
                    color: #0d6efd;
                    margin: 0;
                    font-size: 24px;
                }
                .header p {
                    color: #666;
                    margin: 5px 0;
                }
                .content {
                    margin-bottom: 30px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                }
                th {
                    background-color: #0d6efd;
                    color: white;
                    padding: 12px;
                    text-align: right;
                    border: 1px solid #ddd;
                }
                td {
                    padding: 12px;
                    border: 1px solid #ddd;
                    text-align: right;
                }
                tr:nth-child(even) {
                    background-color: #f9f9f9;
                }
                .summary {
                    background-color: #f0f0f0;
                    padding: 15px;
                    border-radius: 5px;
                    margin-bottom: 20px;
                }
                .summary-item {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 10px;
                    padding: 5px 0;
                }
                .summary-item:last-child {
                    margin-bottom: 0;
                }
                .summary-label {
                    font-weight: bold;
                }
                .summary-value {
                    color: #0d6efd;
                    font-weight: bold;
                }
                .footer {
                    text-align: center;
                    color: #666;
                    font-size: 12px;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>تقرير الإيجار الشهري</h1>
                <p><strong>${property.name}</strong></p>
                <p>${monthName}</p>
            </div>

            <div class="content">
                <table>
                    <tr>
                        <th>البند</th>
                        <th>القيمة</th>
                    </tr>
                    <tr>
                        <td>اسم العقار</td>
                        <td>${property.name}</td>
                    </tr>
                    <tr>
                        <td>المستأجر</td>
                        <td>${property.tenant}</td>
                    </tr>
                    <tr>
                        <td>مبلغ الإيجار الشهري</td>
                        <td>${property.monthlyRent.toFixed(2)} ${manager.settings.currency}</td>
                    </tr>
                    <tr>
                        <td>تاريخ الدفع</td>
                        <td>اليوم ${property.paymentDate} من كل شهر</td>
                    </tr>
                    <tr>
                        <td>فاتورة الكهرباء</td>
                        <td>${expense.electricity.toFixed(2)} ${manager.settings.currency}</td>
                    </tr>
                    <tr>
                        <td>فاتورة الماء</td>
                        <td>${expense.water.toFixed(2)} ${manager.settings.currency}</td>
                    </tr>
                    <tr>
                        <td>مصاريف إضافية</td>
                        <td>${expense.other.toFixed(2)} ${manager.settings.currency}</td>
                    </tr>
                    <tr style="background-color: #e8f4f8; font-weight: bold;">
                        <td>صافي دخل المالك</td>
                        <td>${netIncome.toFixed(2)} ${manager.settings.currency}</td>
                    </tr>
                </table>

                <div class="summary">
                    <div class="summary-item">
                        <span class="summary-label">✅ حالة الدفع:</span>
                        <span class="summary-value">تم الدفع كاملًا في تاريخه</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">📅 تاريخ التقرير:</span>
                        <span class="summary-value">${new Date().toLocaleDateString('ar-SA')}</span>
                    </div>
                </div>
            </div>

            <div class="footer">
                <p>🏠 بواسطة: ${manager.settings.businessName}</p>
                <p>تم إنشاء هذا التقرير بواسطة نظام إدارة العقارات الذكي</p>
            </div>
        </body>
        </html>
    `;

    const element = document.createElement('div');
    element.innerHTML = htmlContent;

    const opt = {
        margin: 10,
        filename: `تقرير_${property.name}_${month}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };

    html2pdf().set(opt).from(element).save();
}

// Load and display settings
function loadSettings() {
    document.getElementById('currency').value = manager.settings.currency;
    document.getElementById('businessName').value = manager.settings.businessName;
}

// Save settings
function saveSettings() {
    manager.settings.currency = document.getElementById('currency').value || 'ر.س';
    manager.settings.businessName = document.getElementById('businessName').value || 'نظام إدارة العقارات الذكي';
    manager.saveData();
    alert('تم حفظ الإعدادات بنجاح');
    updateDashboard();
}

// Export all data
function exportAllData() {
    const data = manager.exportData();
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

// Import data
function importData() {
    document.getElementById('importFile').click();
}

// Handle import file
function handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            manager.importData(data);
            alert('تم استيراد البيانات بنجاح');
            loadProperties();
            loadExpensesList();
            updateDashboard();
        } catch (error) {
            alert('خطأ في استيراد البيانات: ' + error.message);
        }
    };
    reader.readAsText(file);
}

// Clear all data
function clearAllData() {
    if (confirm('هل أنت متأكد من حذف جميع البيانات؟ هذا الإجراء لا يمكن التراجع عنه.')) {
        manager.clearAllData();
        alert('تم حذف جميع البيانات بنجاح');
        loadProperties();
        loadExpensesList();
        updateDashboard();
    }
}

// Initialize on page load
window.addEventListener('load', function() {
    showPage('dashboard');
    updateDashboard();
});
