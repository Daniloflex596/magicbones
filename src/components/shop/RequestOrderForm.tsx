import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { CartItem } from '../../stores/cartStore';
import { buildMailtoLink, buildWhatsAppLink } from '../../lib/order-message';

export function RequestOrderForm({ items, onSent }: { items: CartItem[]; onSent: () => void }) {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [notes, setNotes] = useState('');
  const [sent, setSent] = useState<'whatsapp' | 'email' | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function send(channel: 'whatsapp' | 'email') {
    const url = channel === 'whatsapp' ? buildWhatsAppLink(items, name, contact, notes) : buildMailtoLink(items, name, contact, notes);
    window.open(url, channel === 'whatsapp' ? '_blank' : '_self');
    setSent(channel);
    onSent();
  }

  /**
   * Il canale email e un <button type="button">, quindi NON passa dalla
   * validazione nativa del form: senza questo controllo si poteva inviare a
   * modulo vuoto e Claudia riceveva "senza nome / Contatto: da specificare",
   * con il carrello svuotato e nessun modo di ricontattare il cliente.
   * `reportValidity()` esegue le stesse regole del submit e mostra i messaggi
   * del browser.
   */
  function sendEmail() {
    if (formRef.current && !formRef.current.reportValidity()) return;
    send('email');
  }

  if (sent) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="order-confirm">
        <p>
          {sent === 'whatsapp'
            ? 'Si è aperta una chat WhatsApp con il tuo riepilogo già scritto: invia il messaggio per completare la richiesta.'
            : 'Si è aperto il tuo client email con il riepilogo già scritto: invia il messaggio per completare la richiesta.'}
        </p>
        <p className="order-confirm__note">Claudia ti risponderà personalmente per confermare disponibilità e spedizione.</p>
      </motion.div>
    );
  }

  return (
    <form
      ref={formRef}
      className="order-form"
      onSubmit={(e) => {
        e.preventDefault();
        send('whatsapp');
      }}
    >
      {/* name + autoComplete: senza, il riempimento automatico del telefono
          non propone nome e contatto — su mobile è metà della compilazione. */}
      <label htmlFor="ordine-nome">
        Nome
        <input
          id="ordine-nome"
          name="name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Il tuo nome"
          required
        />
      </label>
      <label htmlFor="ordine-contatto">
        Contatto (email o telefono)
        <input
          id="ordine-contatto"
          name="contact"
          autoComplete="email"
          inputMode="email"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="Dove risponderti"
          required
        />
      </label>
      <label htmlFor="ordine-note">
        Note (misure, personalizzazioni, colori…)
        <textarea
          id="ordine-note"
          name="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Facoltativo"
        />
      </label>

      <div className="order-form__actions">
        <button type="submit" className="btn btn--primary">
          Invia su WhatsApp
        </button>
        <button type="button" className="btn btn--ghost" onClick={sendEmail}>
          Invia via email
        </button>
      </div>

      <style>{`
        .order-form { display: flex; flex-direction: column; gap: 0.9rem; }
        .order-form label {
          display: flex; flex-direction: column; gap: 0.3rem;
          font-family: var(--font-body); font-size: 0.85rem; color: var(--bordeaux);
        }
        .order-form input, .order-form textarea {
          font-family: var(--font-body); font-size: 0.9rem;
          padding: 0.6rem 0.75rem; border-radius: var(--radius-md);
          border: 1px solid rgba(90, 30, 38, 0.25); background: #fffdf9; color: var(--bordeaux);
          resize: vertical;
        }
        .order-form__actions { display: flex; flex-direction: column; gap: 0.6rem; margin-top: 0.4rem; }
        .btn {
          font-family: var(--font-body); font-size: 0.9rem; font-weight: 500;
          padding: 0.7rem 1rem; border-radius: 999px; cursor: pointer; border: 1px solid transparent;
        }
        .btn--primary { background: var(--bordeaux); color: var(--paper-warm); }
        .btn--ghost { background: transparent; color: var(--bordeaux); border-color: rgba(90, 30, 38, 0.3); }
        .order-confirm { font-family: var(--font-body); color: var(--bordeaux); line-height: 1.6; }
        .order-confirm__note { font-size: 0.82rem; opacity: 0.75; margin-top: 0.5rem; }
      `}</style>
    </form>
  );
}
