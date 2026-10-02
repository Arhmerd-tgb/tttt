import './style.css';

const app = document.querySelector('#app');
const appName = import.meta.env.VITE_APP_NAME || 'Ashmie';
const tagLine = import.meta.env.VITE_APP_TAGLINE || 'Launch elegant digital experiences with confidence.';
const description = import.meta.env.VITE_APP_DESCRIPTION || 'A modern product starter with a polished frontend and a working backend API.';

const stats = [
  { value: '12k+', label: 'users reached' },
  { value: '4.9/5', label: 'average rating' },
  { value: '3x', label: 'faster iteration' },
];

const features = [
  {
    title: 'Strategy-first product design',
    text: 'Turn ideas into high-conversion experiences with a clear structure and stronger messaging.',
  },
  {
    title: 'Fast build system',
    text: 'Ship updates quickly with a Vite-powered frontend and a lightweight, deployable architecture.',
  },
  {
    title: 'API-ready foundation',
    text: 'Connect to real data and services through a simple Express layer designed to scale with you.',
  },
];

const process = [
  'Define the product vision and target experience',
  'Build the UI, marketing pages, and core flows',
  'Connect a working API and validate real behavior',
  'Deploy and keep iterating with measurable feedback',
];

const testimonials = [
  {
    quote: 'The product direction feels clear, premium, and conversion-focused from the first interaction.',
    author: 'Maya L.',
    role: 'Product Lead',
  },
  {
    quote: 'It gave our team a strong base to move fast without sacrificing polish or clarity.',
    author: 'Daniel R.',
    role: 'Founder',
  },
];

const fallbackDashboard = {
  summary: [
    { label: 'Revenue', value: '$82.4k', change: '+21.4%' },
    { label: 'Conversion', value: '6.8%', change: '+1.3%' },
    { label: 'Activation', value: '74%', change: '+8.2%' },
  ],
  pipeline: [
    { name: 'Product design', progress: 84, owner: 'Ava' },
    { name: 'Marketing launch', progress: 67, owner: 'Leo' },
    { name: 'Customer onboarding', progress: 91, owner: 'Mina' },
  ],
  tasks: ['Finalize launch plan', 'Review conversion funnel', 'Ship weekly product update'],
};

const fallbackPricing = {
  plans: [
    {
      name: 'Starter',
      price: '$29',
      description: 'For early teams validating the product direction.',
      features: ['Up to 3 active projects', 'Basic analytics', 'Email support'],
      highlight: false,
    },
    {
      name: 'Growth',
      price: '$79',
      description: 'For teams scaling fast with product and marketing momentum.',
      features: ['Unlimited projects', 'Advanced reporting', 'Priority support'],
      highlight: true,
    },
    {
      name: 'Scale',
      price: '$149',
      description: 'For mature operations that need deeper insights and automation.',
      features: ['Custom workflows', 'Team permissions', 'Executive reporting'],
      highlight: false,
    },
  ],
};

const fallbackWorkspace = {
  stats: [
    { label: 'Active projects', value: '18', change: '+4 this week' },
    { label: 'Team velocity', value: '92%', change: '+8.2%' },
    { label: 'Launch health', value: 'A', change: 'Stable' },
  ],
  projects: [
    { name: 'Northstar launch', status: 'In review', owner: 'Ava', progress: 82, due: 'Today' },
    { name: 'Growth experiments', status: 'Planning', owner: 'Leo', progress: 64, due: 'Thu' },
    { name: 'Customer onboarding', status: 'On track', owner: 'Mina', progress: 91, due: 'Fri' },
  ],
  activity: [
    { title: 'Design system approved', meta: 'Marketing team · 18 min ago' },
    { title: 'New onboarding flow published', meta: 'Product team · 1 hour ago' },
    { title: 'Launch checklist sent to stakeholders', meta: 'Ops team · 2 hours ago' },
  ],
};

const state = {
  page: 'home',
  dashboard: fallbackDashboard,
  pricing: fallbackPricing,
  workspace: fallbackWorkspace,
  projects: [],
  user: null,
};

async function loadDashboard() {
  try {
    const response = await fetch('/api/dashboard');
    if (!response.ok) throw new Error('Dashboard fetch failed');
    state.dashboard = await response.json();
  } catch (error) {
    console.warn('Using fallback dashboard data:', error);
    state.dashboard = fallbackDashboard;
  }
}

async function loadPricing() {
  try {
    const response = await fetch('/api/pricing');
    if (!response.ok) throw new Error('Pricing fetch failed');
    state.pricing = await response.json();
  } catch (error) {
    console.warn('Using fallback pricing data:', error);
    state.pricing = fallbackPricing;
  }
}

async function loadWorkspace() {
  try {
    const response = await fetch('/api/workspace');
    if (!response.ok) throw new Error('Workspace fetch failed');
    state.workspace = await response.json();
    state.projects = state.workspace.projects || [];
  } catch (error) {
    console.warn('Using fallback workspace data:', error);
    state.workspace = fallbackWorkspace;
    state.projects = fallbackWorkspace.projects;
  }
}

async function loadProjects() {
  try {
    const response = await fetch('/api/projects');
    if (!response.ok) throw new Error('Projects fetch failed');
    const data = await response.json();
    if (Array.isArray(data.projects) && data.projects.length) {
      state.projects = data.projects;
      state.workspace.projects = data.projects.slice(0, 3).map((project) => ({
        name: project.name,
        status: project.status || 'New',
        owner: project.owner || 'Team',
        progress: project.progress || 25,
        due: project.due || 'This week',
      }));
    }
  } catch (error) {
    console.warn('Unable to load stored projects:', error);
  }
}

async function loadSession() {
  const token = localStorage.getItem('ashmie_token');
  if (!token) return;

  try {
    const response = await fetch('/api/session', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error('Session expired');

    const data = await response.json();
    state.user = data.user;
  } catch (error) {
    console.warn('Session not active:', error);
    localStorage.removeItem('ashmie_token');
    state.user = null;
  }
}

async function loginWithCredentials(email, password) {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Unable to sign in');
    }

    const data = await response.json();
    localStorage.setItem('ashmie_token', data.token);
    state.user = data.user;
    state.page = 'dashboard';
    renderApp();
  } catch (error) {
    console.error(error);
    alert('Demo login failed. Use ava@ashmie.io / demo123');
  }
}

async function logout() {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
    });
  } catch (error) {
    console.warn('Logout request failed but local session will clear:', error);
  }

  localStorage.removeItem('ashmie_token');
  state.user = null;
  state.page = 'home';
  renderApp();
}

function renderDashboardSection() {
  const { summary, pipeline, tasks } = state.dashboard;
  const summaryMarkup = summary
    .map(
      (item) => `
        <div class="dashboard-card">
          <span>${item.label}</span>
          <strong>${item.value}</strong>
          <small>${item.change}</small>
        </div>
      `
    )
    .join('');

  const pipelineMarkup = pipeline
    .map(
      (item) => `
        <div class="pipeline-row">
          <div class="pipeline-header">
            <strong>${item.name}</strong>
            <span>${item.owner}</span>
          </div>
          <div class="progress-track">
            <span style="width: ${item.progress}%"></span>
          </div>
          <small>${item.progress}% complete</small>
        </div>
      `
    )
    .join('');

  const tasksMarkup = tasks.map((task) => `<li>${task}</li>`).join('');

  return `
    <section class="dashboard-shell">
      <div class="section-heading left">
        <span class="eyebrow">Live overview</span>
        <h2>${state.user ? `${state.user.name.split(' ')[0]}'s dashboard` : 'Operational dashboard'}</h2>
      </div>
      <div class="summary-grid">
        ${summaryMarkup}
      </div>
      <div class="dashboard-grid">
        <div class="pipeline-panel">
          <h3>Current pipeline</h3>
          ${pipelineMarkup}
        </div>
        <div class="task-panel">
          <h3>Priority tasks</h3>
          <ul>${tasksMarkup}</ul>
        </div>
      </div>
    </section>
  `;
}

function renderPricingSection() {
  const plansMarkup = state.pricing.plans
    .map(
      (plan) => `
        <article class="plan-card ${plan.highlight ? 'featured' : ''}">
          <div class="plan-badge">${plan.highlight ? 'Popular' : 'Flexible'}</div>
          <h3>${plan.name}</h3>
          <div class="price-row"><strong>${plan.price}</strong><span>/month</span></div>
          <p>${plan.description}</p>
          <ul>
            ${plan.features.map((feature) => `<li>${feature}</li>`).join('')}
          </ul>
          <button type="button" class="plan-button">Choose plan</button>
        </article>
      `
    )
    .join('');

  return `
    <section class="pricing-shell">
      <div class="section-heading">
        <span class="eyebrow">Pricing</span>
        <h2>Simple plans that scale with your momentum.</h2>
      </div>
      <div class="pricing-grid">
        ${plansMarkup}
      </div>
    </section>
  `;
}

function renderWorkspaceSection() {
  const statsMarkup = state.workspace.stats
    .map(
      (item) => `
        <div class="workspace-metric">
          <small>${item.label}</small>
          <strong>${item.value}</strong>
          <span>${item.change}</span>
        </div>
      `
    )
    .join('');

  const projectsMarkup = state.workspace.projects
    .map(
      (project) => `
        <article class="project-card">
          <div class="project-head">
            <div>
              <h3>${project.name}</h3>
              <p>${project.owner}</p>
            </div>
            <span class="status-tag">${project.status}</span>
          </div>
          <div class="progress-track">
            <span style="width: ${project.progress}%"></span>
          </div>
          <div class="project-meta">
            <span>${project.progress}% complete</span>
            <span>Due ${project.due}</span>
          </div>
        </article>
      `
    )
    .join('');

  const activityMarkup = state.workspace.activity
    .map(
      (item) => `
        <li>
          <strong>${item.title}</strong>
          <span>${item.meta}</span>
        </li>
      `
    )
    .join('');

  return `
    <section class="workspace-shell">
      <div class="workspace-header">
        <div>
          <span class="eyebrow">Workspace</span>
          <h2>Product operations dashboard</h2>
        </div>
        <button type="button" class="primary">New project</button>
      </div>

      <div class="workspace-metrics">
        ${statsMarkup}
      </div>

      <div class="workspace-grid">
        <aside class="sidebar-panel">
          <h3>Team pulse</h3>
          <ul class="activity-list">${activityMarkup}</ul>
        </aside>

        <div class="workspace-main">
          <div class="section-heading left">
            <span class="eyebrow">Current work</span>
            <h2>Priority projects</h2>
          </div>
          <div class="project-list">${projectsMarkup}</div>
        </div>
      </div>
    </section>
  `;
}

function renderHomeSection() {
  const authBlock = state.user
    ? `
      <div class="account-panel">
        <div class="profile-pill">Signed in as ${state.user.name}</div>
        <h3>Welcome back, ${state.user.name.split(' ')[0]}</h3>
        <p>${state.user.role} · ${state.user.plan} plan</p>
        <button type="button" class="primary" data-page="dashboard">Open dashboard</button>
      </div>
    `
    : `
      <div class="auth-panel">
        <div class="profile-pill">Demo access</div>
        <h3>Access your workspace</h3>
        <form id="auth-form" class="login-form">
          <label>
            <span>Email</span>
            <input id="email" type="email" value="ava@ashmie.io" required />
          </label>
          <label>
            <span>Password</span>
            <input id="password" type="password" value="demo123" required />
          </label>
          <button type="submit" class="primary">Sign in</button>
          <button type="button" id="quick-login" class="secondary">Use demo credentials</button>
        </form>
      </div>
    `;

  return `
    <section class="hero">
      <div class="hero-copy">
        <span class="eyebrow">Built for momentum</span>
        <h1>${tagLine}</h1>
        <p>${description}</p>
        <div class="actions">
          <button type="button" class="primary" data-page="dashboard">Start your project</button>
          <button type="button" class="secondary" data-page="pricing">See how it works</button>
        </div>
        <div class="mini-proof">
          <span>Trusted by product teams shipping fast</span>
        </div>
      </div>

      <div class="hero-panel" aria-label="Product overview panel">
        <div class="panel-card">
          <div class="panel-header">
            <span class="dot blue"></span>
            <span class="dot green"></span>
            <span class="dot orange"></span>
          </div>
          <div class="panel-body">
            <div class="metric-row">
              <div>
                <small>Growth</small>
                <strong>+128%</strong>
              </div>
              <span class="badge success">Up 21%</span>
            </div>
            <div class="chart-bars" aria-hidden="true">
              <span style="height: 30%"></span>
              <span style="height: 58%"></span>
              <span style="height: 42%"></span>
              <span style="height: 72%"></span>
              <span style="height: 88%"></span>
              <span style="height: 100%"></span>
            </div>
            <div class="panel-footer">
              <div>
                <small>Pipeline</small>
                <strong>$82.4k</strong>
              </div>
              <div>
                <small>Velocity</small>
                <strong>Fast</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="stats" aria-label="Key metrics">
      ${stats
        .map(
          (stat) => `
            <div class="stat-box">
              <strong>${stat.value}</strong>
              <span>${stat.label}</span>
            </div>
          `
        )
        .join('')}
    </section>

    <section class="auth-section">
      ${authBlock}
      <div class="auth-actions">
        <button type="button" id="create-account" class="secondary">Create account</button>
      </div>
    </section>

    <section id="features" class="feature-section">
      <div class="section-heading">
        <span class="eyebrow">Why teams choose us</span>
        <h2>Everything needed to move from concept to launch.</h2>
      </div>
      <div class="feature-grid">
        ${features
          .map(
            (feature) => `
              <article class="feature-card">
                <div class="feature-icon">✦</div>
                <h3>${feature.title}</h3>
                <p>${feature.text}</p>
              </article>
            `
          )
          .join('')}
      </div>
    </section>

    <section id="process" class="process-section">
      <div class="section-heading left">
        <span class="eyebrow">Process</span>
        <h2>A clear roadmap from idea to impact.</h2>
      </div>
      <div class="process-steps">
        ${process
          .map(
            (step, index) => `
              <div class="step-item">
                <span class="step-number">0${index + 1}</span>
                <p>${step}</p>
              </div>
            `
          )
          .join('')}
      </div>
    </section>

    <section id="stories" class="testimonial-section">
      <div class="section-heading">
        <span class="eyebrow">Client stories</span>
        <h2>Built for teams that want clarity and speed.</h2>
      </div>
      <div class="testimonial-grid">
        ${testimonials
          .map(
            (item) => `
              <article class="testimonial-card">
                <p class="quote">“${item.quote}”</p>
                <div class="author-line">
                  <strong>${item.author}</strong>
                  <span>${item.role}</span>
                </div>
              </article>
            `
          )
          .join('')}
      </div>
    </section>
  `;
}

function renderApp() {
  const pageContent = {
    home: renderHomeSection(),
    dashboard: renderDashboardSection(),
    workspace: renderWorkspaceSection(),
    pricing: renderPricingSection(),
  };

  app.innerHTML = `
    <div class="page-shell">
      <header class="topbar">
        <div class="brand-wrap">
          <div class="brand-mark">A</div>
          <span>${appName}</span>
        </div>
        <nav class="main-nav" aria-label="Main navigation">
          <button type="button" class="nav-link ${state.page === 'home' ? 'active' : ''}" data-page="home">Home</button>
          <button type="button" class="nav-link ${state.page === 'dashboard' ? 'active' : ''}" data-page="dashboard">Dashboard</button>
          <button type="button" class="nav-link ${state.page === 'workspace' ? 'active' : ''}" data-page="workspace">Workspace</button>
          <button type="button" class="nav-link ${state.page === 'pricing' ? 'active' : ''}" data-page="pricing">Pricing</button>
          ${state.user ? '<button type="button" id="logout-button" class="nav-button">Logout</button>' : '<button type="button" id="demo-login" class="nav-button">Demo login</button>'}
        </nav>
      </header>
      <main>
        ${pageContent[state.page]}
      </main>
    </div>
  `;

  document.querySelectorAll('[data-page]').forEach((button) => {
    button.addEventListener('click', () => {
      state.page = button.dataset.page;
      renderApp();
    });
  });

  const authForm = document.querySelector('#auth-form');
  if (authForm) {
    authForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = document.querySelector('#email')?.value || '';
      const password = document.querySelector('#password')?.value || '';
      await loginWithCredentials(email, password);
    });
  }

  const createAccountButton = document.querySelector('#create-account');
  if (createAccountButton) {
    createAccountButton.addEventListener('click', async () => {
      const name = prompt('Name');
      const email = prompt('Email');
      const password = prompt('Password');
      if (!name || !email || !password) return;

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        alert('Account creation failed.');
        return;
      }

      const data = await response.json();
      localStorage.setItem('ashmie_token', data.token);
      state.user = data.user;
      state.page = 'workspace';
      await loadProjects();
      renderApp();
    });
  }

  const quickLoginButton = document.querySelector('#quick-login');
  if (quickLoginButton) {
    quickLoginButton.addEventListener('click', async () => {
      await loginWithCredentials('ava@ashmie.io', 'demo123');
    });
  }

  const demoLoginButton = document.querySelector('#demo-login');
  if (demoLoginButton) {
    demoLoginButton.addEventListener('click', async () => {
      await loginWithCredentials('ava@ashmie.io', 'demo123');
    });
  }

  const logoutButton = document.querySelector('#logout-button');
  if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
      await logout();
    });
  }
}

async function init() {
  await Promise.all([loadDashboard(), loadPricing(), loadWorkspace()]);
  await loadProjects();
  await loadSession();
  renderApp();
}

init();
