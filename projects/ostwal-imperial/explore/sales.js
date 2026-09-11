/**
 * Lead capture for the Ostwal Imperial explorer.
 *
 * Deliberately the same pipeline as the rest of omshantinrconstruction.com:
 * log the lead to the Supabase inbound-lead function, then hand the visitor to
 * WhatsApp with the context already written out. Kept separate from app.js so
 * the viewer can be regenerated without losing the sales wiring.
 */
const LEAD_ENDPOINT = 'https://xiwqnlhrinpykglrekac.supabase.co/functions/v1/inbound-lead';
const LEAD_KEY = 'b688877b80ecf9ed8d989e6191476131a6440397f150c107';
const WHATSAPP = '918262885023';

function captureLead(payload) {
  try {
    fetch(LEAD_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-lead-key': LEAD_KEY },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch (e) { /* never block the visitor on analytics */ }
}

const $ = (id) => document.getElementById(id);

export function initSales(getSelected) {
  const dialog = $('book');
  const form = $('book-form');
  const context = $('book-context');
  const sent = $('book-sent');
  const submit = $('book-submit');
  const label = submit.querySelector('span');

  function open() {
    const u = getSelected();
    context.innerHTML = u
      ? `<span class="eyebrow">Home of interest</span><b>${u.id}</b> · ${u.type} · ${u.rera} sq ft carpet · ${u.bldgLabel}, Wing ${u.wing}, floor ${u.floor}<br><span class="muted">${u.facing}</span>`
      : '<span class="eyebrow">Home of interest</span><span class="muted">No specific home selected — the team will help you shortlist one.</span>';
    dialog.showModal();
    setTimeout(() => $('b-name').focus(), 80);
  }

  $('enquire').onclick = open;
  const bar = $('sitebar-cta');
  if (bar) bar.onclick = (e) => { e.preventDefault(); open(); };
  $('close-book').onclick = () => dialog.close();

  form.onsubmit = (e) => {
    e.preventDefault();
    if (submit.disabled) return;
    const v = (id) => ($(id) || {}).value || '';
    const name = v('b-name').trim(), phone = v('b-phone').trim();
    if (!name || !phone) return;
    const u = getSelected();

    captureLead({
      name, phone,
      email: v('b-email').trim(),
      project: 'Ostwal Imperial',
      unit: u ? u.id : '',
      config: u ? u.type : v('b-config'),
      building: u ? u.bldgLabel : '',
      visit_date: v('b-date'),
      visit_slot: v('b-slot'),
      message: v('b-msg').trim(),
      form: 'ostwal-3d-explorer',
      context: u ? { floor: u.floor, wing: u.wing, facing: u.facing, rera: u.rera, sanc: u.sanc } : null,
    });

    const lines = [
      'Hello Om Shanti N R Construction,', '',
      'I would like to book a site visit at Ostwal Imperial.', '',
      'Name: ' + name,
      'Phone: ' + phone,
      u ? `Home: ${u.id} (${u.type}, ${u.rera} sq ft, ${u.bldgLabel}, floor ${u.floor})` : 'Configuration: ' + v('b-config'),
      u ? 'Facing: ' + u.facing : '',
      v('b-date') ? 'Preferred date: ' + v('b-date') : '',
      'Preferred time: ' + v('b-slot'),
      v('b-msg').trim() ? 'Note: ' + v('b-msg').trim() : '',
      '', '(Sent from the 3D explorer)',
    ].filter(Boolean);

    submit.classList.add('busy');
    setTimeout(() => {
      label.textContent = 'Opening WhatsApp ✓';
      submit.classList.remove('busy');
      submit.disabled = true;
      sent.hidden = false;
      window.open('https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(lines.join('\n')), '_blank');
    }, 220);
  };

  // Today is the earliest a visit can be booked.
  const date = $('b-date');
  if (date) date.min = new Date().toISOString().slice(0, 10);
}
