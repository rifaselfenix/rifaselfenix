import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function generateTicketPDF(ticketData: {
    ticketNumber: number,
    raffleTitle: string,
    price: number,
    date: string
}) {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([400, 200]);
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Fondo blanco suave (Pastel Theme)
    page.drawRectangle({
        x: 0, y: 0, width, height,
        color: rgb(0.99, 0.98, 0.97), // #fdfbf7
    });

    // Borde rosa pastel
    page.drawRectangle({
        x: 10, y: 10, width: width - 20, height: height - 20,
        borderColor: rgb(0.99, 0.64, 0.69), // #fda4af
        borderWidth: 4,
    });

    // Cabecera: RIFAS FÉNIX (Limpiando acentos simple)
    page.drawText('RIFAS FENIX', {
        x: 30, y: height - 50,
        size: 20,
        font,
        color: rgb(0.53, 0.07, 0.22), // #881337 (Rose Dark)
    });

    // Número del Ticket
    page.drawText(`Ticket #${ticketData.ticketNumber}`, {
        x: 30, y: height - 90,
        size: 35,
        font,
        color: rgb(0.2, 0.25, 0.33), // #334155 (Slate 700)
    });

    // Título de la Rifa
    // Intentamos limpiar caracteres comunes manualmente para que no desaparezcan
    const cleanTitle = ticketData.raffleTitle
        .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u')
        .replace(/Á/g, 'A').replace(/É/g, 'E').replace(/Í/g, 'I').replace(/Ó/g, 'O').replace(/Ú/g, 'U')
        .replace(/ñ/g, 'n').replace(/Ñ/g, 'N')
        .replace(/[^\x00-\x7F]/g, ""); // Limpieza final de seguridad

    page.drawText(cleanTitle, {
        x: 30, y: height - 120,
        size: 14,
        font: regularFont,
        color: rgb(0.4, 0.45, 0.55), // Slate 500
    });

    // Footer: Precio y Fecha
    page.drawText(`Precio: $${ticketData.price} - Fecha: ${ticketData.date}`, {
        x: 30, y: 40,
        size: 10,
        font: regularFont,
        color: rgb(0.6, 0.6, 0.6),
    });

    // Círculo decorativo (Marca de agua)
    page.drawCircle({
        x: width - 60, y: height / 2,
        size: 45,
        color: rgb(0.99, 0.64, 0.69), // Pink
        opacity: 0.1,
    });

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
}

export function downloadPDF(pdfBytes: Uint8Array, filename: string) {
    const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}
