import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Order, OrderItem } from './types';

export async function generateInvoicePDF(
    order: Order,
    orderItems: OrderItem[],
    customerEmail: string
): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const { width, height } = page.getSize();
    let yPosition = height - 50;

    // Header
    page.drawText('CAR SPARE PARTS', {
        x: 50,
        y: yPosition,
        size: 24,
        font: boldFont,
        color: rgb(0.2, 0.4, 0.8),
    });

    yPosition -= 20;
    page.drawText('Invoice', {
        x: 50,
        y: yPosition,
        size: 16,
        font: boldFont,
    });

    yPosition -= 30;

    // Invoice details
    page.drawText(`Invoice No: ${order.id.substring(0, 8).toUpperCase()}`, {
        x: 50,
        y: yPosition,
        size: 10,
        font,
    });

    page.drawText(`Date: ${new Date(order.created_at).toLocaleDateString('en-IN')}`, {
        x: 400,
        y: yPosition,
        size: 10,
        font,
    });

    yPosition -= 15;
    page.drawText(`Customer: ${customerEmail}`, {
        x: 50,
        y: yPosition,
        size: 10,
        font,
    });

    yPosition -= 30;

    // Table header
    page.drawRectangle({
        x: 50,
        y: yPosition - 15,
        width: width - 100,
        height: 20,
        color: rgb(0.9, 0.9, 0.9),
    });

    page.drawText('Item', { x: 60, y: yPosition, size: 10, font: boldFont });
    page.drawText('Qty', { x: 300, y: yPosition, size: 10, font: boldFont });
    page.drawText('Price', { x: 360, y: yPosition, size: 10, font: boldFont });
    page.drawText('Total', { x: 450, y: yPosition, size: 10, font: boldFont });

    yPosition -= 25;

    // Table items
    let subtotal = 0;
    orderItems.forEach((item) => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;

        page.drawText(item.spare_part?.name || 'Product', {
            x: 60,
            y: yPosition,
            size: 9,
            font,
            maxWidth: 230,
        });

        page.drawText(item.quantity.toString(), {
            x: 310,
            y: yPosition,
            size: 9,
            font,
        });

        page.drawText(`₹${item.price.toFixed(2)}`, {
            x: 360,
            y: yPosition,
            size: 9,
            font,
        });

        page.drawText(`₹${itemTotal.toFixed(2)}`, {
            x: 450,
            y: yPosition,
            size: 9,
            font,
        });

        yPosition -= 20;
    });

    yPosition -= 10;

    // Totals
    const gst = subtotal * 0.18;
    const total = subtotal + gst;

    page.drawText('Subtotal:', { x: 360, y: yPosition, size: 10, font });
    page.drawText(`₹${subtotal.toFixed(2)}`, {
        x: 450,
        y: yPosition,
        size: 10,
        font,
    });

    yPosition -= 20;
    page.drawText('GST (18%):', { x: 360, y: yPosition, size: 10, font });
    page.drawText(`₹${gst.toFixed(2)}`, {
        x: 450,
        y: yPosition,
        size: 10,
        font,
    });

    yPosition -= 25;
    page.drawRectangle({
        x: 350,
        y: yPosition - 5,
        width: 195,
        height: 25,
        color: rgb(0.9, 0.9, 0.9),
    });

    page.drawText('Total Amount:', {
        x: 360,
        y: yPosition,
        size: 12,
        font: boldFont,
    });
    page.drawText(`₹${total.toFixed(2)}`, {
        x: 450,
        y: yPosition,
        size: 12,
        font: boldFont,
    });

    yPosition -= 40;

    // Payment status
    const statusColor = order.payment_status === 'paid' ? rgb(0, 0.6, 0) : rgb(0.8, 0.4, 0);
    page.drawText(`Payment Status: ${order.payment_status.toUpperCase()}`, {
        x: 50,
        y: yPosition,
        size: 11,
        font: boldFont,
        color: statusColor,
    });

    // Footer
    page.drawText('Thank you for your business!', {
        x: 50,
        y: 50,
        size: 10,
        font,
        color: rgb(0.5, 0.5, 0.5),
    });

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
}
