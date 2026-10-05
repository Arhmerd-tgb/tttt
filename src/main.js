import './style.css';

const app = document.querySelector('#app');

const defaultSite = {
  name: 'ASHMIE CAKES & MORE',
  tagline: 'Cakes, pastries & treats for every celebration.',
  description: 'Ashmie Cakes & More creates delightful cakes, pastries and snacks for birthdays, events and everyday treats across Nigeria.',
  phone: '+234 806 577 0291',
  email: 'ashmiecakesinfo@gmail.com',
  whatsapp: '+234 806 577 0291',
  address: 'Hotoro Behind Chula Fueling Station',
};

const defaultProducts = [
  { id: 'strawberry-royale', name: 'Strawberry Royale Cake', category: 'cakes', price: 18000, image: 'https://images.unsplash.com/photo-1558301211-0d8c8ddee6ec?auto=format&fit=crop&w=900&q=80', description: 'Soft vanilla sponge layered with fresh strawberry cream.' },
  { id: 'choco-crumb', name: 'Choco Crumb Delight', category: 'cakes', price: 22000, image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=900&q=80', description: 'Rich chocolate layers finished with glossy ganache.' },
  { id: 'mini-cupcake-box', name: 'Mini Cupcake Box', category: 'cupcakes', price: 9500, image: 'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?auto=format&fit=crop&w=900&q=80', description: 'Assorted pastel cupcakes for gifting and parties.' },
  { id: 'beef-rolls', name: 'Beef Rolls', category: 'pastries', price: 7000, image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80', description: 'Flaky beef pastries for everyday bites and office snacking.' },
  { id: 'small-chops-mix', name: 'Small Chops Mix', category: 'small-chops', price: 16000, image: 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=80', description: 'Signature event platter with a mix of classic bites.' },
  { id: 'plantain-chips', name: 'Crunchy Plantain Chips', category: 'snacks', price: 4500, image: 'https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=900&q=80', description: 'Lightly seasoned crunchy chips for gifting and parties.' },
  { id: 'fruit-salad-cup', name: 'Fruit Salad Cups', category: 'desserts', price: 6000, image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=900&q=80', description: 'Fresh fruit dessert cups with vibrant toppings.' },
  { id: 'birthday-bundle', name: 'Birthday Celebration Pack', category: 'cakes', price: 26000, image: 'https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&w=900&q=80', description: 'Festive celebration cake with custom finishing.' },
];

const defaultTrainings = [
  { id: 'cake-basic', title: 'Cake Making Fundamentals', duration: '2 Weeks', fee: 35000, seats: 18, date: '2026-10-12', location: 'Hotoro Behind Chula Fueling Station', status: 'Open', topics: ['Cake mixing', 'Batter science', 'Basic decoration'] },
  { id: 'decor-masterclass', title: 'Advanced Decoration Masterclass', duration: '3 Weeks', fee: 48000, seats: 12, date: '2026-10-20', location: 'Hotoro Behind Chula Fueling Station', status: 'Open', topics: ['Buttercream art', 'Fondant detailing', 'Event styling'] },
  { id: 'snack-production', title: 'Snacks & Pastry Production', duration: '4 Weeks', fee: 55000, seats: 10, date: '2026-11-02', location: 'Hotoro Behind Chula Fueling Station', status: 'Open', topics: ['Small chops production', 'Pastry folding', 'Packaging'] },
];

const state = {
  page: 'home',
  user: null,
  products: [],
  categories: [],
  trainings: [],
  trainingPortalOpen: true,
  trainingEnrollments: [],
  reviews: [],
  orders: [],
  adminOverview: { stats: [], recentOrders: [], recentReviews: [], products: [], trainings: [], trainingPortalOpen: true },
  site: { ...defaultSite },
  paymentDetails: {
    bankName: 'Add your bank name in Admin settings',
    accountName: 'ASHMIE CAKES & MORE',
    accountNumber: 'Add account number in Admin settings',
    instructions: 'Use your order number as the transfer reference, then confirm your payment below.',
    deliveryFee: 2500,
  },
  fulfillmentMethod: 'delivery',
  accountMode: 'login',
  authMessage: '',
  authReturnPage: null,
  pendingManualOrder: readStorage('ashmie_pending_manual_order', null),
  paymentResult: null,
  chatMessages: [],
  chatConversations: [],
  selectedChatId: null,
  chatError: '',
  chatRefreshTimer: null,
  chatRefreshing: false,
  cart: readStorage('ashmie_cart', []),
};

function readStorage(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch (error) {
    console.warn(`Unable to read ${key}`, error);
    return fallback;
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function showNotification(message, type = 'success') {
  let region = document.querySelector('.notification-region');
  if (!region) {
    region = document.createElement('div');
    region.className = 'notification-region';
    region.setAttribute('aria-label', 'Notifications');
    document.body.append(region);
  }

  const notification = document.createElement('div');
  notification.className = `notification-toast ${type === 'error' ? 'is-error' : 'is-success'}`;
  notification.setAttribute('role', type === 'error' ? 'alert' : 'status');

  const messageText = document.createElement('span');
  messageText.textContent = message;
  const dismissButton = document.createElement('button');
  dismissButton.type = 'button';
  dismissButton.className = 'notification-dismiss';
  dismissButton.setAttribute('aria-label', 'Dismiss notification');
  dismissButton.textContent = '×';
  notification.append(messageText, dismissButton);
  region.append(notification);

  const dismiss = () => notification.remove();
  const timeoutId = window.setTimeout(dismiss, 4500);
  dismissButton.addEventListener('click', () => {
    window.clearTimeout(timeoutId);
    dismiss();
  });
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(Number(value || 0));
}

function formatTrainingDate(value) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(value))
    ? new Date(`${value}T00:00:00.000Z`)
    : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value || '');
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date);
}

function toDateInputValue(value) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return String(value);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

async function fetchJson(url, fallback) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Request failed: ${url}`);
    return await response.json();
  } catch (error) {
    console.warn(error);
    return fallback;
  }
}

async function loadStorefront() {
  const siteData = await fetchJson('/api/site', {
    site: defaultSite,
    categories: [
      { id: 'cakes', name: 'Cakes', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=80' },
      { id: 'cupcakes', name: 'Cupcakes', image: 'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?auto=format&fit=crop&w=900&q=80' },
      { id: 'pastries', name: 'Pastries', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80' },
    ],
    products: defaultProducts,
    trainings: defaultTrainings,
  });

  const paymentData = await fetchJson('/api/payment-details', { paymentDetails: state.paymentDetails });
  const reviewsData = await fetchJson('/api/reviews', { reviews: [] });

  state.site = { ...defaultSite, ...(siteData.site || {}) };
  state.categories = siteData.categories || [];
  state.products = (siteData.products || defaultProducts).map((product) => ({ ...product, price: Number(product.price) || 0 }));
  state.trainings = siteData.trainings || defaultTrainings;
  state.trainingPortalOpen = siteData.trainingPortalOpen !== false;
  state.paymentDetails = { ...state.paymentDetails, ...(paymentData.paymentDetails || {}) };
  state.reviews = reviewsData.reviews || [];

  const savedOrders = readStorage('ashmie_orders', []);
  if (savedOrders.length) state.orders = savedOrders;
}

function reviewsForProduct(productId) {
  return state.reviews.filter((review) => review.productId === productId);
}

function renderProductReviews(product) {
  const reviews = reviewsForProduct(product.id);
  const average = reviews.length
    ? reviews.reduce((total, review) => total + Number(review.rating), 0) / reviews.length
    : 0;
  const reviewCards = reviews.map((review) => `
    <article class="review-entry">
      <div class="review-entry-heading"><strong>${escapeHtml(review.author)}</strong><span>${Number(review.rating)}/5</span></div>
      <p>${escapeHtml(review.comment)}</p>
      <time datetime="${escapeHtml(review.createdAt)}">${new Date(review.createdAt).toLocaleDateString('en-NG')}</time>
    </article>
  `).join('');
  const reviewForm = state.user && state.user.role !== 'admin'
    ? `
      <form class="product-review-form" data-product-id="${escapeHtml(product.id)}">
        <label>Rating<select name="rating" required><option value="">Choose a rating</option><option value="5">5 - Excellent</option><option value="4">4 - Very good</option><option value="3">3 - Good</option><option value="2">2 - Fair</option><option value="1">1 - Poor</option></select></label>
        <label>Your review<textarea name="comment" rows="3" minlength="3" maxlength="1000" placeholder="Share your experience with this product" required></textarea></label>
        <button type="submit" class="secondary">Save review</button>
      </form>
    `
    : '<p class="review-signin">Sign in with a customer account to leave a review.</p><button type="button" class="secondary" data-page="account">Sign in to review</button>';

  return `
    <details class="product-reviews">
      <summary>Customer reviews (${reviews.length})${reviews.length ? ` · ${average.toFixed(1)}/5` : ''}</summary>
      <div class="reviews-content">
        ${reviewCards || '<p class="empty-state">No reviews yet. Be the first to review this product.</p>'}
        ${reviewForm}
      </div>
    </details>
  `;
}

async function submitProductReview(event) {
  event.preventDefault();
  if (!state.user) return;
  const form = event.currentTarget;
  const formData = new FormData(form);
  const response = await fetch('/api/reviews', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${readStorage('ashmie_auth_token', '')}`,
    },
    body: JSON.stringify({
      productId: form.dataset.productId,
      rating: formData.get('rating'),
      comment: formData.get('comment'),
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    showNotification(data.message || 'Unable to save your review.', 'error');
    return;
  }
  state.reviews = state.reviews.filter((review) => review.id !== data.review.id);
  state.reviews.unshift(data.review);
  renderApp();
  showNotification('Your review has been saved.');
}

function getCartItems() {
  return state.cart
    .map((entry) => {
      const product = state.products.find((item) => item.id === entry.id);
      if (!product) return null;
      return { ...product, quantity: entry.quantity };
    })
    .filter(Boolean);
}

function getCartCount() {
  return state.cart.reduce((total, entry) => total + Number(entry.quantity || 0), 0);
}

function saveCart() {
  writeStorage('ashmie_cart', state.cart);
}

async function readSelectedImage(file) {
  if (!file || !file.type.startsWith('image/')) return '';
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Unable to read the selected image.'));
    reader.readAsDataURL(file);
  });
}

async function readSelectedFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Unable to read the selected file.'));
    reader.readAsDataURL(file);
  });
}

function addToCart(productId) {
  const product = state.products.find((item) => item.id === productId);
  if (!product) return;

  const existing = state.cart.find((entry) => entry.id === productId);
  if (existing) {
    existing.quantity += 1;
  } else {
    state.cart.push({ id: productId, quantity: 1 });
  }

  saveCart();
  state.page = 'cart';
  renderApp();
  showNotification(`${product.name} added to your cart.`);
}

function updateCartQuantity(productId, delta) {
  const entry = state.cart.find((item) => item.id === productId);
  if (!entry) return;

  entry.quantity += delta;
  const removed = entry.quantity <= 0;
  if (entry.quantity <= 0) {
    state.cart = state.cart.filter((item) => item.id !== productId);
  }

  saveCart();
  renderApp();
  showNotification(removed ? 'Product removed from your cart.' : 'Cart quantity updated.');
}

function checkoutCart() {
  if (!state.cart.length) {
    showNotification('Your cart is empty. Add products before checking out.', 'error');
    return;
  }

  state.page = 'checkout';
  renderApp();
}

async function placeOrder(event) {
  event.preventDefault();
  if (!state.cart.length) return;

  const formData = new FormData(event.currentTarget);
  const customerName = String(formData.get('customerName') || '').trim();
  const customerEmail = String(formData.get('customerEmail') || '').trim();
  const customerPhone = String(formData.get('customerPhone') || '').trim();
  const deliveryAddress = state.fulfillmentMethod === 'delivery' ? String(formData.get('deliveryAddress') || '').trim() : '';

  if (!customerName || !customerEmail || !customerPhone || (state.fulfillmentMethod === 'delivery' && !deliveryAddress)) {
    showNotification('Enter your contact details and delivery address to place the order.', 'error');
    return;
  }

  const submitButton = event.currentTarget.querySelector('[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = 'Preparing payment...';
  try {
    const response = await fetch('/api/payments/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: { name: customerName, email: customerEmail, phone: customerPhone },
        items: state.cart.map(({ id, quantity }) => ({ id, quantity })),
        deliveryMethod: state.fulfillmentMethod,
        deliveryAddress,
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Unable to start payment.');
    if (data.paymentMethod === 'bank-transfer') {
      state.pendingManualOrder = data;
      writeStorage('ashmie_pending_manual_order', data);
      state.cart = [];
      saveCart();
      state.page = 'manual-payment';
      renderApp();
      return;
    }
    window.location.assign(data.authorizationUrl);
  } catch (error) {
    showNotification(error.message || 'Unable to start payment. Please try again.', 'error');
    submitButton.disabled = false;
    submitButton.textContent = 'Continue to payment';
  }
}

async function verifyPaystackCallback() {
  if (window.location.pathname !== '/payment/callback') return;

  const reference = new URLSearchParams(window.location.search).get('reference');
  if (!reference) {
    state.paymentResult = { paymentStatus: 'failed', message: 'No payment reference was returned.' };
    state.page = 'payment-result';
    return;
  }

  try {
    const response = await fetch(`/api/payments/verify?reference=${encodeURIComponent(reference)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Payment verification failed.');
    state.paymentResult = data;
    if (data.paymentStatus === 'success') {
      state.cart = [];
      saveCart();
    }
  } catch (error) {
    state.paymentResult = { paymentStatus: 'failed', message: error.message };
  }
  state.page = 'payment-result';
}

function getPostAuthenticationPage() {
  const returnPage = state.authReturnPage;
  state.authReturnPage = null;
  if (state.user.role === 'admin') return returnPage === 'admin-chat' ? 'admin-chat' : 'admin';
  if (returnPage === 'chat' || returnPage === 'manual-payment') return returnPage;
  return state.user.role === 'student' ? 'student' : 'home';
}

async function loginWithCredentials(email, password) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedPassword = String(password || '').trim();

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalizedEmail, password: normalizedPassword }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Unable to sign in.');
    state.user = data.user;
    writeStorage('ashmie_auth_token', data.token);
    state.page = getPostAuthenticationPage();
    state.authMessage = '';
    if (state.user.role === 'admin') await loadAdminOverview();
    else await loadTrainingEnrollments();
    if (['chat', 'admin-chat'].includes(state.page)) await refreshChatData();
    renderApp();
    return state.user;
  } catch (error) {
    state.authMessage = error.message;
    renderApp();
    return null;
  }
}

async function loadAdminOverview() {
  const response = await fetch('/api/admin/overview', {
    headers: { Authorization: `Bearer ${readStorage('ashmie_auth_token', '')}` },
  });
  if (response.ok) {
    state.adminOverview = await response.json();
    state.products = (state.adminOverview.products || state.products).map((product) => ({ ...product, price: Number(product.price) || 0 }));
    state.trainings = state.adminOverview.trainings || state.trainings;
    state.trainingPortalOpen = state.adminOverview.trainingPortalOpen !== false;
  }
}

async function loadTrainingEnrollments() {
  if (!state.user || state.user.role === 'admin') return;
  const response = await fetch('/api/training/enrollments', {
    headers: { Authorization: `Bearer ${readStorage('ashmie_auth_token', '')}` },
  });
  if (response.ok) {
    const data = await response.json();
    state.trainingEnrollments = data.enrollments || [];
  }
}

function handleExpiredChatSession() {
  state.authReturnPage = state.page;
  state.user = null;
  state.chatMessages = [];
  state.chatConversations = [];
  state.chatError = '';
  state.authMessage = 'Your session expired. Sign in again to continue to your inbox.';
  state.accountMode = 'login';
  state.page = 'account';
  localStorage.removeItem('ashmie_auth_token');
}

async function refreshChatData({ render = false } = {}) {
  if (state.chatRefreshing || !state.user || !['chat', 'admin-chat'].includes(state.page)) return;
  if ((state.page === 'admin-chat') !== (state.user.role === 'admin')) return;
  state.chatRefreshing = true;
  const token = readStorage('ashmie_auth_token', '');
  try {
    if (state.page === 'admin-chat') {
      const inboxResponse = await fetch('/api/admin/chat/conversations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const inboxData = await inboxResponse.json();
      if (!inboxResponse.ok) {
        const error = new Error(inboxData.message || 'Unable to load the customer inbox.');
        error.status = inboxResponse.status;
        throw error;
      }
      state.chatConversations = inboxData.conversations || [];
      if (!state.chatConversations.some((item) => item.conversationId === state.selectedChatId)) {
        state.selectedChatId = state.chatConversations[0]?.conversationId || null;
      }

      if (state.selectedChatId) {
        const messagesResponse = await fetch(`/api/chat/messages?conversationId=${encodeURIComponent(state.selectedChatId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const messagesData = await messagesResponse.json();
        if (!messagesResponse.ok) {
          const error = new Error(messagesData.message || 'Unable to load this conversation.');
          error.status = messagesResponse.status;
          throw error;
        }
        state.chatMessages = messagesData.messages || [];
        const selectedConversation = state.chatConversations.find((item) => item.conversationId === state.selectedChatId);
        if (selectedConversation) selectedConversation.unreadCount = 0;
      } else {
        state.chatMessages = [];
      }
    } else {
      const response = await fetch('/api/chat/messages', { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) {
        const error = new Error(data.message || 'Unable to load your support chat.');
        error.status = response.status;
        throw error;
      }
      state.chatMessages = data.messages || [];
    }
    state.chatError = '';
  } catch (error) {
    if (error.status === 401) handleExpiredChatSession();
    else state.chatError = error.message;
  } finally {
    state.chatRefreshing = false;
  }

  if (render || state.page === 'account') renderApp();
  else updateChatDom();
}

function renderChatMessages(messages, emptyMessage) {
  if (!messages.length) return `<p class="chat-empty">${emptyMessage}</p>`;
  return messages.map((message) => `
    <article class="chat-message ${message.senderId === state.user?.id ? 'own' : ''}">
      <div class="chat-message-meta"><strong>${escapeHtml(message.senderName)}</strong><time datetime="${escapeHtml(message.createdAt)}">${new Date(message.createdAt).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}</time></div>
      ${message.body ? `<p>${escapeHtml(message.body)}</p>` : ''}
      ${message.attachment ? `<a class="chat-attachment" href="${escapeHtml(message.attachment.dataUrl)}" download="${escapeHtml(message.attachment.name)}" target="_blank" rel="noopener noreferrer">${message.attachment.mimeType.startsWith('image/') ? `<img src="${escapeHtml(message.attachment.dataUrl)}" alt="${escapeHtml(message.attachment.name)}" />` : '<span class="chat-attachment-icon" aria-hidden="true">PDF</span>'}<span>${escapeHtml(message.attachment.name)}</span></a>` : ''}
    </article>
  `).join('');
}

function renderChatConversations() {
  if (!state.chatConversations.length) return '<p class="chat-empty">No customer conversations yet.</p>';
  return state.chatConversations.map((conversation) => `
    <button type="button" class="chat-conversation ${conversation.conversationId === state.selectedChatId ? 'active' : ''}" data-conversation-id="${escapeHtml(conversation.conversationId)}">
      <span class="chat-conversation-heading"><strong>${escapeHtml(conversation.customerName)}</strong>${conversation.unreadCount ? `<span class="chat-unread-count">${conversation.unreadCount}</span>` : ''}</span>
      <span class="chat-conversation-preview">${escapeHtml(conversation.latestMessage || 'Receipt attachment')}</span>
      <span class="chat-conversation-email">${escapeHtml(conversation.customerEmail)}</span>
    </button>
  `).join('');
}

function updateChatDom() {
  const messages = document.querySelector('#chat-message-list');
  if (messages) {
    const emptyMessage = state.page === 'admin-chat'
      ? 'Select a customer conversation to read and reply.'
      : 'Send a message to start a conversation with Ashmie.';
    messages.innerHTML = renderChatMessages(state.chatMessages, emptyMessage);
    messages.scrollTop = messages.scrollHeight;
  }

  const conversations = document.querySelector('#admin-chat-conversations');
  if (conversations) conversations.innerHTML = renderChatConversations();

  const error = document.querySelector('#chat-error');
  if (error) error.textContent = state.chatError;
}

async function sendChatMessage(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const textarea = form.querySelector('textarea[name="body"]');
  const body = textarea.value.trim();
  const file = form.querySelector('input[name="attachment"]').files[0];
  if (!body && !file) {
    state.chatError = 'Write a message or attach a receipt.';
    updateChatDom();
    return;
  }
  if (file && !['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type)) {
    state.chatError = 'Attach a PNG, JPEG, WebP, or PDF receipt.';
    updateChatDom();
    return;
  }
  if (file && file.size > 5 * 1024 * 1024) {
    state.chatError = 'Receipt files must be 5 MB or smaller.';
    updateChatDom();
    return;
  }

  const payload = { body };
  if (state.page === 'admin-chat') payload.conversationId = state.selectedChatId;
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  try {
    if (file) payload.attachment = { name: file.name, mimeType: file.type, dataUrl: await readSelectedFile(file) };
    const response = await fetch('/api/chat/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${readStorage('ashmie_auth_token', '')}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      const error = new Error(data.message || 'Unable to send message.');
      error.status = response.status;
      throw error;
    }
    state.chatMessages.push(data.message);
    state.chatError = '';
    form.reset();
    form.querySelector('.chat-file-name').textContent = 'Receipt file optional · 5 MB max';
    await refreshChatData();
    showNotification(file ? 'Receipt shared in the inbox.' : 'Message sent.');
  } catch (error) {
    if (error.status === 401) {
      handleExpiredChatSession();
      renderApp();
    } else {
      state.chatError = error.message;
      updateChatDom();
    }
  } finally {
    submitButton.disabled = false;
  }
}

async function navigateToPage(page) {
  state.page = page;
  state.chatError = '';
  if ((page === 'chat' && state.user && state.user.role !== 'admin') || (page === 'admin-chat' && state.user?.role === 'admin')) {
    await refreshChatData();
  }
  renderApp();
}

function configureChatPolling() {
  if (state.chatRefreshTimer) clearInterval(state.chatRefreshTimer);
  state.chatRefreshTimer = null;
  if ((state.page === 'chat' && state.user && state.user.role !== 'admin') || (state.page === 'admin-chat' && state.user?.role === 'admin')) {
    state.chatRefreshTimer = setInterval(() => refreshChatData(), 5000);
  }
}

async function logout() {
  const token = readStorage('ashmie_auth_token', '');
  if (token) {
    await fetch('/api/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
  }
  state.user = null;
  state.authReturnPage = null;
  localStorage.removeItem('ashmie_auth_token');
  state.page = 'home';
  renderApp();
}

async function registerAccount(name, email, password, accountType, adminCode) {
  const normalizedName = String(name || '').trim();
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedPassword = String(password || '').trim();

  try {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: normalizedName, email: normalizedEmail, password: normalizedPassword, accountType, adminCode }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Could not create account.');

    state.user = data.user;
    writeStorage('ashmie_auth_token', data.token);
    state.authMessage = '';
    state.page = getPostAuthenticationPage();
    if (state.user.role === 'admin') await loadAdminOverview();
    else await loadTrainingEnrollments();
    if (['chat', 'admin-chat'].includes(state.page)) await refreshChatData();
    renderApp();
  } catch (error) {
    state.authMessage = error.message;
    renderApp();
  }
}

async function savePaymentDetails(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const paymentDetails = Object.fromEntries(formData.entries());
  const response = await fetch('/api/admin/payment-details', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${readStorage('ashmie_auth_token', '')}`,
    },
    body: JSON.stringify(paymentDetails),
  });
  const data = await response.json();
  if (!response.ok) {
    showNotification(data.message || 'Unable to save payment details.', 'error');
    return;
  }
  state.paymentDetails = data.paymentDetails;
  renderApp();
  showNotification('Payment details updated.');
}

async function createAdminAccount(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const response = await fetch('/api/admin/admins', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${readStorage('ashmie_auth_token', '')}`,
    },
    body: JSON.stringify(Object.fromEntries(formData.entries())),
  });
  const data = await response.json();
  if (!response.ok) {
    showNotification(data.message || 'Unable to create administrator account.', 'error');
    return;
  }
  event.currentTarget.reset();
  showNotification(`Administrator account created for ${data.user.email}.`);
}

async function updateAdminSignupCode(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const code = String(formData.get('code') || '').trim();
  const confirmation = String(formData.get('confirmation') || '').trim();
  if (code !== confirmation) {
    showNotification('The code and confirmation do not match.', 'error');
    return;
  }

  const response = await fetch('/api/admin/admin-signup-code', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${readStorage('ashmie_auth_token', '')}`,
    },
    body: JSON.stringify({ code }),
  });
  const data = await response.json();
  if (!response.ok) {
    showNotification(data.message || 'Unable to update admin signup code.', 'error');
    return;
  }
  form.reset();
  showNotification('Admin signup code updated.');
}

async function updateOrderStatus(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const response = await fetch(`/api/admin/orders/${encodeURIComponent(form.dataset.orderId)}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${readStorage('ashmie_auth_token', '')}`,
    },
    body: JSON.stringify({ status: formData.get('status') }),
  });
  const data = await response.json();
  if (!response.ok) {
    showNotification(data.message || 'Unable to update order status.', 'error');
    return;
  }
  await loadAdminOverview();
  renderApp();
  showNotification('Order status updated.');
}

async function enrollTraining(courseId) {
  if (!state.user) {
    state.page = 'student';
    renderApp();
    return;
  }
  const response = await fetch('/api/training/enroll', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${readStorage('ashmie_auth_token', '')}`,
    },
    body: JSON.stringify({ trainingId: courseId }),
  });
  const data = await response.json();
  if (!response.ok) {
    showNotification(data.message || 'Unable to register for training.', 'error');
    return;
  }
  await loadTrainingEnrollments();
  renderApp();
  showNotification(`Successfully registered for ${data.enrollment.title}.`);
}

async function addProductFromForm(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const imageFile = formData.get('imageFile');
  const values = Object.fromEntries(formData.entries());

  if (imageFile && imageFile instanceof File && imageFile.size > 0) {
    try {
      values.image = await readSelectedImage(imageFile);
    } catch (error) {
      showNotification(error.message || 'Unable to read the selected image.', 'error');
      return;
    }
  }

  delete values.imageFile;
  const response = await fetch('/api/admin/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${readStorage('ashmie_auth_token', '')}`,
    },
    body: JSON.stringify(values),
  });
  const data = await response.json();
  if (!response.ok) {
    showNotification(data.message || 'Unable to add product.', 'error');
    return;
  }
  form.reset();
  await loadAdminOverview();
  renderApp();
  showNotification(`${values.name} added to the shop.`);
}

async function updateProduct(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const imageFile = formData.get('imageFile');
  const values = Object.fromEntries(formData.entries());

  if (imageFile && imageFile instanceof File && imageFile.size > 0) {
    try {
      values.image = await readSelectedImage(imageFile);
    } catch (error) {
      showNotification(error.message || 'Unable to read the selected image.', 'error');
      return;
    }
  }

  delete values.imageFile;
  const response = await fetch(`/api/admin/products/${encodeURIComponent(form.dataset.productId)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${readStorage('ashmie_auth_token', '')}`,
    },
    body: JSON.stringify(values),
  });
  const data = await response.json();
  if (!response.ok) {
    showNotification(data.message || 'Unable to update product.', 'error');
    return;
  }
  await loadAdminOverview();
  renderApp();
  showNotification(`${values.name} updated.`);
}

async function deleteProduct(button) {
  const productName = button.dataset.productName;
  if (!window.confirm(`Remove ${productName} from the shop?`)) return;
  const response = await fetch(`/api/admin/products/${encodeURIComponent(button.dataset.productId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${readStorage('ashmie_auth_token', '')}` },
  });
  const data = await response.json();
  if (!response.ok) {
    showNotification(data.message || 'Unable to remove product.', 'error');
    return;
  }
  state.reviews = state.reviews.filter((review) => review.productId !== data.productId);
  await loadAdminOverview();
  renderApp();
  showNotification(`${productName} removed from the shop.`);
}

async function saveTrainingSettings(event) {
  event.preventDefault();
  await persistTrainingSettings(event.currentTarget);
}

async function persistTrainingSettings(form) {
  const formData = new FormData(form);
  const fees = Object.fromEntries(state.trainings.map((training) => [training.id, formData.get(`fee-${training.id}`)]));
  const courseDetails = Object.fromEntries(state.trainings.map((training) => [training.id, {
    location: formData.get(`location-${training.id}`),
    date: formData.get(`date-${training.id}`),
    duration: formData.get(`duration-${training.id}`),
  }]));
  const response = await fetch('/api/admin/training-settings', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${readStorage('ashmie_auth_token', '')}`,
    },
    body: JSON.stringify({ isOpen: formData.get('isOpen') === 'true', fees, courseDetails }),
  });
  const data = await response.json();
  if (!response.ok) {
    showNotification(data.message || 'Unable to save training settings.', 'error');
    return;
  }
  state.trainings = data.trainings;
  state.trainingPortalOpen = data.trainingPortalOpen;
  state.adminOverview.trainings = data.trainings;
  state.adminOverview.trainingPortalOpen = data.trainingPortalOpen;
  renderApp();
  showNotification('Training settings updated.');
}

function renderHomeSection() {
  const featured = state.products.slice(0, 4);
  const featureProduct = featured[0];
  const cards = featured.map((product) => `
    <article class="product-card">
      <img src="${product.image}" alt="${product.name}" />
      <div class="product-meta">
        <span>${product.category}</span>
        <span class="product-price">${formatCurrency(product.price)}</span>
      </div>
      <h3>${product.name}</h3>
      <p>${product.description}</p>
      <button type="button" class="primary add-to-cart" data-product-id="${product.id}">Add to cart</button>
      ${renderProductReviews(product)}
    </article>
  `).join('');

  const categoryCards = (state.categories || []).slice(0, 3).map((category) => `
    <article class="gallery-card">
      <img src="${category.image || 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?auto=format&fit=crop&w=900&q=80'}" alt="${category.name}" />
      <h3>${category.name}</h3>
    </article>
  `).join('');

  const trainingCards = state.trainingPortalOpen ? state.trainings.slice(0, 3).map((course) => `
    <article class="training-card">
      <h3>${course.title}</h3>
      <div class="training-meta"><span>${escapeHtml(course.duration)}</span><span class="training-fee">${formatCurrency(course.fee)}</span></div>
      <p>${course.topics.join(' • ')}</p>
      <button type="button" class="secondary" data-page="student">View Training</button>
    </article>
  `).join('') : '<p class="empty-state">Training registration is currently closed.</p>';

  const customerReviews = state.reviews.slice(0, 3).map((review) => {
    const product = state.products.find((item) => item.id === review.productId);
    return `
      <article class="testimonial-card">
        <div class="review-entry-heading"><strong>${escapeHtml(product?.name || 'Product')}</strong><span>${Number(review.rating)}/5</span></div>
        <p class="quote">${escapeHtml(review.comment)}</p>
        <div class="author-line"><strong>${escapeHtml(review.author)}</strong><span>Customer review</span></div>
      </article>
    `;
  }).join('');

  return `
    <section class="hero">
      <div class="hero-copy">
        <span class="eyebrow">Freshly baked for every occasion</span>
        <h1>${state.site.tagline}</h1>
        <p>${state.site.description}</p>
        <div class="actions">
          <button type="button" class="primary" data-page="shop">Shop now</button>
          <button type="button" class="secondary" data-page="student">Training</button>
        </div>
        <div class="mini-proof">Premium cakes, pastries, snacks and practical baking skills from Hotoro Behind Chula Fueling Station.</div>
      </div>

      <div class="hero-panel">
        <div class="panel-card">
          <div class="panel-header">
            <span class="dot blue"></span>
            <span class="dot green"></span>
            <span class="dot orange"></span>
          </div>
          <div class="panel-body">
            <div class="metric-row">
              <div>
                <small>Featured product</small>
                <strong>${featureProduct?.name || 'Explore our bakery collection'}</strong>
              </div>
              <span class="badge success">Fresh</span>
            </div>
            ${featureProduct ? `<img src="${featureProduct.image}" alt="${featureProduct.name}" style="border-radius:18px; height:220px; object-fit:cover; margin-bottom:18px;" />` : ''}
            <div class="panel-footer">
              <div>
                <small>Price</small>
                <strong>${featureProduct ? formatCurrency(featureProduct.price) : 'Browse products'}</strong>
              </div>
              <div>
                <small>Customer reviews</small>
                <strong>${featureProduct ? reviewsForProduct(featureProduct.id).length : 0}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="feature-section">
      <div class="section-heading">
        <span class="eyebrow">Shop categories</span>
        <h2>Fresh favourites for every celebration</h2>
      </div>
      <div class="gallery-grid">${categoryCards}</div>
    </section>

    <section class="feature-section">
      <div class="section-heading">
        <span class="eyebrow">Popular now</span>
        <h2>Best-selling pieces from our kitchen</h2>
      </div>
      <div class="product-grid">${cards}</div>
    </section>

    <section class="feature-section">
      <div class="section-heading left">
        <span class="eyebrow">Learn with us</span>
        <h2>Hands-on baking and pastry training</h2>
      </div>
      <div class="training-grid">${trainingCards}</div>
    </section>

    <section class="testimonial-section">
      <div class="section-heading">
        <span class="eyebrow">Customer reviews</span>
        <h2>Experiences shared by our customers</h2>
      </div>
      <div class="testimonial-grid">${customerReviews || '<p class="empty-state">No customer reviews yet.</p>'}</div>
    </section>

  `;
}

function renderShopSection() {
  const cards = state.products.map((product) => `
    <article class="product-card">
      <img src="${product.image}" alt="${product.name}" />
      <div class="product-meta">
        <span>${product.category}</span>
        <span class="product-price">${formatCurrency(product.price)}</span>
      </div>
      <h3>${product.name}</h3>
      <p>${product.description}</p>
      <button type="button" class="primary add-to-cart" data-product-id="${product.id}">Add to cart</button>
      ${renderProductReviews(product)}
    </article>
  `).join('');

  return `
    <section class="feature-section">
      <div class="section-heading">
        <span class="eyebrow">Shop</span>
        <h2>Our bakery collection</h2>
      </div>
      <div class="product-grid">${cards}</div>
    </section>
  `;
}

function renderStudentPortal() {
  const enrollments = state.trainingEnrollments;
  const studentEnrollments = state.user ? enrollments.filter((item) => item.email === state.user.email) : [];
  const studentCourses = state.trainings.map((course) => {
    const isBooked = enrollments.some((item) => item.courseId === course.id && item.email === state.user?.email);
    return `
      <article class="training-card">
        <h3>${course.title}</h3>
        <div class="training-meta"><span>${escapeHtml(course.duration)}</span><span class="training-fee">${formatCurrency(course.fee)}</span></div>
        <p>${course.topics.join(' • ')}</p>
        <ul class="training-list">
          <li>Start: ${escapeHtml(formatTrainingDate(course.date))}</li>
          <li>Location: ${escapeHtml(course.location)}</li>
          <li>Seats left: ${course.seats}</li>
        </ul>
        ${state.trainingPortalOpen ? `<button type="button" class="${isBooked ? 'secondary' : 'primary'} enroll-course" data-course-id="${course.id}" ${isBooked ? 'disabled' : ''}>${isBooked ? 'Booked' : 'Register'}</button>` : '<p class="muted">Registration is closed.</p>'}
      </article>
    `;
  }).join('');

  if (!state.user) {
    return `
      <section class="feature-section">
        <div class="portal-shell">
          <div class="portal-card">
            <span class="eyebrow">Training access</span>
            <h2>Sign in to view your learning portal</h2>
            ${state.trainingPortalOpen ? '<p class="muted">Registration is open. Sign in to browse courses and register.</p>' : '<p class="muted">Registration is closed. New class enrollments are not being accepted right now.</p>'}
            <button type="button" class="primary" data-page="account">Go to account portal</button>
          </div>
        </div>
      </section>
    `;
  }

  return `
    <section class="feature-section">
      <div class="section-heading">
        <span class="eyebrow">Training</span>
        <h2>Welcome back, ${state.user.name}</h2>
      </div>

      <div class="portal-grid">
        <div class="portal-card">
          <h3>Your training bookings</h3>
          <div class="metric-row"><strong>${studentEnrollments.length}</strong><span>${studentEnrollments.length === 1 ? 'course booked' : 'courses booked'}</span></div>
          ${studentEnrollments.length ? `<ul class="training-list">${studentEnrollments.map((item) => `<li>${escapeHtml(item.title)} · ${escapeHtml(formatTrainingDate(item.date))}</li>`).join('')}</ul>` : '<p class="muted">You have no class bookings yet.</p>'}
        </div>
        <div class="portal-card">
          <h3>Browse training</h3>
          <p class="muted">Choose a class below to view details and make a booking.</p>
          <button type="button" class="secondary" data-page="home">Back to shop</button>
        </div>
      </div>

      ${state.trainingPortalOpen ? `<div class="training-grid" style="margin-top: 24px;">${studentCourses}</div>` : '<div class="portal-card training-closed"><h3>Registration is closed</h3><p class="muted">New class enrollments are not being accepted right now. Please check back later.</p></div>'}
    </section>
  `;
}

function renderCustomerChatSection() {
  if (!state.user) {
    return `<section class="feature-section"><div class="portal-shell"><div class="portal-card"><span class="eyebrow">Customer support</span><h2>Sign in to chat with Ashmie</h2><button type="button" class="primary" data-page="account">Open account portal</button></div></div></section>`;
  }
  if (state.user.role === 'admin') {
    return `<section class="feature-section"><div class="portal-shell"><div class="portal-card"><span class="eyebrow">Admin inbox</span><h2>Use the admin inbox to reply to customers</h2><button type="button" class="primary" data-page="admin-chat">Open inbox</button></div></div></section>`;
  }

  return `
    <section class="feature-section">
      <div class="section-heading"><span class="eyebrow">Customer support</span><h2>Chat with Ashmie</h2></div>
      <div class="chat-panel customer-chat-panel">
        <div class="chat-panel-heading"><div><strong>ASHMIE CAKES & MORE</strong><span>Send us a message about an order or product.</span></div><span class="chat-online-indicator">Support inbox</span></div>
        <div id="chat-message-list" class="chat-message-list" aria-live="polite">${renderChatMessages(state.chatMessages, 'Send a message to start a conversation with Ashmie.')}</div>
        <p id="chat-error" class="form-message" role="alert">${escapeHtml(state.chatError)}</p>
        <form class="chat-compose">
          <label class="visually-hidden" for="customer-chat-message">Your message</label>
          <textarea id="customer-chat-message" name="body" rows="2" maxlength="2000" placeholder="Write your message..."></textarea>
          <div class="chat-compose-actions">
            <label class="chat-file-picker">Attach receipt<input class="visually-hidden chat-attachment-input" id="customer-chat-attachment" name="attachment" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" /></label>
            <span class="chat-file-name" aria-live="polite">Receipt file optional · 5 MB max</span>
            <button type="submit" class="primary">Send message</button>
          </div>
        </form>
      </div>
    </section>
  `;
}

function renderAdminChatSection() {
  if (!state.user || state.user.role !== 'admin') {
    return `<section class="feature-section"><div class="portal-shell"><div class="portal-card access-denied"><span class="eyebrow">Restricted inbox</span><h2>Administrator access only</h2><button type="button" class="primary" data-page="account">Open account portal</button></div></div></section>`;
  }

  const activeConversation = state.chatConversations.find((item) => item.conversationId === state.selectedChatId);
  return `
    <section class="feature-section">
      <div class="section-heading"><span class="eyebrow">Customer support</span><h2>Inbox</h2></div>
      <div class="chat-inbox">
        <aside class="chat-sidebar">
          <div class="chat-sidebar-heading"><h3>Conversations</h3><button type="button" class="secondary chat-refresh-button">Refresh</button></div>
          <div id="admin-chat-conversations" class="chat-conversation-list">${renderChatConversations()}</div>
        </aside>
        <section class="chat-panel admin-chat-panel">
          ${activeConversation ? `<div class="chat-panel-heading"><div><strong>${escapeHtml(activeConversation.customerName)}</strong><span>${escapeHtml(activeConversation.customerEmail)}</span></div><span class="chat-online-indicator">Customer</span></div>` : '<div class="chat-panel-heading"><div><strong>Inbox</strong><span>Select a customer conversation to reply.</span></div></div>'}
          <div id="chat-message-list" class="chat-message-list" aria-live="polite">${renderChatMessages(state.chatMessages, activeConversation ? 'No messages in this conversation yet.' : 'Your customer inbox is empty.')}</div>
          <p id="chat-error" class="form-message" role="alert">${escapeHtml(state.chatError)}</p>
          ${activeConversation ? `<form class="chat-compose"><label class="visually-hidden" for="admin-chat-message">Reply to ${escapeHtml(activeConversation.customerName)}</label><textarea id="admin-chat-message" name="body" rows="2" maxlength="2000" placeholder="Reply to ${escapeHtml(activeConversation.customerName)}..."></textarea><div class="chat-compose-actions"><label class="chat-file-picker">Attach file<input class="visually-hidden chat-attachment-input" id="admin-chat-attachment" name="attachment" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" /></label><span class="chat-file-name" aria-live="polite">Receipt file optional · 5 MB max</span><button type="submit" class="primary">Send reply</button></div></form>` : ''}
        </section>
      </div>
    </section>
  `;
}

function renderAdminPortal() {
  if (!state.user || state.user.role !== 'admin') {
    return `
      <section class="feature-section">
        <div class="portal-shell">
          <div class="portal-card access-denied"><span class="eyebrow">Restricted area</span><h2>Administrator access only</h2><p>Sign in with an administrator account to manage the business.</p><button type="button" class="primary" data-page="account">Open account portal</button></div>
        </div>
      </section>
    `;
  }

  const savedOrders = state.adminOverview.recentOrders || [];
  const recentReviews = state.adminOverview.recentReviews || [];
  const orderTransitions = {
    'Awaiting approval': ['Approved', 'Rejected'],
    Paid: ['Approved', 'Rejected'],
    Approved: ['Processing', 'Rejected'],
    Processing: ['Completed'],
  };
  const orderMarkup = savedOrders.length ? savedOrders.map((order) => {
    const nextStatuses = order.paymentStatus === 'success' ? orderTransitions[order.status] || [] : [];
    return `
      <li class="admin-order-entry">
        <div class="admin-order-details"><strong>${escapeHtml(order.id)}</strong><span>${escapeHtml(order.customer)}</span><span>${escapeHtml(order.status)}</span><span>${formatCurrency(order.total)}</span></div>
        ${nextStatuses.length ? `<form class="order-status-form" data-order-id="${escapeHtml(order.id)}"><label class="visually-hidden" for="order-status-${escapeHtml(order.id)}">Next status for ${escapeHtml(order.id)}</label><select id="order-status-${escapeHtml(order.id)}" name="status">${nextStatuses.map((status) => `<option value="${status}">${status}</option>`).join('')}</select><button type="submit" class="secondary">Update</button></form>` : `<span class="order-status-note">${order.paymentStatus === 'success' ? 'No more actions' : 'Waiting for payment'}</span>`}
      </li>
    `;
  }).join('') : '<li>No orders yet.</li>';
  const reviewMarkup = recentReviews.length ? recentReviews.map((review) => `
    <li class="admin-review-entry">
      <div><strong>${escapeHtml(review.author)}</strong><span>${Number(review.rating)}/5 · ${escapeHtml(state.products.find((product) => product.id === review.productId)?.name || 'Product')}</span></div>
      <p>${escapeHtml(review.comment)}</p>
    </li>
  `).join('') : '<li>No customer reviews yet.</li>';
  const productManagementMarkup = state.products.length ? state.products.map((product) => `
    <article class="admin-product-row">
      <div class="admin-product-header">
        <img src="${product.image || 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?auto=format&fit=crop&w=900&q=80'}" alt="${escapeHtml(product.name)}" />
        <strong>${escapeHtml(product.name)}</strong>
      </div>
      <form class="admin-product-edit-form" data-product-id="${escapeHtml(product.id)}">
        <input name="name" aria-label="Product name" value="${escapeHtml(product.name)}" required />
        <input name="category" aria-label="Product category" value="${escapeHtml(product.category)}" required />
        <input name="price" aria-label="Price in naira" type="number" min="1" step="1" value="${Number(product.price)}" required />
        <input name="imageFile" aria-label="Upload product image" type="file" accept="image/*" />
        <input name="image" aria-label="Product image URL" type="url" value="${escapeHtml(product.image || '')}" placeholder="Image URL fallback" />
        <textarea name="description" aria-label="Product description" rows="2" required>${escapeHtml(product.description)}</textarea>
        <button type="submit" class="secondary">Save changes</button>
      </form>
      <button type="button" class="danger-button delete-product-button" data-product-id="${escapeHtml(product.id)}" data-product-name="${escapeHtml(product.name)}">Remove product</button>
    </article>
  `).join('') : '<p class="empty-state">No products in the shop.</p>';
  const trainingSettingsMarkup = state.trainings.map((training) => `
    <fieldset class="training-course-settings">
      <legend>${escapeHtml(training.title)}</legend>
      <div class="training-course-fields">
        <label>Fee (₦)<input name="fee-${escapeHtml(training.id)}" type="number" min="1" step="1" value="${Number(training.fee)}" required /></label>
        <label>Training center location<input name="location-${escapeHtml(training.id)}" value="${escapeHtml(training.location)}" maxlength="200" required /></label>
        <label>Starting date<input name="date-${escapeHtml(training.id)}" type="date" value="${escapeHtml(toDateInputValue(training.date))}" required /></label>
        <label>Duration<input name="duration-${escapeHtml(training.id)}" value="${escapeHtml(training.duration)}" maxlength="80" placeholder="e.g. 2 Weeks" required /></label>
      </div>
    </fieldset>
  `).join('');

  return `
    <section class="admin-shell feature-section">
      <div class="admin-header-panel">
        <div>
          <span class="eyebrow">Admin portal</span>
          <h2>Business operations dashboard</h2>
        </div>
      </div>

      <div class="summary-grid">
        ${state.adminOverview.stats.map((item) => `
          <div class="dashboard-card">
            <span>${item.label}</span>
            <strong>${item.value}</strong>
            <small>${item.change}</small>
          </div>
        `).join('')}
      </div>

      <div class="admin-content-grid">
        <div class="portal-card admin-primary-card">
          <div class="admin-card-header">
            <h3>Add product</h3>
            <span>Product catalog</span>
          </div>
          <form id="product-form" class="portal-form form-grid">
            <input name="name" type="text" placeholder="Product name" required />
            <input name="category" type="text" placeholder="Category" required />
            <input name="price" type="number" placeholder="Price" min="0" required />
            <label class="file-upload-field">
              <span>Upload product image</span>
              <input name="imageFile" type="file" accept="image/*" />
            </label>
            <input name="image" type="url" placeholder="Image URL fallback (optional)" />
            <textarea name="description" rows="2" placeholder="Product description" required></textarea>
            <button type="submit" class="primary">Save product</button>
          </form>
        </div>

        <div class="portal-card admin-secondary-card">
          <div class="admin-card-header">
            <h3>Latest orders</h3>
            <span>Fulfillment</span>
          </div>
          <ul class="admin-list">${orderMarkup}</ul>
        </div>
      </div>

      <div class="portal-card payment-settings-card admin-catalog-card">
        <div class="admin-card-header">
          <span class="eyebrow">Shop catalog</span>
          <h3>Manage products and prices</h3>
        </div>
        <div class="admin-product-list">${productManagementMarkup}</div>
      </div>

      <div class="admin-lower-grid">
        <div class="portal-card payment-settings-card">
          <div class="admin-card-header">
            <span class="eyebrow">Training registration</span>
            <h3>Training portal</h3>
          </div>
          <form id="training-settings-form" class="portal-form form-grid">
            <fieldset class="registration-status-control">
              <legend>Registration status</legend>
              <div class="registration-status-options" role="radiogroup" aria-label="Training registration status">
                <label class="registration-status-option ${state.adminOverview.trainingPortalOpen ? 'selected open' : ''}">
                  <input name="isOpen" type="radio" value="true" ${state.adminOverview.trainingPortalOpen ? 'checked' : ''} />
                  <span>OPEN</span>
                </label>
                <label class="registration-status-option ${!state.adminOverview.trainingPortalOpen ? 'selected closed' : ''}">
                  <input name="isOpen" type="radio" value="false" ${!state.adminOverview.trainingPortalOpen ? 'checked' : ''} />
                  <span>CLOSE</span>
                </label>
              </div>
            </fieldset>
            ${trainingSettingsMarkup}
            <button type="submit" class="primary">Save Training settings</button>
          </form>
        </div>

        <div class="portal-card payment-settings-card">
          <div class="admin-card-header">
            <h3>Recent customer reviews</h3>
            <span>Feedback</span>
          </div>
          <ul class="admin-list">${reviewMarkup}</ul>
        </div>
      </div>

      <div class="admin-lower-grid">
        <div class="portal-card payment-settings-card">
          <div class="admin-card-header">
            <span class="eyebrow">Checkout settings</span>
            <h3>Payment details</h3>
          </div>
          <form id="payment-settings-form" class="portal-form form-grid">
            <label>Bank name<input name="bankName" value="${escapeHtml(state.paymentDetails.bankName)}" required /></label>
            <label>Account name<input name="accountName" value="${escapeHtml(state.paymentDetails.accountName)}" required /></label>
            <label>Account number<input name="accountNumber" inputmode="numeric" value="${escapeHtml(state.paymentDetails.accountNumber)}" required /></label>
            <label>Delivery fee (₦)<input name="deliveryFee" type="number" min="0" step="1" value="${Number(state.paymentDetails.deliveryFee) || 0}" required /></label>
            <label>Payment instructions<textarea name="instructions" rows="3" required>${escapeHtml(state.paymentDetails.instructions)}</textarea></label>
            <button type="submit" class="primary">Save payment details</button>
          </form>
        </div>

        <div class="portal-card payment-settings-card">
          <div class="admin-card-header">
            <span class="eyebrow">Team access</span>
            <h3>Create administrator account</h3>
          </div>
          <p class="muted">Only an administrator can add another administrator.</p>
          <form id="admin-account-form" class="portal-form form-grid">
            <label>Full name<input name="name" autocomplete="name" required /></label>
            <label>Email address<input name="email" type="email" autocomplete="email" required /></label>
            <label>Temporary password<input name="password" type="password" minlength="8" autocomplete="new-password" required /></label>
            <button type="submit" class="primary">Create admin account</button>
          </form>
        </div>
      </div>

      <div class="portal-card payment-settings-card admin-security-card">
        <div class="admin-card-header">
          <span class="eyebrow">Registration security</span>
          <h3>Change admin signup code</h3>
        </div>
        <p class="muted">Share the new code only with people approved to create an administrator account.</p>
        <form id="admin-signup-code-form" class="portal-form form-grid">
          <label>New unique code<input name="code" type="password" minlength="4" maxlength="64" autocomplete="new-password" required /></label>
          <label>Confirm code<input name="confirmation" type="password" minlength="4" maxlength="64" autocomplete="new-password" required /></label>
          <button type="submit" class="primary">Update signup code</button>
        </form>
      </div>
    </section>
  `;
}

function renderAccountPortal() {
  const signUp = state.accountMode === 'register';
  return `
    <section class="feature-section account-section">
      <div class="account-intro"><span class="eyebrow">Your Ashmie account</span><h1>${signUp ? 'Make room for something sweet.' : 'Welcome back.'}</h1><p>Order your favourites, track your learning and keep your details in one place.</p></div>
      <div class="portal-shell">
        <div class="portal-card auth-card">
          <div class="auth-tabs" role="tablist" aria-label="Account access">
            <button type="button" class="auth-tab ${!signUp ? 'active' : ''}" data-auth-mode="login" role="tab" aria-selected="${!signUp}">Sign in</button>
            <button type="button" class="auth-tab ${signUp ? 'active' : ''}" data-auth-mode="register" role="tab" aria-selected="${signUp}">Create account</button>
          </div>
          <div class="auth-panel" key="${state.accountMode}">
            <h2>${signUp ? 'Create your account' : 'Sign in to Ashmie'}</h2>
            <p class="muted">${signUp ? 'Join the community for easier orders and training bookings.' : 'Access your orders, classes and account.'}</p>
            ${state.authMessage ? `<p class="form-message" role="alert">${state.authMessage}</p>` : ''}
            <form id="account-form" class="portal-form login-form">
              ${signUp ? '<label>Full name<input name="name" type="text" autocomplete="name" required /></label><label>Account type<select id="account-type" name="accountType"><option value="customer">Customer</option><option value="admin">Administrator</option></select></label><label id="admin-code-field" hidden>Admin signup code<input name="adminCode" type="password" minlength="4" maxlength="64" autocomplete="off" /></label>' : ''}
              <label>Email address<input name="email" type="email" autocomplete="email" required /></label>
              <label>Password<input name="password" type="password" autocomplete="${signUp ? 'new-password' : 'current-password'}" minlength="8" required /></label>
              <button type="submit" class="primary">${signUp ? 'Create account' : 'Sign in'}</button>
            </form>
            <p class="account-note">Administrator registration requires an approval code. Ask an existing administrator for access.</p>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderCartSection() {
  const items = getCartItems();
  const subtotal = items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
  const delivery = subtotal ? Number(state.paymentDetails.deliveryFee) : 0;
  const total = subtotal + delivery;

  const itemMarkup = items.length
    ? items.map((item) => `
      <div class="cart-card">
        <div class="cart-row">
          <div>
            <h3>${item.name}</h3>
            <p>${item.category}</p>
          </div>
          <strong>${formatCurrency(item.price * item.quantity)}</strong>
        </div>
        <div class="cart-toolbar">
          <button type="button" class="secondary qty-btn" data-product-id="${item.id}" data-delta="-1">-</button>
          <span class="qty-value">Qty: ${item.quantity}</span>
          <button type="button" class="secondary qty-btn" data-product-id="${item.id}" data-delta="1">+</button>
        </div>
      </div>
    `).join('')
    : '<p class="empty-state">Your cart is empty. Add a few tasty items to get started.</p>';

  return `
    <section class="feature-section">
      <div class="section-heading">
        <span class="eyebrow">Cart</span>
        <h2>Your order summary</h2>
      </div>
      <div class="admin-grid">
        <div class="portal-card">${itemMarkup}</div>
        <div class="portal-card">
          <h3>Summary</h3>
          <div class="cart-summary">
            <div class="cart-row"><span>Subtotal</span><span>${formatCurrency(subtotal)}</span></div>
            <div class="cart-row"><span>Delivery</span><span>${formatCurrency(delivery)}</span></div>
            <div class="cart-total"><span>Total</span><span>${formatCurrency(total)}</span></div>
          </div>
          <button type="button" class="primary checkout-button">Proceed to checkout</button>
        </div>
      </div>
    </section>
  `;
}

function renderCheckoutSection() {
  const items = getCartItems();
  const subtotal = items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
  const delivery = state.fulfillmentMethod === 'delivery' && subtotal ? Number(state.paymentDetails.deliveryFee) : 0;
  const total = subtotal + delivery;
  return `
    <section class="feature-section">
      <div class="section-heading"><span class="eyebrow">Secure checkout</span><h2>Complete your order</h2></div>
      <div class="checkout-layout">
        <div class="portal-card payment-instructions">
          <span class="payment-step">01 / Secure online payment</span>
          <h3>Pay with Paystack</h3>
          <dl class="payment-detail-list">
            <div><dt>Delivery fee</dt><dd class="checkout-delivery-amount">${formatCurrency(delivery)}</dd></div>
            <div><dt>Amount to pay</dt><dd class="checkout-total-amount">${formatCurrency(total)}</dd></div>
          </dl>
          <p class="muted">You’ll continue to Paystack to complete payment using the methods enabled for this account.</p>
          <p class="payment-notice">Your order is confirmed only after Paystack verifies the transaction.</p>
        </div>
        <div class="portal-card">
          <span class="payment-step">02 / Order contact</span>
          <h3>Where can we reach you?</h3>
          <form id="checkout-form" class="portal-form">
            <fieldset class="fulfillment-options">
              <legend>How would you like to receive your order?</legend>
              <label class="fulfillment-choice ${state.fulfillmentMethod === 'delivery' ? 'selected' : ''}">
                <input class="fulfillment-option" type="radio" name="fulfillmentMethod" value="delivery" ${state.fulfillmentMethod === 'delivery' ? 'checked' : ''} />
                <span><strong>Deliver to me</strong><small>${formatCurrency(Number(state.paymentDetails.deliveryFee))} delivery fee</small></span>
              </label>
              <label class="fulfillment-choice ${state.fulfillmentMethod === 'pickup' ? 'selected' : ''}">
                <input class="fulfillment-option" type="radio" name="fulfillmentMethod" value="pickup" ${state.fulfillmentMethod === 'pickup' ? 'checked' : ''} />
                <span><strong>Pick up in shop</strong><small>No delivery fee</small></span>
              </label>
            </fieldset>
            <div id="delivery-address-panel" ${state.fulfillmentMethod === 'pickup' ? 'hidden' : ''}>
              <label>Delivery address<textarea name="deliveryAddress" rows="3" placeholder="Street, area and city" ${state.fulfillmentMethod === 'delivery' ? 'required' : ''}></textarea></label>
            </div>
            <p id="pickup-location" class="muted" ${state.fulfillmentMethod === 'delivery' ? 'hidden' : ''}>Pickup location: ${escapeHtml(state.site.address)}</p>
            <label>Full name<input name="customerName" value="${state.user?.name || ''}" autocomplete="name" required /></label>
            <label>Email address<input name="customerEmail" type="email" value="${state.user?.email || ''}" autocomplete="email" required /></label>
            <label>Phone number<input name="customerPhone" type="tel" autocomplete="tel" required /></label>
            <div class="cart-row"><span>Delivery</span><span class="checkout-delivery-amount">${formatCurrency(delivery)}</span></div>
            <div class="cart-total"><span>Order total</span><span class="checkout-total-amount">${formatCurrency(total)}</span></div>
            <button type="submit" class="primary" ${items.length ? '' : 'disabled'}>Continue to payment</button>
            <button type="button" class="secondary" data-page="cart">Return to cart</button>
          </form>
        </div>
      </div>
    </section>
  `;
}

function renderPaymentResult() {
  const result = state.paymentResult || {};
  const paid = result.paymentStatus === 'success';
  const pending = result.paymentStatus === 'pending';
  return `
    <section class="feature-section">
      <div class="portal-shell">
        <div class="portal-card payment-result ${paid ? 'payment-success' : ''}">
          <span class="eyebrow">${paid ? 'Payment confirmed' : pending ? 'Payment processing' : 'Payment not completed'}</span>
          <h2>${paid ? 'Thank you for your order.' : pending ? 'We are checking your payment.' : 'Your payment was not confirmed.'}</h2>
          <p>${paid ? `Order ${escapeHtml(result.orderId)} is paid. We’ll contact you with the next steps.` : escapeHtml(result.message || (pending ? 'Refresh this page shortly to check again.' : 'Your cart is still available if you would like to try again.'))}</p>
          ${paid ? `<p class="payment-result-total">Paid ${formatCurrency(result.amount)}</p>` : ''}
          <div class="actions">
            <button type="button" class="primary" data-page="${paid ? 'shop' : 'cart'}">${paid ? 'Continue shopping' : 'Return to cart'}</button>
            <button type="button" class="secondary" data-page="home">Back home</button>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderManualPaymentSection() {
  const transfer = state.pendingManualOrder;
  if (!transfer?.order || !transfer.paymentDetails) {
    return `<section class="feature-section"><div class="portal-shell"><div class="portal-card"><h2>No pending transfer order</h2><button type="button" class="primary" data-page="shop">Return to shop</button></div></div></section>`;
  }

  const { order, paymentDetails } = transfer;
  const itemMarkup = order.items.map((item) => `
    <li><span>${escapeHtml(item.name)} × ${Number(item.quantity)}</span><strong>${formatCurrency(item.total)}</strong></li>
  `).join('');
  const inboxButton = state.user && state.user.role !== 'admin'
    ? '<button type="button" class="primary" data-page="chat">Share receipt in inbox</button>'
    : '<button type="button" class="primary" data-page="account" data-auth-return-page="manual-payment">Sign in to share your receipt</button>';

  return `
    <section class="feature-section">
      <div class="section-heading"><span class="eyebrow">Order ${escapeHtml(order.id)}</span><h2>Complete your bank transfer</h2></div>
      <div class="manual-payment-layout">
        <div class="portal-card manual-transfer-card">
          <span class="payment-step">Bank transfer instructions</span>
          <h3>Transfer ${formatCurrency(order.total)}</h3>
          <dl class="payment-detail-list">
            <div><dt>Bank</dt><dd>${escapeHtml(paymentDetails.bankName)}</dd></div>
            <div><dt>Account name</dt><dd>${escapeHtml(paymentDetails.accountName)}</dd></div>
            <div><dt>Account number</dt><dd><span id="manual-account-number">${escapeHtml(paymentDetails.accountNumber)}</span><button type="button" class="secondary copy-account-button">Copy account number</button></dd></div>
            <div><dt>Payment reference</dt><dd>${escapeHtml(order.reference)}</dd></div>
          </dl>
          <p class="manual-transfer-instructions">${escapeHtml(paymentDetails.instructions)}</p>
          <p class="payment-notice">Your order ${escapeHtml(order.id)} is pending until your transfer is confirmed. Send your receipt in the support inbox after payment.</p>
          <div class="actions manual-payment-actions">${inboxButton}<button type="button" class="secondary" data-page="home">Continue shopping</button></div>
        </div>
        <div class="portal-card manual-order-card">
          <h3>Order summary</h3>
          <ul class="manual-order-items">${itemMarkup}</ul>
          <div class="cart-row"><span>Subtotal</span><span>${formatCurrency(order.subtotal)}</span></div>
          <div class="cart-row"><span>Delivery</span><span>${formatCurrency(order.deliveryFee)}</span></div>
          <div class="cart-total"><span>Total due</span><span>${formatCurrency(order.total)}</span></div>
        </div>
      </div>
    </section>
  `;
}

function renderFooter() {
  return `
    <footer class="site-footer">
      <div class="footer-inner">
        <div class="footer-main">
          <div class="footer-brand"><button type="button" class="brand-wrap" data-page="home"><img class="brand-logo" src="/ashmie-logo.jpeg" alt="" /><span>${state.site.name}</span></button><p>Thoughtful bakes, joyful celebrations and practical skills from ${escapeHtml(state.site.address)}.</p></div>
          <div class="footer-column"><h3>Explore</h3><button type="button" data-page="shop">Shop collection</button><button type="button" data-page="student">Baking classes</button><button type="button" data-page="account">My account</button></div>
          <div class="footer-column"><h3>Get in touch</h3><a href="tel:${state.site.phone}">${state.site.phone}</a><a href="mailto:${state.site.email}">${state.site.email}</a><span>${state.site.address}</span></div>
          <div class="footer-cta"><span class="eyebrow">Made to be shared</span><p>Planning a celebration or looking to learn?</p><button type="button" class="secondary" data-page="shop">Find your favourite</button></div>
        </div>
        <div class="footer-bottom"><span>© ${new Date().getFullYear()} ${state.site.name}. All rights reserved.</span><span>Baked with care at ${escapeHtml(state.site.address)}</span></div>
      </div>
    </footer>
  `;
}

function renderApp() {
  const pageContent = {
    home: renderHomeSection(),
    shop: renderShopSection(),
    student: renderStudentPortal(),
    chat: renderCustomerChatSection(),
    'admin-chat': renderAdminChatSection(),
    account: renderAccountPortal(),
    cart: renderCartSection(),
    checkout: renderCheckoutSection(),
    'payment-result': renderPaymentResult(),
    'manual-payment': renderManualPaymentSection(),
    admin: renderAdminPortal(),
  };

  const isAdminUser = state.user?.role === 'admin';
  app.innerHTML = `
    <div class="page-shell">
      <header class="topbar ${isAdminUser ? 'admin-topbar' : ''}">
        <div class="brand-wrap">
          <img class="brand-logo" src="/ashmie-logo.jpeg" alt="" />
          <span>${state.site.name}</span>
        </div>
        ${isAdminUser ? `
          <div class="admin-topbar-actions">
            <button type="button" class="${state.page === 'admin' ? 'primary' : 'secondary'}" data-page="admin">Dashboard</button>
            <button type="button" class="${state.page === 'admin-chat' ? 'primary' : 'secondary'}" data-page="admin-chat">Inbox</button>
            <button type="button" class="${state.page === 'home' ? 'primary' : 'secondary'}" data-page="home">View storefront</button>
            <button type="button" id="logout-button" class="nav-button">Sign out</button>
          </div>
        ` : `
          <nav class="main-nav" aria-label="Main navigation">
            <button type="button" class="nav-link ${state.page === 'home' ? 'active' : ''}" data-page="home">Home</button>
            <button type="button" class="nav-link ${state.page === 'shop' ? 'active' : ''}" data-page="shop">Shop</button>
            <button type="button" class="nav-link ${state.page === 'student' ? 'active' : ''}" data-page="student">Training</button>
            <button type="button" class="nav-link ${state.page === 'chat' ? 'active' : ''}" data-page="chat">Chat</button>
            <button type="button" class="nav-link ${state.page === 'cart' ? 'active' : ''}" data-page="cart">Cart (${getCartCount()})</button>
            ${state.user ? `<button type="button" id="logout-button" class="nav-button">Sign out</button>` : `<button type="button" class="nav-button" data-page="account">Sign in</button>`}
          </nav>
        `}
      </header>

      <main>${pageContent[state.page] || renderHomeSection()}</main>
    </div>
    ${renderFooter()}
  `;

  document.querySelectorAll('[data-page]').forEach((button) => {
    button.addEventListener('click', () => {
      const page = button.dataset.page;
      if (page) {
        if (button.dataset.authReturnPage) state.authReturnPage = button.dataset.authReturnPage;
        navigateToPage(page);
      }
    });
  });

  document.querySelectorAll('.add-to-cart').forEach((button) => {
    button.addEventListener('click', () => addToCart(button.dataset.productId));
  });

  document.querySelectorAll('.product-review-form').forEach((form) => {
    form.addEventListener('submit', submitProductReview);
  });

  document.querySelectorAll('.enroll-course').forEach((button) => {
    button.addEventListener('click', () => enrollTraining(button.dataset.courseId));
  });

  document.querySelectorAll('.qty-btn').forEach((button) => {
    button.addEventListener('click', () => {
      updateCartQuantity(button.dataset.productId, Number(button.dataset.delta));
    });
  });

  const checkoutButton = document.querySelector('.checkout-button');
  if (checkoutButton) {
    checkoutButton.addEventListener('click', checkoutCart);
  }

  const productForm = document.querySelector('#product-form');
  if (productForm) {
    productForm.addEventListener('submit', addProductFromForm);
  }

  document.querySelectorAll('.admin-product-edit-form').forEach((form) => {
    form.addEventListener('submit', updateProduct);
  });

  document.querySelectorAll('.delete-product-button').forEach((button) => {
    button.addEventListener('click', () => deleteProduct(button));
  });

  const trainingSettingsForm = document.querySelector('#training-settings-form');
  if (trainingSettingsForm) {
    trainingSettingsForm.addEventListener('submit', saveTrainingSettings);
    trainingSettingsForm.querySelectorAll('input[name="isOpen"]').forEach((input) => {
      input.addEventListener('change', () => {
        trainingSettingsForm.querySelectorAll('.registration-status-option').forEach((option) => {
          const isSelected = option.querySelector('input').checked;
          option.classList.toggle('selected', isSelected);
          option.classList.toggle('open', isSelected && option.querySelector('input').value === 'true');
          option.classList.toggle('closed', isSelected && option.querySelector('input').value === 'false');
        });
        persistTrainingSettings(trainingSettingsForm);
      });
    });
  }

  const accountForm = document.querySelector('#account-form');
  if (accountForm) {
    accountForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(accountForm);
      if (state.accountMode === 'register') {
        await registerAccount(formData.get('name'), formData.get('email'), formData.get('password'), formData.get('accountType'), formData.get('adminCode'));
      } else {
        await loginWithCredentials(formData.get('email'), formData.get('password'));
      }
    });
  }

  document.querySelectorAll('[data-auth-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      state.accountMode = button.dataset.authMode;
      state.authMessage = '';
      renderApp();
    });
  });

  const accountType = document.querySelector('#account-type');
  if (accountType) {
    const adminCodeField = document.querySelector('#admin-code-field');
    const adminCodeInput = adminCodeField.querySelector('input');
    const updateAdminCodeVisibility = () => {
      const creatingAdmin = accountType.value === 'admin';
      adminCodeField.hidden = !creatingAdmin;
      adminCodeInput.required = creatingAdmin;
    };
    accountType.addEventListener('change', updateAdminCodeVisibility);
    updateAdminCodeVisibility();
  }

  const checkoutForm = document.querySelector('#checkout-form');
  if (checkoutForm) checkoutForm.addEventListener('submit', placeOrder);

  const copyAccountButton = document.querySelector('.copy-account-button');
  if (copyAccountButton) {
    copyAccountButton.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(state.pendingManualOrder.paymentDetails.accountNumber);
        showNotification('Account number copied.');
      } catch {
        showNotification('Unable to copy the account number on this device.', 'error');
      }
    });
  }

  document.querySelectorAll('.fulfillment-option').forEach((input) => {
    input.addEventListener('change', () => {
      state.fulfillmentMethod = input.value;
      const delivery = state.fulfillmentMethod === 'delivery' && state.cart.length
        ? Number(state.paymentDetails.deliveryFee)
        : 0;
      const subtotal = getCartItems().reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
      const total = subtotal + delivery;
      document.querySelectorAll('.fulfillment-choice').forEach((choice) => {
        choice.classList.toggle('selected', choice.querySelector('input').checked);
      });
      document.querySelectorAll('.checkout-delivery-amount').forEach((amount) => {
        amount.textContent = formatCurrency(delivery);
      });
      document.querySelectorAll('.checkout-total-amount').forEach((amount) => {
        amount.textContent = formatCurrency(total);
      });
      document.querySelector('#delivery-address-panel').hidden = state.fulfillmentMethod !== 'delivery';
      document.querySelector('#delivery-address-panel textarea').required = state.fulfillmentMethod === 'delivery';
      document.querySelector('#pickup-location').hidden = state.fulfillmentMethod !== 'pickup';
    });
  });

  const paymentForm = document.querySelector('#payment-settings-form');
  if (paymentForm) paymentForm.addEventListener('submit', savePaymentDetails);

  const adminAccountForm = document.querySelector('#admin-account-form');
  if (adminAccountForm) adminAccountForm.addEventListener('submit', createAdminAccount);

  const adminSignupCodeForm = document.querySelector('#admin-signup-code-form');
  if (adminSignupCodeForm) adminSignupCodeForm.addEventListener('submit', updateAdminSignupCode);

  document.querySelectorAll('.order-status-form').forEach((form) => {
    form.addEventListener('submit', updateOrderStatus);
  });

  document.querySelectorAll('.chat-compose').forEach((form) => {
    form.addEventListener('submit', sendChatMessage);
  });

  document.querySelectorAll('.chat-attachment-input').forEach((input) => {
    input.addEventListener('change', () => {
      const fileName = input.closest('.chat-compose').querySelector('.chat-file-name');
      fileName.textContent = input.files[0]?.name || 'Receipt file optional · 5 MB max';
    });
  });

  const chatConversations = document.querySelector('#admin-chat-conversations');
  if (chatConversations) {
    chatConversations.addEventListener('click', async (event) => {
      const button = event.target.closest('[data-conversation-id]');
      if (!button) return;
      state.selectedChatId = button.dataset.conversationId;
      await refreshChatData();
      renderApp();
    });
  }

  const chatRefreshButton = document.querySelector('.chat-refresh-button');
  if (chatRefreshButton) chatRefreshButton.addEventListener('click', () => refreshChatData({ render: true }));

  if (state.page === 'admin' && (!state.user || state.user.role !== 'admin')) {
    document.querySelectorAll('[data-page="admin"]').forEach((button) => {
      button.setAttribute('aria-label', 'Administrator access required');
    });
  }

  const logoutButton = document.querySelector('#logout-button');
  if (logoutButton) {
    logoutButton.addEventListener('click', logout);
  }

  configureChatPolling();
}

(async function init() {
  await loadStorefront();
  const token = readStorage('ashmie_auth_token', '');
  if (token) {
    const response = await fetch('/api/session', { headers: { Authorization: `Bearer ${token}` } });
    if (response.ok) {
      const data = await response.json();
      state.user = data.user;
      if (state.user.role === 'admin') await loadAdminOverview();
      else await loadTrainingEnrollments();
    } else {
      localStorage.removeItem('ashmie_auth_token');
    }
  }
  await verifyPaystackCallback();
  renderApp();
})();
