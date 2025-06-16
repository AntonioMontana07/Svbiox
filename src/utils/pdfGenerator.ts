
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { Sale, User, Customer } from '@/lib/database';

export const generateSalesPDF = async (sales: Sale[], user: User | null, customer?: Customer | null) => {
  // Crear PDF con dimensiones exactas: 80mm x 210mm
  // 80mm = 226.77 points, 210mm = 595.28 points
  const doc = new jsPDF({
    unit: 'pt',
    format: [226.77, 595.28], // 80mm x 210mm
    orientation: 'portrait'
  });
  
  const pageWidth = 226.77; // 80mm en puntos
  const pageHeight = 595.28; // 210mm en puntos
  const margin = 8;
  const centerX = pageWidth / 2;
  
  // Calcular tamaños dinámicos basados en la cantidad de productos
  const productCount = sales.length;
  const availableSpace = pageHeight - 200; // Espacio reservado para header, footer, totales
  const spacePerProduct = Math.min(25, Math.max(12, availableSpace / productCount));
  
  // Tamaños de fuente dinámicos
  const titleSize = productCount > 10 ? 14 : 16;
  const headerSize = productCount > 15 ? 8 : 10;
  const normalSize = productCount > 20 ? 6 : productCount > 10 ? 7 : 8;
  const smallSize = productCount > 20 ? 5 : 6;
  
  // Espaciado dinámico
  const headerSpacing = productCount > 15 ? 8 : 10;
  const normalSpacing = productCount > 15 ? 8 : 10;
  const smallSpacing = productCount > 20 ? 6 : 8;
  
  let yPos = 15;
  
  // Función helper para texto centrado
  const addCenteredText = (text: string, y: number, fontSize: number = normalSize, style: string = 'normal') => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', style);
    doc.text(text, centerX, y, { align: 'center' });
  };
  
  // Función helper para texto alineado a la izquierda
  const addLeftText = (text: string, y: number, fontSize: number = normalSize, style: string = 'normal') => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', style);
    doc.text(text, margin, y);
  };
  
  // Función helper para texto alineado a la derecha
  const addRightText = (text: string, y: number, fontSize: number = normalSize, style: string = 'normal') => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', style);
    doc.text(text, pageWidth - margin, y, { align: 'right' });
  };
  
  // Función helper para líneas separadoras
  const addSeparatorLine = (y: number, style: 'solid' | 'dashed' = 'solid') => {
    if (style === 'dashed') {
      doc.setLineDashPattern([1, 1], 0);
    } else {
      doc.setLineDashPattern([], 0);
    }
    doc.line(margin, y, pageWidth - margin, y);
    doc.setLineDashPattern([], 0); // Reset to solid
  };
  
  // Header de la empresa (compacto para muchos productos)
  addCenteredText('BIOX', yPos, titleSize, 'bold');
  yPos += titleSize - 2;
  addCenteredText('Salud y Bienestar', yPos, headerSize, 'normal');
  yPos += headerSpacing;
  addCenteredText('Biox Peru EIRL', yPos, headerSize, 'bold');
  yPos += headerSpacing;
  
  // Línea separadora después del header
  addSeparatorLine(yPos);
  yPos += smallSpacing;
  
  // Información de la empresa con espaciado compacto
  addCenteredText('RUC: 20603026811', yPos, smallSize);
  yPos += smallSpacing;
  addCenteredText('Av. San Martin 108 Miraflores-Arequipa', yPos, smallSize);
  yPos += smallSpacing;
  addCenteredText('tienda@biox.com.pe | 957888815 - 941035450', yPos, smallSize);
  yPos += smallSpacing;
  addCenteredText('Biox.com.pe', yPos, smallSize);
  yPos += normalSpacing;
  
  // Línea separadora
  addSeparatorLine(yPos);
  yPos += smallSpacing;
  
  // Fecha y hora con formato compacto
  const saleDate = new Date(sales[0].date);
  const fechaHora = `${saleDate.toLocaleDateString()} ${saleDate.toLocaleTimeString().substring(0, 5)}`;
  addLeftText(`Fecha: ${fechaHora}`, yPos, smallSize);
  yPos += smallSpacing;
  
  // Vendedor (cajero)
  const vendedor = `Vendedor: ${(user?.fullName || user?.username || 'N/A').substring(0, 20)}`;
  addLeftText(vendedor, yPos, smallSize);
  yPos += normalSpacing;
  
  // Título del ticket
  addSeparatorLine(yPos);
  yPos += smallSpacing;
  addCenteredText('TICKET DE VENTA', yPos, headerSize, 'bold');
  yPos += smallSpacing;
  addSeparatorLine(yPos);
  yPos += smallSpacing;
  
  // Número de ticket
  addLeftText(`# Ticket: ${sales[0].id}`, yPos, normalSize, 'bold');
  yPos += normalSpacing;
  
  // Información del cliente
  if (customer) {
    addLeftText(`Cliente: ${customer.firstName} ${customer.lastName}`, yPos, smallSize);
    yPos += smallSpacing;
    if (customer.dni) {
      addLeftText(`DNI: ${customer.dni}`, yPos, smallSize);
      yPos += smallSpacing;
    }
    if (customer.phone) {
      addLeftText(`Telefono: ${customer.phone}`, yPos, smallSize);
      yPos += smallSpacing;
    }
  } else {
    addLeftText('Cliente: Cliente General', yPos, smallSize);
    yPos += smallSpacing;
  }
  yPos += smallSpacing;
  
  // Headers de productos con formato compacto
  addSeparatorLine(yPos, 'dashed');
  yPos += smallSpacing + 2;
  
  // Headers dinámicos según el espacio
  if (productCount <= 10) {
    addLeftText('Cant.', yPos, normalSize, 'bold');
    doc.text('Producto', 35, yPos, { align: 'left' });
    doc.text('P.Unit', pageWidth - 50, yPos, { align: 'left' });
    addRightText('Total', yPos, normalSize, 'bold');
  } else {
    addLeftText('C', yPos, normalSize, 'bold');
    doc.text('Producto', 20, yPos, { align: 'left' });
    addRightText('Total', yPos, normalSize, 'bold');
  }
  
  yPos += smallSpacing + 2;
  addSeparatorLine(yPos, 'dashed');
  yPos += smallSpacing + 2;
  
  // Productos con espaciado dinámico
  let totalSale = 0;
  
  sales.forEach((sale) => {
    const productSpacing = spacePerProduct;
    
    // Cantidad
    addLeftText(sale.quantity.toString(), yPos, normalSize);
    
    // Nombre del producto (truncar según espacio disponible)
    const maxLength = productCount > 15 ? 12 : productCount > 10 ? 15 : 18;
    const productName = sale.productName.length > maxLength ? 
      sale.productName.substring(0, maxLength) + '.' : 
      sale.productName;
    
    if (productCount <= 10) {
      doc.text(productName, 35, yPos);
      doc.text(`${sale.salePrice.toFixed(2)}`, pageWidth - 50, yPos);
    } else {
      doc.text(productName, 20, yPos);
    }
    
    // Total del producto
    addRightText(`${sale.total.toFixed(2)}`, yPos, normalSize);
    
    totalSale += sale.total;
    yPos += productSpacing;
  });
  
  yPos += smallSpacing;
  
  // Línea separadora antes de totales
  addSeparatorLine(yPos);
  yPos += smallSpacing;
  
  // Calcular subtotal e IGV
  const subtotal = totalSale / 1.18;
  const igv = totalSale - subtotal;
  
  // Totales con espaciado compacto
  addLeftText('Subtotal:', yPos, normalSize);
  addRightText(`S/ ${subtotal.toFixed(2)}`, yPos, normalSize);
  yPos += smallSpacing;
  
  addLeftText('IGV:', yPos, normalSize);
  addRightText(`S/ ${igv.toFixed(2)}`, yPos, normalSize);
  yPos += smallSpacing;
  
  // Total destacado
  addSeparatorLine(yPos);
  yPos += smallSpacing;
  addLeftText('TOTAL:', yPos, headerSize, 'bold');
  addRightText(`S/ ${totalSale.toFixed(2)}`, yPos, headerSize, 'bold');
  yPos += smallSpacing;
  addSeparatorLine(yPos);
  yPos += normalSpacing;
  
  // Forma de pago
  const paymentMethodText = sales[0].paymentMethod === 'efectivo' ? 'EFECTIVO' : 
                           sales[0].paymentMethod === 'tarjeta' ? 'TARJETA' : 'YAPE';
  addLeftText(`PAGO: ${paymentMethodText}`, yPos, normalSize, 'bold');
  yPos += normalSpacing;
  
  // Información de pago
  if (sales[0].paymentMethod === 'efectivo' && sales[0].amountReceived) {
    addLeftText('RECIBIDO:', yPos, normalSize);
    addRightText(`S/ ${sales[0].amountReceived.toFixed(2)}`, yPos, normalSize);
    yPos += smallSpacing;
    
    addLeftText('CAMBIO:', yPos, normalSize);
    addRightText(`S/ ${(sales[0].change || 0).toFixed(2)}`, yPos, normalSize);
    yPos += normalSpacing;
  }
  
  // Ajustar posición del QR según el espacio restante
  const remainingSpace = pageHeight - yPos - 100; // Espacio para footer
  const qrSize = Math.min(50, Math.max(30, remainingSpace / 3));
  
  // Generar código QR
  try {
    const qrDataURL = await QRCode.toDataURL('https://www.biox.com.pe', {
      width: 120,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    // Línea separadora antes del QR
    addSeparatorLine(yPos, 'dashed');
    yPos += smallSpacing;
    
    // Texto antes del QR
    addCenteredText('Consultar en:', yPos, smallSize);
    yPos += smallSpacing;
    
    // Insertar QR code
    const qrX = (pageWidth - qrSize) / 2;
    doc.addImage(qrDataURL, 'PNG', qrX, yPos, qrSize, qrSize);
    yPos += qrSize + smallSpacing;
    
    // URL debajo del QR
    addCenteredText('WWW.BIOX.COM.PE', yPos, normalSize, 'bold');
    yPos += normalSpacing;
    
  } catch (error) {
    console.error('Error generando QR:', error);
    addCenteredText('WWW.BIOX.COM.PE', yPos, normalSize, 'bold');
    yPos += normalSpacing;
  }
  
  // Footer adaptable al espacio restante
  const footerSpace = pageHeight - yPos;
  if (footerSpace > 30) {
    addSeparatorLine(yPos, 'dashed');
    yPos += smallSpacing;
    addCenteredText('Autorizado mediante Resolución 034-005-0007241', yPos, smallSize);
    yPos += smallSpacing;
    
    addSeparatorLine(yPos);
    yPos += smallSpacing;
    addCenteredText('GRACIAS POR SU PREFERENCIA', yPos, normalSize, 'bold');
  } else {
    addCenteredText('GRACIAS POR SU PREFERENCIA', yPos, smallSize, 'bold');
  }
  
  // Guardar el PDF
  const fileName = `ticket_${sales[0].id}_${saleDate.toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
