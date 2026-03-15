/**
 * Email notification base setup
 * Using Resend (https://resend.com)
 */

export const sendTicketEmail = async (clientEmail: string, clientName: string, raffleTitle: string, tickets: string[], link: string) => {
    // Note: To implement this, the user needs to provide a RESEND_API_KEY
    // For now, we provide the architecture and a console notification.

    console.log(`[Email Mock] Sending tickets to ${clientEmail}...`);
    console.log(`Hi ${clientName}, here are your tickets for ${raffleTitle}: ${tickets.join(', ')}`);
    console.log(`View them here: ${link}`);

    // If an API key were available, we would do:
    /*
    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_RESEND_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: 'Rifas El Fenix <notificaciones@tu-dominio.com>',
            to: [clientEmail],
            subject: `Tus tickets para ${raffleTitle} ✅`,
            html: `<p>Hola ${clientName},</p><p>Tus tickets para <strong>${raffleTitle}</strong> son: #<strong>${tickets.join(', #')}</strong></p><p>Puedes verlos aquí: <a href="${link}">${link}</a></p>`,
        }),
    });
    */

    return true;
};
