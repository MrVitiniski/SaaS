window.Auth = (() => {
  const getTenantSlug = () => new URLSearchParams(window.location.search).get('tenant') || '';

  const buildPageUrl = (page, tenantSlug = '') => {
    const url = new URL(page, window.location.href);
    if (tenantSlug) {
      url.searchParams.set('tenant', tenantSlug);
    }
    return `${url.pathname.split('/').pop()}${url.search}`;
  };

  const setFeedback = (element, type, message) => {
    if (!element) return;

    const variants = {
      error: 'border-rose-500/40 bg-rose-500/10 text-rose-100',
      success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100',
      info: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-100'
    };

    element.className = `mb-4 rounded-2xl border px-4 py-3 text-sm ${variants[type] || variants.info}`;
    element.textContent = message;
    element.classList.remove('hidden');
  };

  const clearFeedback = (element) => {
    if (!element) return;
    element.textContent = '';
    element.classList.add('hidden');
  };

  const fetchJson = async (path, options = {}) => {
    const response = await fetch(path, {
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    });

    let data = {};
    try {
      data = await response.json();
    } catch (error) {
      throw new Error('Resposta inválida do servidor.');
    }

    if (!response.ok) {
      throw new Error(data.erro || 'Não foi possível concluir a solicitação.');
    }

    if (data.erro) {
      throw new Error(data.erro);
    }

    return data;
  };

  const loadTenantContext = async (tenantSlug) => {
    if (!tenantSlug) {
      throw new Error('Nenhum estabelecimento foi informado.');
    }

    return fetchJson(`api/identificar_tenant.php?tenant=${encodeURIComponent(tenantSlug)}`, {
      headers: {}
    });
  };

  const checkSession = async () => fetchJson('api/checar_sessao.php', { headers: {} });

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
  const normalizePhone = (phone) => String(phone || '').replace(/\D/g, '');
  const validatePhone = (phone) => normalizePhone(phone).length >= 10;

  return {
    buildPageUrl,
    checkSession,
    clearFeedback,
    fetchJson,
    getTenantSlug,
    loadTenantContext,
    normalizePhone,
    setFeedback,
    validateEmail,
    validatePhone
  };
})();
