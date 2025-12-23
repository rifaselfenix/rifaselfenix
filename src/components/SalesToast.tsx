import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Ticket, X } from 'lucide-react';

export default function SalesToast() {
    const [notification, setNotification] = useState<{ name: string, count: number } | null>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Queue to aggregate tickets by same user within a short window
        let eventQueue: any[] = [];
        let processingTimeout: any = null;

        const processQueue = () => {
            if (eventQueue.length === 0) return;

            // Logic: Grab the last one or aggregate
            // For simplicity, just pick the last one's name and say "Bought tickets"
            // Or better: Group by client_phone or name?

            // Let's just take the most recent one for now to keep it simple and not spam
            const latest = eventQueue.pop();
            eventQueue = []; // Clear rest to avoid spam

            if (latest.new && latest.new.client_name) {
                const name = latest.new.client_name.split(' ')[0]; // First name
                showToast(name, 1); // We don't know exact count easily without complex logic, let's just say "bought tickets"
            }
        };

        const channel = supabase
            .channel('public:tickets')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tickets' }, (payload) => {
                eventQueue.push(payload);
                if (processingTimeout) clearTimeout(processingTimeout);
                processingTimeout = setTimeout(processQueue, 2000); // 2 seconds buffer
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const showToast = (name: string, count: number) => {
        setNotification({ name, count });
        setVisible(true);
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); // Simple ping
        audio.volume = 0.5;
        audio.play().catch(() => { }); // Ignore autoplay errors

        setTimeout(() => setVisible(false), 5000);
    };

    if (!visible || !notification) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            background: 'white',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            borderLeft: '5px solid #10b981',
            borderRadius: '0.5rem',
            padding: '1rem',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            maxWidth: '300px',
            animation: 'slideIn 0.5s ease-out'
        }}>
            <div style={{ background: '#dcfce7', padding: '0.5rem', borderRadius: '50%' }}>
                <Ticket size={24} color="#15803d" />
            </div>
            <div>
                <p style={{ margin: '0 0 0.2rem 0', fontWeight: 'bold', color: '#1e293b', fontSize: '0.9rem' }}>¡Nueva Compra!</p>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 'bold', color: '#059669' }}>{notification.name}</span> acaba de comprar tickets. 🍀
                </p>
            </div>
            <button onClick={() => setVisible(false)} style={{ border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}>
                <X size={16} />
            </button>
            <style>{`
                @keyframes slideIn {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
