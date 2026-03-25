// --- INITIAL DATABASE SIMULATION (LOCALSTORAGE) ---
const DEFAULT_PRODUCTS = [
    { id: 1, name: 'Ficus Lyrata (Mediano)', price: 45.00, hex1: '#a8e063', hex2: '#56ab2f', category: 'Plantas' },
    { id: 2, name: 'Monstera Deliciosa', price: 35.00, hex1: '#11998e', hex2: '#38ef7d', category: 'Plantas' },
    { id: 3, name: 'Maceta Nube Cerámica', price: 22.00, hex1: '#e0c3fc', hex2: '#8ec5fc', category: 'Macetas' },
    { id: 4, name: 'Sansevieria Orgánica', price: 28.00, hex1: '#fce38a', hex2: '#f38181', category: 'Plantas' },
    { id: 5, name: 'Cactus Decorativo', price: 15.00, hex1: '#FFB75E', hex2: '#ED8F03', category: 'Suculentas' },
    { id: 6, name: 'Suculenta Echeveria', price: 12.00, hex1: '#43C6AC', hex2: '#191654', category: 'Suculentas' }
];

function initDB() {
    if (!localStorage.getItem('products')) localStorage.setItem('products', JSON.stringify(DEFAULT_PRODUCTS));
    if (!localStorage.getItem('users')) localStorage.setItem('users', JSON.stringify([]));
    if (!localStorage.getItem('orders')) localStorage.setItem('orders', JSON.stringify([]));
}

// --- GLOBAL STATE ---
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentCategory = 'Todas';
let searchTerm = '';

// --- BOOTSTRAP APP ---
document.addEventListener('DOMContentLoaded', () => {
    initDB();
    renderProducts();
    updateAuthUI();
    updateCartIcon();
    
    // Navbar Scroll
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');
    });
});

// --- SPA NAVIGATION ---
function showSection(sectionId) {
    document.querySelectorAll('.page-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    
    if(sectionId === 'ordersSection') renderOrders();
    if(sectionId === 'adminSection') {
        renderAdminOrders();
    }
}

function setCategory(btn, cat) {
    document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    currentCategory = cat;
    renderProducts();
}

function handleSearch(term) {
    searchTerm = term.toLowerCase();
    renderProducts();
}

// --- CATALOG RENDERING ---
function renderProducts() {
    const allProducts = JSON.parse(localStorage.getItem('products')) || [];
    const grid = document.getElementById('productGrid');
    grid.innerHTML = '';
    
    const filtered = allProducts.filter(p => {
        const matchCat = currentCategory === 'Todas' || p.category === currentCategory;
        const matchSearch = p.name.toLowerCase().includes(searchTerm);
        return matchCat && matchSearch;
    });

    if (filtered.length === 0) {
        grid.innerHTML = '<p style="text-align:center; grid-column:span 4; padding:40px;">No se encontraron productos :/</p>';
        return;
    }

    filtered.forEach(p => {
        grid.innerHTML += `
            <div class="card">
                <button onclick="adminDeleteProduct(${p.id})" style="position:absolute; top:10px; right:10px; background:red; color:white; border:none; padding:5px 8px; border-radius:5px; cursor:pointer; font-weight:bold; z-index:10; ${currentUser?.username === 'admin' ? '' : 'display:none;'}">✖</button>
                <div class="card-img-placeholder" style="background: linear-gradient(135deg, ${p.hex1 || '#888'}, ${p.hex2 || '#333'});">
                    ${p.name.substring(0, 10)}...
                </div>
                <div class="card-body">
                    <span style="font-size:0.8rem; color:var(--text-secondary); text-transform:uppercase; font-weight:bold;">${p.category || 'Varios'}</span>
                    <h3>${p.name}</h3>
                    <p class="price">$${parseFloat(p.price).toFixed(2)}</p>
                    <button class="btn btn-add" onclick="addToCart(${p.id}, '${p.name}', ${p.price})">Añadir al carrito</button>
                </div>
            </div>
        `;
    });
}

// --- AUTHENTICATION ---
let isLoginMode = true;

function openLoginModal() { 
    if(currentUser) return; // Prevent if already logged in. Fix just in case.
    document.getElementById('loginModal').classList.add('active'); 
}
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    document.getElementById('authTitle').innerText = isLoginMode ? "Iniciar Sesión" : "Crear Nueva Cuenta";
    document.getElementById('authBtn').innerText = isLoginMode ? "Entrar" : "Registrarse";
    document.getElementById('authToggleText').innerText = isLoginMode ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?";
}

function processAuth() {
    const u = document.getElementById('authUsername').value.trim();
    const p = document.getElementById('authPassword').value.trim();
    if(!u || !p) return showToast("Llena todos los campos");

    let users = JSON.parse(localStorage.getItem('users')) || [];

    if (!isLoginMode) {
        // Register (Secret Admin Keyword Exception)
        if(u === 'admin') return showToast("El nombre 'admin' está reservado.");
        if (users.find(x => x.username === u)) return showToast("El usuario ya existe");
        users.push({ username: u, password: p });
        localStorage.setItem('users', JSON.stringify(users));
        currentUser = { username: u };
        showToast("Cuenta Creada y Autenticado");
    } else {
        // Login - Including default admin override if db empty
        if (u === 'admin' && p === 'admin') {
            currentUser = { username: 'admin' };
            showToast("Bienvenido Administrador Definitivo");
        } else {
            if (!users.find(x => x.username === u && x.password === p)) return showToast("Credenciales inválidas");
            currentUser = { username: u };
            showToast("Bienvenido, " + u);
        }
    }

    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    closeModal('loginModal');
    updateAuthUI();
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    showSection('homeSection');
    updateAuthUI();
    showToast("Sesión cerrada");
}

function updateAuthUI() {
    const btnLogin = document.getElementById('btnLogin');
    const profile = document.getElementById('userProfile');
    const navOrders = document.getElementById('navOrders');
    const navAdmin = document.getElementById('navAdmin');
    
    if (currentUser) {
        btnLogin.style.display = 'none';
        profile.style.display = 'flex';
        document.getElementById('welcomeName').innerText = currentUser.username;
        navOrders.style.display = 'inline-block';
        
        // ADMIN SHOW CONFIG
        if (currentUser.username === 'admin') {
            navAdmin.style.display = 'inline-block';
        } else {
            navAdmin.style.display = 'none';
        }
    } else {
        btnLogin.style.display = 'inline-block';
        profile.style.display = 'none';
        navOrders.style.display = 'none';
        navAdmin.style.display = 'none';
    }
    
    // Rerender products just in case Admin tags changed
    renderProducts();
}

// --- CART & CHECKOUT ---
function addToCart(id, name, price) {
    const existing = cart.find(x => x.id === id);
    if(existing) existing.qty++;
    else cart.push({ id, name, price, qty: 1 });
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartIcon();
    showToast(`Añadido: ${name}`);
}

function updateCartIcon() {
    document.getElementById('cartCount').innerText = cart.reduce((acc, c) => acc + c.qty, 0);
    const cartBtn = document.querySelector('.cart-icon');
    cartBtn.classList.remove('pulse');
    void cartBtn.offsetWidth;
    cartBtn.classList.add('pulse');
}

function openCartModal() {
    renderCartModal();
    document.getElementById('cartModal').classList.add('active');
}

function renderCartModal() {
    const container = document.getElementById('cartItemsContainer');
    container.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        container.innerHTML = "<p style='text-align:center;'>El carrito está vacío.</p>";
    } else {
        cart.forEach(item => {
            const sum = item.qty * item.price;
            total += sum;
            container.innerHTML += `
                <div class="cart-item">
                    <div>
                        <div class="cart-item-title">${item.name} (x${item.qty})</div>
                        <div style="font-size:0.8rem; color:var(--text-secondary);">$${item.price.toFixed(2)} c/u</div>
                    </div>
                    <div style="font-weight:bold; color:var(--primary);">$${sum.toFixed(2)}</div>
                    <button class="cart-del-btn" onclick="removeFromCart(${item.id})">✖</button>
                </div>
            `;
        });
    }
    document.getElementById('cartTotalDisplay').innerText = "$" + total.toFixed(2);
}

function removeFromCart(id) {
    cart = cart.filter(x => x.id !== id);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartIcon();
    renderCartModal();
}

function processCheckout() {
    if (cart.length === 0) return showToast("El carrito está vacío");
    if (!currentUser) {
        closeModal('cartModal');
        openLoginModal();
        return showToast("Debes iniciar sesión para comprar");
    }

    let orders = JSON.parse(localStorage.getItem('orders')) || [];
    const total = cart.reduce((acc, c) => acc + (c.price * c.qty), 0);
    
    const newOrder = {
        id: 'PED-' + Math.floor(Math.random() * 100000),
        username: currentUser.username,
        date: new Date().toLocaleDateString(),
        items: cart,
        total: total,
        status: 'Pendiente'
    };
    
    orders.push(newOrder);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    cart = [];
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartIcon();
    closeModal('cartModal');
    
    showToast("¡Pedido Creado Correctamente!");
    showSection('ordersSection');
}

// --- ORDERS HISTORY CLIENT ---
function renderOrders() {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const myOrders = orders.filter(o => o.username === currentUser?.username);
    const tbody = document.getElementById('ordersTableBody');
    tbody.innerHTML = '';

    if(myOrders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="padding:20px; text-align:center;">No has realizado ningún pedido.</td></tr>';
        return;
    }

    myOrders.reverse().forEach(o => {
        const itemsList = o.items.map(i => `${i.qty}x ${i.name}`).join(', ');
        
        let statusBadge = '';
        let actionButtons = '';
        
        if (o.status === 'Pendiente') {
            statusBadge = `<span style="background:var(--primary-light); color:var(--accent); font-weight:bold; padding:3px 8px; border-radius:12px; font-size:0.8rem;">Pendiente de Pago</span>`;
            actionButtons = `
                <button onclick="payOrder('${o.id}')" style="background:var(--primary); color:white; border:none; padding:8px 15px; border-radius:5px; cursor:pointer; margin-right:5px; font-weight:bold;">Comprar / Pagar</button>
                <button onclick="cancelOrder('${o.id}', true)" style="background:#e74c3c; color:white; border:none; padding:8px 15px; border-radius:5px; cursor:pointer; font-weight:bold;">Cancelar</button>
            `;
        } else if (o.status === 'Pagado') {
             statusBadge = `<span style="background:var(--primary); color:white; padding:3px 8px; border-radius:12px; font-size:0.8rem;">Comprado</span>`;
             actionButtons = `<span style="color:var(--text-secondary); font-size:0.9rem; font-weight:bold;">✔ Completado</span>`;
        } else if (o.status === 'Cancelado') {
             statusBadge = `<span style="background:#e74c3c; color:white; padding:3px 8px; border-radius:12px; font-size:0.8rem;">Cancelado</span>`;
             actionButtons = `<span style="color:var(--text-secondary); font-size:0.9rem; font-weight:bold;">✖ Anulado</span>`;
        }

        tbody.innerHTML += `
            <tr style="border-bottom:1px solid #eee;">
                <td style="padding:20px;">
                    <div style="font-weight:bold; color:var(--accent); font-size:1.1rem; margin-bottom:5px;">${o.id}</div>
                    ${statusBadge}
                </td>
                <td>${o.date}</td>
                <td style="font-size:0.9rem;">${itemsList}</td>
                <td style="font-weight:bold; color:var(--primary); font-size:1.1rem;">$${o.total.toFixed(2)}</td>
                <td>${actionButtons || ''}</td>
            </tr>
        `;
    });
}

function payOrder(orderId) {
    let orders = JSON.parse(localStorage.getItem('orders'));
    let order = orders.find(o => o.id === orderId);
    if(order) {
        order.status = 'Pagado';
        localStorage.setItem('orders', JSON.stringify(orders));
        showToast("¡Compra pagada exitosamente! ✨");
        renderOrders();
    }
}

function cancelOrder(orderId, isClient = false) {
    if(confirm("¿Estás seguro que deseas cancelar este pedido?")) {
        let orders = JSON.parse(localStorage.getItem('orders'));
        let order = orders.find(o => o.id === orderId);
        if(order) {
            order.status = 'Cancelado';
            localStorage.setItem('orders', JSON.stringify(orders));
            showToast("Pedido cancelado 🗑️");
            if(isClient) renderOrders(); else renderAdminOrders();
        }
    }
}

// --- ADMIN FEATURES ---
function renderAdminOrders() {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const tbody = document.getElementById('adminOrdersTableBody');
    tbody.innerHTML = '';

    if(orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="padding:20px; text-align:center;">No hay historial de compras de ningún cliente.</td></tr>';
        return;
    }

    orders.reverse().forEach(o => {
        let statusBadge = o.status === 'Pagado' ? '🟩 Pagado' : (o.status === 'Cancelado' ? '🟥 Cancelado' : '🟨 Pendiente');
        let act = (o.status === 'Pendiente') ? `<button onclick="cancelOrder('${o.id}')" style="background:#e74c3c; color:white; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;">Cancelar por Fuerza</button>` : 'NA';

        tbody.innerHTML += `
            <tr style="border-bottom:1px solid #eee;">
                <td style="padding:15px; font-weight:bold;">${o.id}</td>
                <td style="color:var(--primary); font-weight:bold;">@${o.username}</td>
                <td>${o.date}</td>
                <td style="font-weight:bold;">$${o.total.toFixed(2)}</td>
                <td>${statusBadge}</td>
                <td>${act}</td>
            </tr>
        `;
    });
}

function adminAddProduct() {
    const name = document.getElementById('addProdName').value;
    const price = parseFloat(document.getElementById('addProdPrice').value);
    const category = document.getElementById('addProdCat').value;
    
    if(!name || !price) return showToast("Complete todos los campos del producto");
    
    let products = JSON.parse(localStorage.getItem('products')) || [];
    products.push({
        id: Date.now(),
        name: name,
        price: price,
        category: category,
        hex1: '#bdc3c7',
        hex2: '#2c3e50'
    });
    
    localStorage.setItem('products', JSON.stringify(products));
    showToast("Producto añadido al catálogo");
    
    document.getElementById('addProdName').value = '';
    document.getElementById('addProdPrice').value = '';
    renderProducts();
}

function adminDeleteProduct(id) {
    if(confirm("¿Forzar eliminación permanente de catálogo?")) {
        let products = JSON.parse(localStorage.getItem('products'));
        products = products.filter(p => p.id !== id);
        localStorage.setItem('products', JSON.stringify(products));
        showToast("Producto erradicado");
        renderProducts();
    }
}

// --- UTILS ---
function showToast(msg) {
    const t = document.getElementById('toast');
    t.innerText = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}
