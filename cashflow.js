// Select Elements
const salaryInput = document.getElementById("salaryInput");
const setSalaryBtn = document.getElementById("setSalaryBtn");
const salaryDisplay = document.getElementById("salaryDisplay");

const expenseName = document.getElementById("expenseName");
const expenseAmount = document.getElementById("expenseAmount");
const addExpenseBtn = document.getElementById("addExpenseBtn");

const totalExpensesDisplay = document.getElementById("totalExpenses");
const remainingBalanceDisplay = document.getElementById("remainingBalance");
const expenseList = document.getElementById("expenseList");

const currencySelect = document.getElementById("currency");
const toggleBtn = document.getElementById("themeToggle");
const sidebarBtn = document.getElementById("toggleSidebar");
const sidebar = document.querySelector(".sidebar");

// Data
let salary = 0;
let expenses = [];
let chart;
let alertShown = false;

let currentCurrency = "INR";
let exchangeRate = 1;
let currencySymbol = "Rs. ";



// Load Data
document.addEventListener("DOMContentLoaded", () => {
    const savedSalary = localStorage.getItem("salary");
    const savedExpenses = localStorage.getItem("expenses");
    const savedTheme = localStorage.getItem("theme");

    if (savedSalary) salary = Number(savedSalary);
    if (savedExpenses) expenses = JSON.parse(savedExpenses);

    // Load theme
    if (savedTheme === "dark") {
        document.body.classList.add("dark");
        if (toggleBtn) toggleBtn.textContent = "☀️";
    }

    updateUI();
});


// Set Salary
if (setSalaryBtn) {
    setSalaryBtn.addEventListener("click", () => {
        const value = Number(salaryInput.value);

        if (value <= 0) {
            alert("Enter valid salary");
            return;
        }

        salary = value;
        localStorage.setItem("salary", salary);

        updateUI();
    });
}


// Add Expenses
if (addExpenseBtn) {
    addExpenseBtn.addEventListener("click", () => {
        const name = expenseName.value.trim();
        const amount = Number(expenseAmount.value);

        if (name === "" || amount <= 0) {
            alert("Enter valid expense");
            return;
        }

        const expense = {
            id: Date.now(),
            name,
            amount
        };

        expenses.push(expense);
        localStorage.setItem("expenses", JSON.stringify(expenses));

        updateUI();

        expenseName.value = "";
        expenseAmount.value = "";
    });
}


// UI Update
function updateUI() {
    expenseList.innerHTML = "";

    expenses.forEach(exp => {
        const li = document.createElement("li");

        const text = document.createElement("span");
        text.textContent = `${exp.name} - ${currencySymbol}${(exp.amount * exchangeRate).toFixed(2)}`;

        const btn = document.createElement("button");
        btn.textContent = "❌";

        btn.addEventListener("click", () => {
            deleteExpense(exp.id);
        });

        li.appendChild(text);
        li.appendChild(btn);

        li.style.opacity = "0";
        setTimeout(() => {
            li.style.opacity = "1";
        }, 100);

        expenseList.appendChild(li);
    });

    salaryDisplay.textContent = currencySymbol + (salary * exchangeRate).toFixed(2);

    calculateBalance();
}


//  Calculate
function calculateBalance() {
    const totalExpenses = expenses.reduce((total, exp) => total + exp.amount, 0);
    const remaining = salary - totalExpenses;

    totalExpensesDisplay.textContent = currencySymbol + (totalExpenses * exchangeRate).toFixed(2);
    remainingBalanceDisplay.textContent = currencySymbol + (remaining * exchangeRate).toFixed(2);

    const threshold = salary * 0.1;

    if (remaining <= threshold) {
        remainingBalanceDisplay.style.color = "red";

        if (!alertShown) {
            alert("⚠️ Warning: Your balance is below 10%!");
            alertShown = true;
        }
    } else {
        remainingBalanceDisplay.style.color = "green";
        alertShown = false;
    }

    updateChart(totalExpenses, remaining);
}


// Delete
function deleteExpense(id) {
    expenses = expenses.filter(exp => exp.id !== id);
    localStorage.setItem("expenses", JSON.stringify(expenses));
    updateUI();
}


// Chart
function updateChart(totalExpenses, remaining) {
    const canvas = document.getElementById("expenseChart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
    type: "pie",
    data: {
        labels: ["Expenses", "Remaining"],
        datasets: [{
            data: [
                totalExpenses * exchangeRate,
                remaining * exchangeRate
            ],
            backgroundColor: ["#ff6384", "#36a2eb"]
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false   
    }
});
}


const pdfBtn = document.getElementById("downloadPDF");

if (pdfBtn) {
    pdfBtn.addEventListener("click", () => {

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Title
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(18);
        doc.text("Cash Flow Report", 20, 20);

        // Title Under Line
        doc.line(20, 25, 190, 25);

        let y = 35;

        // Expense List
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(12);

        expenses.forEach((exp, index) => {
            doc.text(
                `${index + 1}. ${exp.name} - ${currencySymbol}${(exp.amount * exchangeRate).toFixed(2)}`,
                20,
                y
            );
            y += 8;
        });

        //Total section
        y += 5;

        doc.setFont("Helvetica", "bold");
        doc.setFontSize(13);

        doc.text(`Total Expenses: ${totalExpensesDisplay.textContent}`, 20, y);
        y += 8;

        doc.text(`Remaining Balance: ${remainingBalanceDisplay.textContent}`, 20, y);

        // Save
        doc.save("report.pdf");
    });
}
// Currency
if (currencySelect) {
    currencySelect.addEventListener("change", async (e) => {
        currentCurrency = e.target.value;

        if (currentCurrency === "INR") {
            exchangeRate = 1;
            currencySymbol = "₹";
            updateUI();
            return;
        }

        try {
            const res = await fetch("https://api.exchangerate-api.com/v4/latest/INR");
            const data = await res.json();

            exchangeRate = data.rates[currentCurrency];
            currencySymbol = "$";
        } catch (error) {
            alert("Currency API failed. Using INR.");
            exchangeRate = 1;
            currencySymbol = "₹";
        }

        updateUI();
    });
}


//  Theme 
if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
        document.body.classList.toggle("dark");

        const isDark = document.body.classList.contains("dark");

        localStorage.setItem("theme", isDark ? "dark" : "light");

        toggleBtn.textContent = isDark ? "☀️" : "🌙";
    });
}


// Sidebar 
if (sidebarBtn) {
    sidebarBtn.addEventListener("click", () => {
        sidebar.classList.toggle("collapsed");
    });
}