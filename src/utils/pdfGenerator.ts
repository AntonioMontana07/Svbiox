
import jsPDF from 'jspdf';
import { Sale, User } from '@/lib/database';

export const generateSalesPDF = (sale: Sale, user: User | null) => {
  const doc = new jsPDF();
  
  // Company header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Biox Perú EIRL', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('RUC: 20603026811', 105, 30, { align: 'center' });
  doc.text('Av. San Martin 108 Miraflores-Arequipa', 105, 35, { align: 'center' });
  doc.text('Correo: tienda@biox.com.pe', 105, 40, { align: 'center' });
  doc.text('Teléfonos: 957888815 - 941035450', 105, 45, { align: 'center' });
  doc.text('Biox.com.pe', 105, 50, { align: 'center' });
  
  // Date and cashier info
  const saleDate = new Date(sale.date);
  doc.text(`Fecha y Hora: ${saleDate.toLocaleDateString()} a las ${saleDate.toLocaleTimeString()}`, 20, 65);
  doc.text(`Cajero: ${user?.fullName || user?.username || 'N/A'}`, 20, 70);
  
  // Ticket header
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('TICKET DE VENTA ELECTRONICA', 105, 85, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`# Ticket: ${sale.id}`, 20, 95);
  
  // Product details header
  doc.text('Cant.', 20, 110);
  doc.text('Producto', 50, 110);
  doc.text('Precio', 150, 110);
  
  // Draw line under header
  doc.line(20, 112, 190, 112);
  
  // Product details
  doc.text(sale.quantity.toString(), 20, 125);
  doc.text(sale.productName, 50, 125);
  doc.text(`S/ ${sale.salePrice.toFixed(2)}`, 150, 125);
  
  // Draw line before totals
  doc.line(20, 135, 190, 135);
  
  // Totals
  doc.text(`Subtotal: S/ ${sale.subtotal.toFixed(2)}`, 130, 145);
  doc.text(`IGV: S/ ${sale.igv.toFixed(2)}`, 130, 150);
  
  doc.setFont('helvetica', 'bold');
  doc.text(`Total: S/ ${sale.total.toFixed(2)}`, 130, 155);
  
  // Payment info
  doc.setFont('helvetica', 'normal');
  const paymentMethodText = sale.paymentMethod === 'efectivo' ? 'EFECTIVO' : 
                           sale.paymentMethod === 'tarjeta' ? 'TARJETA' : 'YAPE';
  doc.text(`FORMA DE PAGO: ${paymentMethodText}`, 20, 170);
  
  if (sale.paymentMethod === 'efectivo' && sale.amountReceived) {
    doc.text(`RECIBIDO: S/ ${sale.amountReceived.toFixed(2)}`, 20, 175);
    doc.text(`DEVOLUCION: S/ ${(sale.change || 0).toFixed(2)}`, 20, 180);
  } else {
    doc.text('RECIBIDO: -', 20, 175);
    doc.text('DEVOLUCION: -', 20, 180);
  }
  
  // QR Code placeholder
  doc.text('Representación de Pagina web QR', 20, 200);
  
  // Footer
  doc.setFontSize(8);
  doc.text('Puede consultar en: WWW.BIOX.COM.PE', 105, 220, { align: 'center' });
  doc.text('Autorizado mediante Resolución 034-005-0007241', 105, 225, { align: 'center' });
  
  doc.setFont('helvetica', 'bold');
  doc.text('GRACIAS POR SU PREFERENCIA', 105, 235, { align: 'center' });
  
  // Save the PDF
  doc.save(`boleta_venta_${sale.id}_${saleDate.toISOString().split('T')[0]}.pdf`);
};
