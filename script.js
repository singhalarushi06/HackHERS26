// ── Tab toggle ───────────────────────────────────────────────
const loginBtn  = document.getElementById('show-login');
const signupBtn = document.getElementById('show-signup');
const loginForm  = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');

loginBtn.addEventListener('click', () => {
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
    loginBtn.classList.add('active');
    signupBtn.classList.remove('active');
});

signupBtn.addEventListener('click', () => {
    signupForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    signupBtn.classList.add('active');
    loginBtn.classList.remove('active');
});

// ── Auth helpers ─────────────────────────────────────────────
const TEST_EMAILS = ['sophia@university.edu', 'test@test.com', 'demo@demo.com'];

const TEST_USER = {
    id: 'user_sophia',
    name: 'Sophia Martinez',
    email: 'sophia@university.edu',
    userType: 'college',
    joinDate: '2024-08-22',
    monthlyBudget: 2200,
    categoryBudgets: {
        food: 400, going_out: 200, entertainment: 150,
        housing_utilities: 800, academics: 300,
        auto_insurance: 120, stocks: 150, other: 80
    }
};

function getBudgets(userType) {
    const map = {
        high_school: { food: 100, going_out: 80,  entertainment: 60,  housing_utilities: 0,    academics: 0,   auto_insurance: 80,  stocks: 50,  other: 80 },
        college:     { food: 400, going_out: 200, entertainment: 150, housing_utilities: 800,  academics: 300, auto_insurance: 120, stocks: 150, other: 80 },
        full_time:   { food: 600, going_out: 300, entertainment: 200, housing_utilities: 1500, academics: 0,   auto_insurance: 120, stocks: 500, other: 80 },
    };
    return map[userType] || map.college;
}

function getMonthlyBudget(userType) {
    return userType === 'high_school' ? 500 : userType === 'college' ? 2200 : 4000;
}

function goToDashboard() {
    window.location.href = '/app.html';
}

// ── Login ────────────────────────────────────────────────────
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email    = document.getElementById('login-email').value.trim();
    const errEl    = document.getElementById('login-error');
    errEl.classList.add('hidden');

    let user = null;

    if (TEST_EMAILS.includes(email)) {
        user = TEST_USER;
    } else {
        const saved = localStorage.getItem('fw_user');
        if (saved) {
            const savedUser = JSON.parse(saved);
            if (savedUser.email === email) user = savedUser;
        }
    }

    if (!user) {
        errEl.classList.remove('hidden');
        return;
    }

    localStorage.setItem('fw_user', JSON.stringify(user));
    goToDashboard();
});

// ── Signup ───────────────────────────────────────────────────
signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name     = document.getElementById('signup-name').value.trim();
    const email    = document.getElementById('signup-email').value.trim();
    const userType = document.getElementById('signup-usertype').value;

    const newUser = {
        id: 'user_' + Date.now(),
        name,
        email,
        userType,
        joinDate: new Date().toISOString().slice(0, 10),
        monthlyBudget: getMonthlyBudget(userType),
        categoryBudgets: getBudgets(userType),
    };

    localStorage.setItem('fw_user', JSON.stringify(newUser));
    localStorage.setItem('fw_transactions', JSON.stringify([]));
    goToDashboard();
});
