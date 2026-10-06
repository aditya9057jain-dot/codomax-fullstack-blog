const state = { token: localStorage.getItem('codomax_token'), user: null };
const app = document.getElementById('app');
const nav = document.getElementById('nav');
const toastEl = document.getElementById('toast');

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toastEl.classList.remove('show'), 2600);
}
function saveSession(token, user) { state.token = token; state.user = user; localStorage.setItem('codomax_token', token); renderNav(); }
function logout() { state.token = null; state.user = null; localStorage.removeItem('codomax_token'); renderNav(); location.hash = '#/'; }
function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  return fetch(path, { ...options, headers }).then(async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Something went wrong.');
    return data;
  });
}
async function hydrate() {
  if (!state.token) return;
  try { const data = await api('/api/auth/me'); state.user = data.user; renderNav(); }
  catch { logout(); }
}
function renderNav() {
  nav.innerHTML = state.user
    ? `<a href="#/">Home</a><a href="#/dashboard">Dashboard</a><a href="#/create">Write</a><button onclick="logout()">Logout</button>`
    : `<a href="#/">Home</a><a href="#/login">Login</a><a class="btn primary" href="#/register">Register</a>`;
}
function formatDate(date) { return new Date(date).toLocaleDateString(undefined, { year:'numeric', month:'short', day:'numeric' }); }
function preview(text, n=150) { return text.length > n ? text.slice(0, n) + '…' : text; }
function blogCard(blog, showOwnerActions=false) {
  return `<article class="card blog-card">
    <span class="badge">${escapeHtml(blog.category || 'General')}</span>
    <h3>${escapeHtml(blog.title)}</h3>
    <div class="meta">By ${escapeHtml(blog.author?.name || 'Unknown')} · ${formatDate(blog.createdAt)}</div>
    <p>${escapeHtml(preview(blog.content))}</p>
    <div class="actions">
      <a class="btn" href="#/blog/${blog._id}">Read</a>
      ${showOwnerActions ? `<a class="btn" href="#/edit/${blog._id}">Edit</a><button class="btn danger" onclick="deleteBlog('${blog._id}')">Delete</button>` : ''}
    </div>
  </article>`;
}
function escapeHtml(value='') {
  return String(value).replace(/[&<>'"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
}

async function homePage() {
  app.innerHTML = `<section class="hero"><span class="badge">Codomax Full Stack Internship</span><h1>Write. Share. Learn.</h1><p>A responsive full-stack blog application built with HTML, CSS, JavaScript, Node.js, Express, MongoDB and JWT authentication.</p><div class="actions"><a class="btn primary" href="${state.user ? '#/create' : '#/register'}">Start Writing</a><a class="btn" href="#blogs">Explore Blogs</a></div></section><section id="blogs"><div class="section-title"><h2>Latest Blogs</h2></div><div class="toolbar"><input id="search" placeholder="Search blogs…" /><select id="category"><option value="">All categories</option><option>Technology</option><option>Career</option><option>AI</option><option>College</option><option>General</option></select></div><div class="grid" id="blogGrid"></div></section>`;
  const load = async () => {
    const q = new URLSearchParams();
    if (document.getElementById('search').value) q.set('search', document.getElementById('search').value);
    if (document.getElementById('category').value) q.set('category', document.getElementById('category').value);
    const data = await api('/api/blogs' + (q.toString() ? `?${q}` : ''));
    document.getElementById('blogGrid').innerHTML = data.blogs.length ? data.blogs.map(blogCard).join('') : '<div class="card empty">No blogs found.</div>';
  };
  document.getElementById('search').addEventListener('input', load);
  document.getElementById('category').addEventListener('change', load);
  await load();
}
function authForm(mode) {
  const register = mode === 'register';
  app.innerHTML = `<section class="card form-card"><h2>${register ? 'Create account' : 'Welcome back'}</h2><p class="meta">${register ? 'Build your profile and start writing.' : 'Login to access your private dashboard.'}</p><form class="form" id="authForm">${register ? '<label>Name<input name="name" required minlength="2" /></label>' : ''}<label>Email<input type="email" name="email" required /></label><label>Password<input type="password" name="password" required minlength="6" /></label><button class="btn primary" type="submit">${register ? 'Register' : 'Login'}</button></form></section>`;
  document.getElementById('authForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const body = Object.fromEntries(new FormData(e.target).entries());
      const data = await api(`/api/auth/${register ? 'register' : 'login'}`, { method:'POST', body: JSON.stringify(body) });
      saveSession(data.token, data.user); showToast(register ? 'Account created.' : 'Logged in.'); location.hash = '#/dashboard';
    } catch (error) { showToast(error.message); }
  });
}
async function dashboardPage() {
  if (!state.user) return location.hash = '#/login';
  app.innerHTML = `<div class="dashboard-head"><div><span class="badge">Private dashboard</span><h1>${escapeHtml(state.user.name)}’s workspace</h1><p class="meta">Manage your profile and blogs.</p></div><a class="btn primary" href="#/create">+ New Blog</a></div><div class="kpis"><div class="card kpi"><span class="meta">Email</span><strong>${escapeHtml(state.user.email)}</strong></div><div class="card kpi"><span class="meta">Your Blogs</span><strong id="count">—</strong></div><div class="card kpi"><span class="meta">Profile</span><strong>Active</strong></div></div><section class="card"><h2>Profile</h2><form id="profileForm" class="form"><label>Name<input name="name" value="${escapeHtml(state.user.name)}" required /></label><label>Bio<textarea name="bio" style="min-height:120px">${escapeHtml(state.user.bio || '')}</textarea></label><button class="btn primary">Save profile</button></form></section><section><div class="section-title"><h2>Your Blogs</h2></div><div class="grid" id="mine"></div></section>`;
  document.getElementById('profileForm').addEventListener('submit', async (e) => { e.preventDefault(); try { const data = await api('/api/auth/profile', { method:'PUT', body:JSON.stringify(Object.fromEntries(new FormData(e.target).entries())) }); state.user = data.user; renderNav(); showToast('Profile updated.'); } catch (err) { showToast(err.message); } });
  const data = await api('/api/blogs/mine'); document.getElementById('count').textContent = data.blogs.length; document.getElementById('mine').innerHTML = data.blogs.length ? data.blogs.map(b => blogCard(b, true)).join('') : '<div class="card empty">You have not written a blog yet.</div>';
}
async function blogForm(editId=null) {
  if (!state.user) return location.hash = '#/login';
  let blog = { title:'', content:'', category:'General' };
  if (editId) { const data = await api(`/api/blogs/${editId}`); blog = data.blog; if (blog.author?._id !== state.user.id) return location.hash = '#/dashboard'; }
  app.innerHTML = `<section class="card form-card"><h2>${editId ? 'Edit Blog' : 'Create Blog'}</h2><p class="meta">Write useful, clear and original content.</p><form class="form" id="blogForm"><label>Title<input name="title" maxlength="140" required value="${escapeHtml(blog.title)}" /></label><label>Category<select name="category"><option ${blog.category==='Technology'?'selected':''}>Technology</option><option ${blog.category==='Career'?'selected':''}>Career</option><option ${blog.category==='AI'?'selected':''}>AI</option><option ${blog.category==='College'?'selected':''}>College</option><option ${blog.category==='General'?'selected':''}>General</option></select></label><label>Content<textarea name="content" maxlength="12000" required>${escapeHtml(blog.content)}</textarea></label><button class="btn primary">${editId ? 'Update Blog' : 'Publish Blog'}</button></form></section>`;
  document.getElementById('blogForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try { const data = await api(editId ? `/api/blogs/${editId}` : '/api/blogs', { method: editId ? 'PUT' : 'POST', body: JSON.stringify(Object.fromEntries(new FormData(e.target).entries())) }); showToast(editId ? 'Blog updated.' : 'Blog published.'); location.hash = `#/blog/${data.blog._id}`; }
    catch (err) { showToast(err.message); }
  });
}
async function detailPage(id) {
  const data = await api(`/api/blogs/${id}`); const b = data.blog;
  app.innerHTML = `<article class="card blog-detail"><span class="badge">${escapeHtml(b.category)}</span><h1>${escapeHtml(b.title)}</h1><div class="meta">By ${escapeHtml(b.author?.name || 'Unknown')} · ${formatDate(b.createdAt)}</div><hr style="border:none;border-top:1px solid var(--border);margin:22px 0"><div class="blog-content">${escapeHtml(b.content)}</div><div class="actions" style="margin-top:25px"><a class="btn" href="#/">← Back</a>${state.user && b.author?._id === state.user.id ? `<a class="btn" href="#/edit/${b._id}">Edit</a>` : ''}</div></article>`;
}
async function deleteBlog(id) {
  if (!confirm('Delete this blog?')) return;
  try { await api(`/api/blogs/${id}`, { method:'DELETE' }); showToast('Blog deleted.'); await dashboardPage(); } catch (err) { showToast(err.message); }
}

async function router() {
  renderNav();
  const [_, route, id] = location.hash.split('/');
  try {
    if (route === 'login') authForm('login');
    else if (route === 'register') authForm('register');
    else if (route === 'dashboard') await dashboardPage();
    else if (route === 'create') await blogForm();
    else if (route === 'edit') await blogForm(id);
    else if (route === 'blog') await detailPage(id);
    else await homePage();
  } catch (error) { app.innerHTML = `<div class="card empty">${escapeHtml(error.message)}</div>`; }
}
window.addEventListener('hashchange', router);
window.logout = logout;
window.deleteBlog = deleteBlog;
hydrate().finally(router);
