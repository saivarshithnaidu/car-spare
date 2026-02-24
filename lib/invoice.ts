import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { supabase } from '@/lib/supabase';

export interface InvoiceData {
    invoiceNumber: string;
    orderId: string;
    date: Date;
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    items: {
        name: string;
        price: number;
        quantity: number;
        total: number;
    }[];
    subtotal: number;
    gstAmount: number;
    discount: number;
    totalAmount: number;
    paymentMethod: string;
    paymentStatus: string;
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 Size
    const { width, height } = page.getSize();

    // Fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Colors
    const primaryColor = rgb(0.1, 0.4, 0.8);
    const textColor = rgb(0.2, 0.2, 0.2);
    const lightGray = rgb(0.9, 0.9, 0.9);

    // Header
    page.drawText('Car Spare Parts Co.', {
        x: 50,
        y: height - 60,
        size: 24,
        font: boldFont,
        color: primaryColor,
    });

    page.drawText('INVOICE', {
        x: width - 150,
        y: height - 60,
        size: 24,
        font: boldFont,
        color: textColor,
    });

    // Invoice Details right aligned
    page.drawText(`Invoice #: ${data.invoiceNumber}`, { x: width - 150, y: height - 90, size: 10, font });
    page.drawText(`Date: ${data.date.toLocaleDateString()}`, { x: width - 150, y: height - 105, size: 10, font });
    page.drawText(`Order ID: ${data.orderId}`, { x: width - 150, y: height - 120, size: 10, font });

    // Bill To
    page.drawText('Bill To:', { x: 50, y: height - 120, size: 12, font: boldFont, color: textColor });
    page.drawText(data.customerName || 'Walk-in Customer', { x: 50, y: height - 140, size: 12, font });
    if (data.customerEmail) {
        page.drawText(data.customerEmail, { x: 50, y: height - 155, size: 10, font });
    }
    if (data.customerPhone) {
        page.drawText(`Ph: ${data.customerPhone}`, { x: 50, y: height - 170, size: 10, font });
    }

    // Table Header
    const tableTop = height - 220;
    page.drawRectangle({ x: 50, y: tableTop - 15, width: width - 100, height: 25, color: lightGray });

    page.drawText('Item Description', { x: 60, y: tableTop, size: 10, font: boldFont });
    page.drawText('Qty', { x: 300, y: tableTop, size: 10, font: boldFont });
    page.drawText('Price', { x: 380, y: tableTop, size: 10, font: boldFont });
    page.drawText('Total', { x: 480, y: tableTop, size: 10, font: boldFont });

    // Table Items
    let currentY = tableTop - 35;
    data.items.forEach((item) => {
        page.drawText(item.name.substring(0, 40), { x: 60, y: currentY, size: 10, font });
        page.drawText(item.quantity.toString(), { x: 300, y: currentY, size: 10, font });
        page.drawText(`Rs. ${item.price.toFixed(2)}`, { x: 380, y: currentY, size: 10, font });
        page.drawText(`Rs. ${item.total.toFixed(2)}`, { x: 480, y: currentY, size: 10, font });
        currentY -= 20;

        // Form page break if needed (simplified)
        if (currentY < 150) {
            // Further logic can be added here for multi-page invoices 
        }
    });

    // Summary lines
    currentY -= 20;
    const summaryX = 350;
    const valueX = 480;

    // Line separator
    page.drawLine({
        start: { x: summaryX, y: currentY + 10 },
        end: { x: width - 50, y: currentY + 10 },
        thickness: 1,
        color: lightGray
    });

    page.drawText('Subtotal:', { x: summaryX, y: currentY, size: 10, font: boldFont });
    page.drawText(`Rs. ${data.subtotal.toFixed(2)}`, { x: valueX, y: currentY, size: 10, font });
    currentY -= 20;

    if (data.discount > 0) {
        page.drawText('Discount:', { x: summaryX, y: currentY, size: 10, font: boldFont });
        page.drawText(`- Rs. ${data.discount.toFixed(2)}`, { x: valueX, y: currentY, size: 10, font });
        currentY -= 20;
    }

    page.drawText(`GST (added):`, { x: summaryX, y: currentY, size: 10, font: boldFont });
    page.drawText(`Rs. ${data.gstAmount.toFixed(2)}`, { x: valueX, y: currentY, size: 10, font });
    currentY -= 20;

    // Total Background
    page.drawRectangle({ x: summaryX - 10, y: currentY - 5, width: width - summaryX - 30, height: 25, color: lightGray });

    page.drawText('Total Amount:', { x: summaryX, y: currentY, size: 12, font: boldFont, color: primaryColor });
    page.drawText(`Rs. ${data.totalAmount.toFixed(2)}`, { x: valueX, y: currentY, size: 12, font: boldFont });
    currentY -= 40;

    // Payment Info
    page.drawText(`Payment Method: ${data.paymentMethod.toUpperCase()}`, { x: 50, y: currentY, size: 10, font });
    currentY -= 15;
    page.drawText(`Payment Status: ${data.paymentStatus.toUpperCase()}`, { x: 50, y: currentY, size: 10, font: boldFont });

    // Footer
    page.drawText('Thank you for your business!', {
        x: width / 2 - 70,
        y: 50,
        size: 10,
        font: boldFont,
        color: textColor
    });

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
}

export async function uploadInvoiceToSupabase(pdfBytes: Uint8Array, invoiceNumber: string): Promise<string> {
    const fileName = `INV-${invoiceNumber}-${Date.now()}.pdf`;

    // Create Blob from bytes. Use slice() to safely pass buffer to Blob
    const pdfBlob = new Blob([pdfBytes.slice()], { type: 'application/pdf' });

    const { data, error } = await supabase.storage
        .from('invoices')
        .upload(fileName, pdfBlob, {
            contentType: 'application/pdf',
            cacheControl: '3600',
            upsert: false
        });

    if (error) {
        console.error('Invoice Upload Error:', error);
        throw new Error('Failed to upload invoice PDF');
    }

    const { data: { publicUrl } } = supabase.storage
        .from('invoices')
        .getPublicUrl(fileName);

    return publicUrl;
}
