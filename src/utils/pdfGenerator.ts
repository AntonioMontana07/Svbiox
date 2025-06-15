
import jsPDF from 'jspdf';
import { Sale, User } from '@/lib/database';

export const generateSalesPDF = (sale: Sale, user: User | null) => {
  // Crear PDF con dimensiones de ticket térmico (80mm width, height auto)
  // 80mm = 226.77 points, usamos altura variable
  const doc = new jsPDF({
    unit: 'pt',
    format: [226.77, 400], // Ancho fijo 80mm, altura inicial
    orientation: 'portrait'
  });
  
  const pageWidth = 226.77; // 80mm en puntos
  const margin = 10;
  const centerX = pageWidth / 2;
  let yPos = 15;
  
  // Función helper para texto centrado
  const addCenteredText = (text: string, y: number, fontSize: number = 8, style: string = 'normal') => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', style);
    doc.text(text, centerX, y, { align: 'center' });
  };
  
  // Función helper para texto alineado a la izquierda
  const addLeftText = (text: string, y: number, fontSize: number = 8, style: string = 'normal') => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', style);
    doc.text(text, margin, y);
  };
  
  // Función helper para texto alineado a la derecha
  const addRightText = (text: string, y: number, fontSize: number = 8, style: string = 'normal') => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', style);
    doc.text(text, pageWidth - margin, y, { align: 'right' });
  };
  
  // Header de la empresa
  addCenteredText('BIOX', yPos, 14, 'bold');
  yPos += 15;
  addCenteredText('Salud y Bienestar', yPos, 10, 'normal');
  yPos += 15;
  
  // Información de la empresa
  addCenteredText('Biox Peru EIRL', yPos, 9, 'bold');
  yPos += 12;
  addCenteredText('RUC: 20603026811', yPos, 7);
  yPos += 10;
  addCenteredText('Av. San Martin 108 Miraflores-Arequipa', yPos, 7);
  yPos += 10;
  addCenteredText('Correo: tienda@biox.com.pe', yPos, 7);
  yPos += 10;
  addCenteredText('Teléfonos: 957888815 - 941035450', yPos, 7);
  yPos += 10;
  addCenteredText('Biox.com.pe', yPos, 7);
  yPos += 15;
  
  // Fecha y hora
  const saleDate = new Date(sale.date);
  const fechaHora = `Fecha y Hora: ${saleDate.toLocaleDateString()} a las ${saleDate.toLocaleTimeString()}`;
  addLeftText(fechaHora, yPos, 7);
  yPos += 12;
  
  // Vendedor
  const vendedor = `Vendedor: ${user?.fullName || user?.username || 'N/A'}`;
  addLeftText(vendedor, yPos, 7);
  yPos += 15;
  
  // Título del ticket
  addCenteredText('TICKET DE VENTA ELECTRONICA', yPos, 10, 'bold');
  yPos += 15;
  
  // Número de ticket
  addLeftText(`# Ticket: ${sale.id}`, yPos, 8);
  yPos += 12;
  
  // Cliente (usando datos del cajero por ahora)
  addLeftText(`Cliente: ${user?.fullName || 'Cliente General'}`, yPos, 7);
  yPos += 10;
  addLeftText(`DNI: ${user?.id || '12345678'}`, yPos, 7);
  yPos += 15;
  
  // Headers de productos
  addLeftText('Cant.', yPos, 8, 'bold');
  doc.text('Producto', 50, yPos);
  addRightText('Precio', yPos, 8, 'bold');
  yPos += 3;
  
  // Línea separadora
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 12;
  
  // Producto
  addLeftText(sale.quantity.toString(), yPos, 8);
  
  // Nombre del producto (truncar si es muy largo)
  const productName = sale.productName.length > 15 ? 
    sale.productName.substring(0, 15) + '...' : 
    sale.productName;
  doc.text(productName, 35, yPos);
  
  addRightText(`S/ ${sale.salePrice.toFixed(2)}`, yPos, 8);
  yPos += 15;
  
  // Línea separadora antes de totales
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 12;
  
  // Calcular subtotal e IGV
  const subtotal = sale.total / 1.18;
  const igv = sale.total - subtotal;
  
  // Totales
  addLeftText('Subtotal:', yPos, 8);
  addRightText(`S/ ${subtotal.toFixed(2)}`, yPos, 8);
  yPos += 12;
  
  addLeftText('IGV:', yPos, 8);
  addRightText(`S/ ${igv.toFixed(2)}`, yPos, 8);
  yPos += 12;
  
  addLeftText('Total:', yPos, 9, 'bold');
  addRightText(`S/ ${sale.total.toFixed(2)}`, yPos, 9, 'bold');
  yPos += 15;
  
  // Forma de pago
  const paymentMethodText = sale.paymentMethod === 'efectivo' ? 'EFECTIVO' : 
                           sale.paymentMethod === 'tarjeta' ? 'TARJETA' : 'YAPE';
  addLeftText(`FORMA DE PAGO:`, yPos, 8, 'bold');
  yPos += 12;
  addLeftText(paymentMethodText, yPos, 8);
  yPos += 15;
  
  // Información de pago
  if (sale.paymentMethod === 'efectivo' && sale.amountReceived) {
    addLeftText('RECIBIDO:', yPos, 8);
    addRightText(`S/ ${sale.amountReceived.toFixed(2)}`, yPos, 8);
    yPos += 12;
    
    addLeftText('DEVOLUCION:', yPos, 8);
    addRightText(`S/ ${(sale.change || 0).toFixed(2)}`, yPos, 8);
    yPos += 12;
  } else {
    addLeftText('RECIBIDO: -', yPos, 8);
    yPos += 10;
    addLeftText('DEVOLUCION: -', yPos, 8);
    yPos += 12;
  }
  
  yPos += 10;
  
  // Representación QR (texto placeholder)
  addCenteredText('Representación de Pagina web QR', yPos, 7);
  yPos += 20;
  
  // Espacio para QR code (rectángulo placeholder)
  const qrSize = 60;
  const qrX = (pageWidth - qrSize) / 2;
  doc.rect(qrX, yPos, qrSize, qrSize);
  yPos += qrSize + 15;
  
  // Footer
  addCenteredText('Puede consultar en: WWW.BIOX.COM.PE', yPos, 6);
  yPos += 10;
  addCenteredText('Autorizado mediante Resolución 034-005-0007241', yPos, 6);
  yPos += 15;
  
  addCenteredText('GRACIAS POR SU PREFERENCIA', yPos, 8, 'bold');
  yPos += 20;
  
  // Ajustar la altura del PDF al contenido
  const finalHeight = yPos + 10;
  if (finalHeight > 400) {
    // Si necesitamos más espacio, recrear el PDF con la altura correcta
    const newDoc = new jsPDF({
      unit: 'pt',
      format: [226.77, finalHeight],
      orientation: 'portrait'
    });
    
    // Copiar el contenido al nuevo documento
    // (Para simplificar, guardamos con la altura inicial y el contenido se ajusta)
  }
  
  // Guardar el PDF
  const fileName = `ticket_${sale.id}_${saleDate.toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
