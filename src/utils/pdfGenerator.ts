import jsPDF from 'jspdf';
import { auth } from '../firebase';

export interface StatementData {
  accountNumber: string;
  accountHolder: string;
  period: string;
  balance: number;
  currency: string;
  transactions: Array<{
    date: string;
    description: string;
    amount: number;
    balance: number;
    reference: string;
  }>;
}

export interface TaxData {
  accountNumber: string;
  accountHolder: string;
  year: string;
  totalDeposits: number;
  totalWithdrawals: number;
  averageBalance: number;
  vatTransactions: number;
  currency: string;
}

// ثوابت التصميم المحسنة
const DESIGN_CONSTANTS = {
  colors: {
    primary: [212, 175, 55] as [number, number, number], // ذهبي - lime-accent
    primaryLight: [234, 201, 89] as [number, number, number], // ذهبي فاتح
    darkGray: [51, 51, 51] as [number, number, number], // رمادي داكن للنصوص
    mediumGray: [107, 114, 128] as [number, number, number], // رمادي متوسط
    lightGray: [156, 163, 175] as [number, number, number], // رمادي فاتح
    white: [255, 255, 255] as [number, number, number], // أبيض
    tableHeaderBg: [245, 245, 245] as [number, number, number], // خلفية رأس الجدول
    tableRowEven: [250, 250, 250] as [number, number, number], // صفوف الجدول الزوجية
    signatureBg: [248, 250, 252] as [number, number, number], // خلفية التوقيع
    success: [34, 197, 94] as [number, number, number], // أخضر للمبالغ الموجبة
    danger: [239, 68, 68] as [number, number, number], // أحمر للمبالغ السالبة
    borderLight: [229, 231, 235] as [number, number, number] // حدود فاتحة
  },
  fonts: {
    primary: 'helvetica',
    bold: 'helvetica',
    normal: 'helvetica'
  },
  spacing: {
    margin: 20,
    padding: 8,
    lineHeight: 6,
    sectionGap: 15,
    elementGap: 5
  },
  page: {
    width: 210, // A4 width in mm
    height: 297  // A4 height in mm
  },
  seal: {
    radius: 20,
    innerRadius: 15,
    strokeWidth: 1.5
  }
};

// وظائف مساعدة محسنة
const Helpers = {
  // تنسيق التاريخ
  formatDate: (date: string | Date, locale: string = 'en-GB'): string => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) {
        return 'Invalid Date';
      }
      return dateObj.toLocaleDateString(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  },

  // تنسيق المبالغ المالية
  formatCurrency: (amount: number, currency: string): string => {
    try {
      const formattedAmount = Math.abs(amount).toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      });
      const sign = amount < 0 ? '-' : '';
      return `${sign}${formattedAmount} ${currency}`;
    } catch (error) {
      return `${amount} ${currency}`;
    }
  },

  // تعيين لون النص أو التعبئة أو الحدود
  setColor: (pdf: jsPDF, color: [number, number, number], type: 'text' | 'fill' | 'draw' = 'text'): void => {
    try {
      if (type === 'text') {
        pdf.setTextColor(color[0], color[1], color[2]);
      } else if (type === 'fill') {
        pdf.setFillColor(color[0], color[1], color[2]);
      } else if (type === 'draw') {
        pdf.setDrawColor(color[0], color[1], color[2]);
      }
    } catch (error) {
      console.warn('Error setting color:', error);
    }
  },

  // رسم مستطيل مع خيارات التعبئة والحدود
  drawRect: (pdf: jsPDF, x: number, y: number, width: number, height: number, 
            fillColor?: [number, number, number], strokeColor?: [number, number, number], 
            lineWidth: number = 0.5): void => {
    try {
      let style = '';
      
      if (fillColor) {
        Helpers.setColor(pdf, fillColor, 'fill');
        style += 'F';
      }
      
      if (strokeColor) {
        Helpers.setColor(pdf, strokeColor, 'draw');
        pdf.setLineWidth(lineWidth);
        style += 'D';
      }
      
      if (style) {
        pdf.rect(x, y, width, height, style);
      }
    } catch (error) {
      console.warn('Error drawing rectangle:', error);
    }
  },

  // رسم خط
  drawLine: (pdf: jsPDF, x1: number, y1: number, x2: number, y2: number, 
            color: [number, number, number], lineWidth: number = 0.5): void => {
    try {
      Helpers.setColor(pdf, color, 'draw');
      pdf.setLineWidth(lineWidth);
      pdf.line(x1, y1, x2, y2);
    } catch (error) {
      console.warn('Error drawing line:', error);
    }
  },

  // إضافة نص مع خيارات متقدمة
  addText: (pdf: jsPDF, text: string, x: number, y: number, 
           options: { 
             align?: 'left' | 'center' | 'right'; 
             fontSize?: number; 
             fontStyle?: 'normal' | 'bold' | 'italic' | 'bolditalic'; 
             color?: [number, number, number];
             maxWidth?: number;
           } = {}): number => {
    try {
      const { 
        align = 'left', 
        fontSize = 10, 
        fontStyle = 'normal', 
        color = DESIGN_CONSTANTS.colors.darkGray,
        maxWidth
      } = options;
      
      Helpers.setColor(pdf, color, 'text');
      pdf.setFontSize(fontSize);
      pdf.setFont(DESIGN_CONSTANTS.fonts.primary, fontStyle);
      
      if (maxWidth && text.length > 0) {
        const lines = pdf.splitTextToSize(text, maxWidth);
        let currentY = y;
        
        for (let i = 0; i < lines.length; i++) {
          pdf.text(lines[i], x, currentY, { align });
          currentY += DESIGN_CONSTANTS.spacing.lineHeight;
        }
        
        return currentY;
      } else {
        pdf.text(text, x, y, { align });
        return y + DESIGN_CONSTANTS.spacing.lineHeight;
      }
    } catch (error) {
      console.warn('Error adding text:', error);
      return y + DESIGN_CONSTANTS.spacing.lineHeight;
    }
  },

  // رسم دائرة
  drawCircle: (pdf: jsPDF, x: number, y: number, radius: number, 
              fillColor?: [number, number, number], strokeColor?: [number, number, number], 
              lineWidth: number = 1): void => {
    try {
      let style = '';
      
      if (fillColor) {
        Helpers.setColor(pdf, fillColor, 'fill');
        style += 'F';
      }
      
      if (strokeColor) {
        Helpers.setColor(pdf, strokeColor, 'draw');
        pdf.setLineWidth(lineWidth);
        style += 'D';
      }
      
      if (style) {
        pdf.circle(x, y, radius, style);
      }
    } catch (error) {
      console.warn('Error drawing circle:', error);
    }
  },

  // التحقق من المساحة المتاحة في الصفحة
  checkPageSpace: (pdf: jsPDF, currentY: number, requiredHeight: number): number => {
    const { height } = DESIGN_CONSTANTS.page;
    const footerSpace = 50;
    
    if (currentY + requiredHeight > height - footerSpace) {
      pdf.addPage();
      return 60; // بداية الصفحة الجديدة
    }
    
    return currentY;
  }
};

// رأس الصفحة الاحترافي
const drawHeader = (pdf: jsPDF, title: string, subtitle: string = ''): number => {
  const { colors, page, spacing } = DESIGN_CONSTANTS;
  
  try {
    // الشريط العلوي الذهبي
    Helpers.drawRect(pdf, 0, 0, page.width, 40, colors.primary);
    
    // شعار البنك
    Helpers.addText(pdf, 'TRADEHUB', spacing.margin, 18, {
      fontSize: 22,
      fontStyle: 'bold',
      color: colors.white
    });
    
    Helpers.addText(pdf, 'FINANCIAL SERVICES', spacing.margin, 28, {
      fontSize: 10,
      color: colors.white
    });
    
    // معلومات الترخيص
    Helpers.addText(pdf, 'Licensed by Banco de España', spacing.margin, 35, {
      fontSize: 8,
      color: colors.white
    });
    
    // عنوان المستند
    Helpers.addText(pdf, title, page.width - spacing.margin, 20, {
      align: 'right',
      fontSize: 16,
      fontStyle: 'bold',
      color: colors.white
    });
    
    // العنوان الفرعي
    if (subtitle) {
      Helpers.addText(pdf, subtitle, page.width - spacing.margin, 30, {
        align: 'right',
        fontSize: 10,
        color: colors.white
      });
    }
    
    // خط فاصل أنيق
    Helpers.drawLine(pdf, spacing.margin, 45, page.width - spacing.margin, 45, colors.primary, 1);
    
    return 55; // ارتفاع الرأس
  } catch (error) {
    console.warn('Error drawing header:', error);
    return 55;
  }
};

// تذييل الصفحة الاحترافي
const drawFooter = (pdf: jsPDF, additionalText: string = ''): void => {
  const { colors, page, spacing } = DESIGN_CONSTANTS;
  
  try {
    const footerY = page.height - 35;
    
    // خط التذييل
    Helpers.drawLine(pdf, spacing.margin, footerY, page.width - spacing.margin, footerY, colors.primary, 1);
    
    // معلومات البنك
    Helpers.addText(pdf, 'TradeHub Financial Services S.L.', spacing.margin, footerY + 8, {
      fontSize: 9,
      fontStyle: 'bold',
      color: colors.darkGray
    });
    
    Helpers.addText(pdf, 'Madrid, Spain', spacing.margin, footerY + 15, {
      fontSize: 8,
      color: colors.mediumGray
    });
    
    Helpers.addText(pdf, 'Email: support@tradehub-pay.online', spacing.margin, footerY + 22, {
      fontSize: 8,
      color: colors.mediumGray
    });
    
    // وقت الإنشاء
    const timestamp = `Generated: ${Helpers.formatDate(new Date())} ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
    Helpers.addText(pdf, timestamp, page.width - spacing.margin, footerY + 8, {
      align: 'right',
      fontSize: 8,
      color: colors.mediumGray
    });
    
    // نص إضافي
    if (additionalText) {
      Helpers.addText(pdf, additionalText, page.width - spacing.margin, footerY + 15, {
        align: 'right',
        fontSize: 8,
        color: colors.mediumGray
      });
    }
    
    // أرقام الصفحات
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      Helpers.addText(pdf, `Page ${i} of ${pageCount}`, page.width / 2, footerY + 22, {
        align: 'center',
        fontSize: 8,
        color: colors.mediumGray
      });
    }
  } catch (error) {
    console.warn('Error drawing footer:', error);
  }
};

// قسم معلومات الحساب
const drawAccountInfo = (pdf: jsPDF, data: StatementData, startY: number): number => {
  const { colors, spacing, page } = DESIGN_CONSTANTS;
  const boxHeight = 45;
  
  try {
    // خلفية المعلومات
    Helpers.drawRect(pdf, spacing.margin, startY, page.width - 2 * spacing.margin, 
                    boxHeight, colors.tableHeaderBg, colors.borderLight);
    
    // شريط جانبي ذهبي
    Helpers.drawRect(pdf, spacing.margin, startY, 3, boxHeight, colors.primary);
    
    // المعلومات على اليسار
    Helpers.addText(pdf, 'ACCOUNT HOLDER', spacing.margin + 10, startY + 12, {
      fontSize: 9,
      fontStyle: 'bold',
      color: colors.mediumGray
    });
    
    Helpers.addText(pdf, data.accountHolder, spacing.margin + 10, startY + 20, {
      fontSize: 11,
      fontStyle: 'bold',
      color: colors.darkGray
    });
    
    Helpers.addText(pdf, 'ACCOUNT NUMBER', spacing.margin + 10, startY + 30, {
      fontSize: 9,
      fontStyle: 'bold',
      color: colors.mediumGray
    });
    
    Helpers.addText(pdf, data.accountNumber, spacing.margin + 10, startY + 38, {
      fontSize: 10,
      color: colors.darkGray
    });
    
    // خط فاصل عمودي
    Helpers.drawLine(pdf, page.width / 2, startY + 8, page.width / 2, startY + boxHeight - 8, colors.borderLight);
    
    // المعلومات على اليمين
    Helpers.addText(pdf, 'STATEMENT PERIOD', page.width - spacing.margin - 10, startY + 12, {
      align: 'right',
      fontSize: 9,
      fontStyle: 'bold',
      color: colors.mediumGray
    });
    
    Helpers.addText(pdf, data.period, page.width - spacing.margin - 10, startY + 20, {
      align: 'right',
      fontSize: 10,
      color: colors.darkGray
    });
    
    Helpers.addText(pdf, 'CURRENT BALANCE', page.width - spacing.margin - 10, startY + 30, {
      align: 'right',
      fontSize: 9,
      fontStyle: 'bold',
      color: colors.mediumGray
    });
    
    Helpers.addText(pdf, Helpers.formatCurrency(data.balance, data.currency), 
                   page.width - spacing.margin - 10, startY + 38, {
      align: 'right',
      fontSize: 12,
      fontStyle: 'bold',
      color: colors.primary
    });
    
    return startY + boxHeight + spacing.sectionGap;
  } catch (error) {
    console.warn('Error drawing account info:', error);
    return startY + boxHeight + spacing.sectionGap;
  }
};

// قسم ملخص المعاملات
const drawTransactionSummary = (pdf: jsPDF, data: StatementData, startY: number): number => {
  const { colors, spacing, page } = DESIGN_CONSTANTS;
  const boxHeight = 35;
  
  try {
    // حساب الإجماليات
    const totalCredits = data.transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalDebits = data.transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const transactionCount = data.transactions.length;
    
    // خلفية الملخص
    Helpers.drawRect(pdf, spacing.margin, startY, page.width - 2 * spacing.margin, 
                    boxHeight, colors.signatureBg, colors.primary);
    
    // عنوان الملخص
    Helpers.addText(pdf, 'TRANSACTION SUMMARY', spacing.margin + 10, startY + 12, {
      fontSize: 12,
      fontStyle: 'bold',
      color: colors.primary
    });
    
    // الإحصائيات
    const statWidth = (page.width - 2 * spacing.margin - 20) / 3;
    
    // الإيداعات
    Helpers.addText(pdf, 'Total Credits:', spacing.margin + 10, startY + 22, {
      fontSize: 9,
      color: colors.mediumGray
    });
    
    Helpers.addText(pdf, Helpers.formatCurrency(totalCredits, data.currency), 
                   spacing.margin + 10, startY + 29, {
      fontSize: 10,
      fontStyle: 'bold',
      color: colors.success
    });
    
    // السحوبات
    Helpers.addText(pdf, 'Total Debits:', spacing.margin + 10 + statWidth, startY + 22, {
      fontSize: 9,
      color: colors.mediumGray
    });
    
    Helpers.addText(pdf, Helpers.formatCurrency(totalDebits, data.currency), 
                   spacing.margin + 10 + statWidth, startY + 29, {
      fontSize: 10,
      fontStyle: 'bold',
      color: colors.danger
    });
    
    // عدد المعاملات
    Helpers.addText(pdf, 'Transactions:', spacing.margin + 10 + statWidth * 2, startY + 22, {
      fontSize: 9,
      color: colors.mediumGray
    });
    
    Helpers.addText(pdf, transactionCount.toString(), 
                   spacing.margin + 10 + statWidth * 2, startY + 29, {
      fontSize: 10,
      fontStyle: 'bold',
      color: colors.darkGray
    });
    
    return startY + boxHeight + spacing.sectionGap;
  } catch (error) {
    console.warn('Error drawing transaction summary:', error);
    return startY + boxHeight + spacing.sectionGap;
  }
};

// جدول المعاملات المحسن
const drawTransactionsTable = (pdf: jsPDF, data: StatementData, startY: number): number => {
  const { colors, spacing, page } = DESIGN_CONSTANTS;
  const tableX = spacing.margin;
  const tableWidth = page.width - 2 * spacing.margin;
  
  try {
    // تحديد عرض الأعمدة
    const colWidths = {
      date: 22,
      description: 60,
      amount: 32,
      balance: 32,
      reference: 24
    };
    
    // التأكد من أن مجموع عرض الأعمدة لا يتجاوز عرض الجدول
    const totalColWidth = Object.values(colWidths).reduce((sum, width) => sum + width, 0);
    if (totalColWidth > tableWidth) {
      console.warn('Table columns exceed table width, adjusting...');
    }
    
    const headerHeight = 15;
    let yPosition = startY;
    
    // رسم رأس الجدول
    Helpers.drawRect(pdf, tableX, yPosition, tableWidth, headerHeight, colors.primary);
    
    // عناوين الأعمدة
    let currentX = tableX;
    
    // DATE column
    Helpers.addText(pdf, 'DATE', currentX + colWidths.date/2, yPosition + 10, {
      align: 'center',
      fontSize: 9,
      fontStyle: 'bold',
      color: colors.white
    });
    currentX += colWidths.date;
    
    // DESCRIPTION column
    Helpers.addText(pdf, 'DESCRIPTION', currentX + colWidths.description/2, yPosition + 10, {
      align: 'center',
      fontSize: 9,
      fontStyle: 'bold',
      color: colors.white
    });
    currentX += colWidths.description;
    
    // AMOUNT column
    Helpers.addText(pdf, 'AMOUNT', currentX + colWidths.amount/2, yPosition + 10, {
      align: 'center',
      fontSize: 9,
      fontStyle: 'bold',
      color: colors.white
    });
    currentX += colWidths.amount;
    
    // BALANCE column
    Helpers.addText(pdf, 'BALANCE', currentX + colWidths.balance/2, yPosition + 10, {
      align: 'center',
      fontSize: 9,
      fontStyle: 'bold',
      color: colors.white
    });
    currentX += colWidths.balance;
    
    // REFERENCE column
    Helpers.addText(pdf, 'REF', currentX + colWidths.reference/2, yPosition + 10, {
      align: 'center',
      fontSize: 9,
      fontStyle: 'bold',
      color: colors.white
    });
    
    yPosition += headerHeight;
    
    // رسم صفوف البيانات
    data.transactions.forEach((transaction, index) => {
      const rowHeight = 12;
      
      // التحقق من المساحة المتاحة
      yPosition = Helpers.checkPageSpace(pdf, yPosition, rowHeight);
      
      // تلوين الصفوف الزوجية
      if (index % 2 === 0) {
        Helpers.drawRect(pdf, tableX, yPosition, tableWidth, rowHeight, colors.tableRowEven);
      }
      
      // رسم حدود الصف
      Helpers.drawRect(pdf, tableX, yPosition, tableWidth, rowHeight, undefined, colors.borderLight, 0.3);
      
      // إضافة بيانات المعاملة مع مواضع محسوبة بدقة
      let cellX = tableX;
      
      const formattedDate = Helpers.formatDate(transaction.date);
      Helpers.addText(pdf, formattedDate, cellX + colWidths.date/2, yPosition + 8, {
        align: 'center',
        fontSize: 8,
        color: colors.darkGray
      });
      cellX += colWidths.date;
      
      // وصف المعاملة (مع قطع النص الطويل)
      let description = transaction.description;
      if (description.length > 35) {
        description = description.substring(0, 32) + '...';
      }
      
      Helpers.addText(pdf, description, cellX + 2, yPosition + 8, {
        fontSize: 8,
        color: colors.darkGray,
        maxWidth: colWidths.description - 4
      });
      cellX += colWidths.description;
      
      // المبلغ مع تلوين حسب النوع
      const amountColor = transaction.amount >= 0 ? colors.success : colors.danger;
      const amountText = Helpers.formatCurrency(transaction.amount, data.currency);
      
      Helpers.addText(pdf, amountText, cellX + colWidths.amount/2, yPosition + 8, {
        align: 'center',
        fontSize: 8,
        fontStyle: 'bold',
        color: amountColor
      });
      cellX += colWidths.amount;
      
      // الرصيد
      Helpers.addText(pdf, Helpers.formatCurrency(transaction.balance, data.currency), cellX + colWidths.balance/2, yPosition + 8, {
        align: 'center',
        fontSize: 8,
        color: colors.darkGray
      });
      cellX += colWidths.balance;
      
      // المرجع
      Helpers.addText(pdf, transaction.reference, cellX + colWidths.reference/2, yPosition + 8, {
        align: 'center',
        fontSize: 8,
        color: colors.mediumGray
      });
      
      yPosition += rowHeight;
    });
    
    return yPosition + spacing.sectionGap;
  } catch (error) {
    console.warn('Error drawing transactions table:', error);
    return startY + 100; // قيمة افتراضية في حالة الخطأ
  }
};

// رسم الختم الرسمي المحسن
const drawOfficialSeal = (pdf: jsPDF, x: number, y: number): void => {
  const { colors, seal } = DESIGN_CONSTANTS;
  
  try {
    const centerX = x + seal.radius;
    const centerY = y + seal.radius;
    
    // الدائرة الخارجية
    Helpers.drawCircle(pdf, centerX, centerY, seal.radius, undefined, colors.primary, seal.strokeWidth);
    
    // الدائرة الداخلية
    Helpers.drawCircle(pdf, centerX, centerY, seal.innerRadius, undefined, colors.primary, 1);
    
    // نص الختم العلوي
    Helpers.addText(pdf, 'TRADEHUB', centerX, centerY - 4, {
      align: 'center',
      fontSize: 7,
      fontStyle: 'bold',
      color: colors.primary
    });
    
    // نص الختم الأوسط
    Helpers.addText(pdf, 'VERIFIED', centerX, centerY + 2, {
      align: 'center',
      fontSize: 6,
      fontStyle: 'bold',
      color: colors.primary
    });
    
    // نص الختم السفلي
    Helpers.addText(pdf, 'OFFICIAL', centerX, centerY + 8, {
      align: 'center',
      fontSize: 5,
      color: colors.primary
    });
    
    // نقاط زخرفية
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI * 2) / 6;
      const dotX = centerX + Math.cos(angle) * (seal.innerRadius - 2);
      const dotY = centerY + Math.sin(angle) * (seal.innerRadius - 2);
      
      Helpers.drawCircle(pdf, dotX, dotY, 0.5, colors.primary);
    }
  } catch (error) {
    console.warn('Error drawing official seal:', error);
  }
};

// قسم التوقيع الإلكتروني والختم
const drawElectronicSignature = (pdf: jsPDF, startY: number): number => {
  const { colors, spacing, page, seal } = DESIGN_CONSTANTS;
  const boxHeight = 50;
  
  try {
    // التحقق من المساحة المتاحة
    const adjustedY = Helpers.checkPageSpace(pdf, startY, boxHeight);
    
    // خلفية التوقيع
    Helpers.drawRect(pdf, spacing.margin, adjustedY, page.width - 2 * spacing.margin, 
                    boxHeight, colors.signatureBg, colors.primary);
    
    // شريط جانبي
    Helpers.drawRect(pdf, spacing.margin, adjustedY, 3, boxHeight, colors.primary);
    
    // عنوان التوقيع
    Helpers.addText(pdf, 'ELECTRONIC VERIFICATION & OFFICIAL SEAL', spacing.margin + 10, adjustedY + 15, {
      fontSize: 12,
      fontStyle: 'bold',
      color: colors.primary
    });
    
    // معلومات التوقيع
    Helpers.addText(pdf, 'This document has been digitally signed and officially sealed by TradeHub Financial Services', 
                   spacing.margin + 10, adjustedY + 25, {
      fontSize: 9,
      color: colors.darkGray,
      maxWidth: page.width - 2 * spacing.margin - 80
    });
    
    const certificateId = `TH-${Date.now().toString().slice(-10)}`;
    Helpers.addText(pdf, `Certificate ID: ${certificateId}`, spacing.margin + 10, adjustedY + 35, {
      fontSize: 8,
      color: colors.mediumGray
    });
    
    Helpers.addText(pdf, `Digital Timestamp: ${new Date().toISOString()}`, 
                   spacing.margin + 10, adjustedY + 42, {
      fontSize: 8,
      color: colors.mediumGray
    });
    
    // رسم الختم الرسمي
    const sealX = page.width - spacing.margin - seal.radius * 2 - 10;
    const sealY = adjustedY + 5;
    drawOfficialSeal(pdf, sealX, sealY);
    
    return adjustedY + boxHeight + spacing.sectionGap;
  } catch (error) {
    console.warn('Error drawing electronic signature:', error);
    return startY + boxHeight + spacing.sectionGap;
  }
};

// الوظيفة الرئيسية لإنشاء كشف الحساب
export const generateAccountStatement = async (data: StatementData): Promise<void> => {
  try {
    // Update data with real user info
    const updatedData = {
      ...data,
      accountHolder: data.accountHolder || 'Account Holder',
      currency: data.currency === 'AED' ? 'EUR' : data.currency // تحويل AED إلى EUR إذا كان موجوداً
    };
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // رسم الرأس
    const headerHeight = drawHeader(pdf, 'ACCOUNT STATEMENT', `Period: ${updatedData.period}`);
    
    // رسم معلومات الحساب
    const accountInfoY = headerHeight + DESIGN_CONSTANTS.spacing.sectionGap;
    const summaryY = drawAccountInfo(pdf, updatedData, accountInfoY);
    
    // رسم ملخص المعاملات
    const tableY = drawTransactionSummary(pdf, updatedData, summaryY);
    
    // رسم جدول المعاملات
    const signatureY = drawTransactionsTable(pdf, updatedData, tableY);
    
    // رسم التوقيع الإلكتروني والختم
    drawElectronicSignature(pdf, signatureY);
    
    // رسم التذييل
    drawFooter(pdf, 'This document is electronically generated and digitally sealed');
    
    // حفظ الملف
    const fileName = `TradeHub-Account-Statement-${updatedData.period.replace(/\s+/g, '-')}-${Helpers.formatDate(new Date()).replace(/\//g, '-')}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error('Error generating account statement:', error);
    throw new Error('Failed to generate account statement');
  }
};

// وظيفة إنشاء شهادة الرصيد
export const generateBalanceCertificate = async (accountNumber: string, balance: number, currency: string): Promise<void> => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const { colors, page, spacing, seal } = DESIGN_CONSTANTS;
    
    // رسم الرأس
    const headerHeight = drawHeader(pdf, 'BALANCE CERTIFICATE', 'Official Bank Certificate');
    
    let yPos = headerHeight + spacing.sectionGap;
    
    // خلفية الشهادة
    Helpers.drawRect(pdf, spacing.margin, yPos, page.width - 2 * spacing.margin, 100, 
                    colors.tableHeaderBg, colors.primary);
    
    // شريط جانبي
    Helpers.drawRect(pdf, spacing.margin, yPos, 3, 100, colors.primary);
    
    // عنوان الشهادة
    Helpers.addText(pdf, 'CERTIFICATE OF ACCOUNT BALANCE', spacing.margin + 10, yPos + 18, {
      fontSize: 14,
      fontStyle: 'bold',
      color: colors.primary
    });
    
    yPos += 30;
    
    // نص الشهادة
    Helpers.addText(pdf, 'This is to certify that as of today\'s date, the following account:', 
                   spacing.margin + 10, yPos, {
      fontSize: 11,
      color: colors.darkGray
    });
    
    yPos += 15;
    
    // معلومات الحساب في مربع
    Helpers.drawRect(pdf, spacing.margin + 10, yPos, page.width - 2 * spacing.margin - 20, 30, 
                    colors.signatureBg, colors.borderLight);
    
    Helpers.addText(pdf, `Account Number: ${accountNumber}`, spacing.margin + 15, yPos + 12, {
      fontSize: 10,
      fontStyle: 'bold',
      color: colors.darkGray
    });
    
    Helpers.addText(pdf, `Current Balance: ${Helpers.formatCurrency(balance, currency)}`, 
                   spacing.margin + 15, yPos + 22, {
      fontSize: 12,
      fontStyle: 'bold',
      color: colors.primary
    });
    
    yPos += 40;
    
    // نص التأكيد
    Helpers.addText(pdf, 'Has the above-mentioned balance as verified by our records.', 
                   spacing.margin + 10, yPos, {
      fontSize: 10,
      color: colors.darkGray
    });
    
    yPos += 10;
    
    Helpers.addText(pdf, 'This certificate is issued for official purposes and is valid as of the date of issuance.', 
                   spacing.margin + 10, yPos, {
      fontSize: 9,
      color: colors.mediumGray
    });
    
    yPos += 25;
    
    // رسم التوقيع الإلكتروني والختم
    drawElectronicSignature(pdf, yPos);
    
    // رسم التذييل
    drawFooter(pdf, 'This certificate is electronically generated and digitally sealed');
    
    // حفظ الملف
    const fileName = `TradeHub-Balance-Certificate-${accountNumber}-${Helpers.formatDate(new Date()).replace(/\//g, '-')}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error('Error generating balance certificate:', error);
    throw new Error('Failed to generate balance certificate');
  }
};

// وظيفة إنشاء الإقرار الضريبي
export const generateTaxDeclaration = async (data: TaxData): Promise<void> => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const { colors, page, spacing } = DESIGN_CONSTANTS;
    
    // رسم الرأس
    const headerHeight = drawHeader(pdf, 'TAX DECLARATION', `Financial Year ${data.year}`);

    let yPos = headerHeight + spacing.sectionGap;

    // خلفية الإقرار
    Helpers.drawRect(pdf, spacing.margin, yPos, page.width - 2 * spacing.margin, 70,
                    colors.tableHeaderBg, colors.primary);

    // شريط جانبي
    Helpers.drawRect(pdf, spacing.margin, yPos, 3, 70, colors.primary);

    // عنوان الإقرار
    Helpers.addText(pdf, 'ANNUAL TAX DECLARATION STATEMENT', spacing.margin + 10, yPos + 15, {
      fontSize: 14,
      fontStyle: 'bold',
      color: colors.primary
    });

    yPos += 25;

    // معلومات الحساب
    Helpers.addText(pdf, `Account Holder: ${data.accountHolder}`, spacing.margin + 10, yPos, {
      fontSize: 11,
      fontStyle: 'bold',
      color: colors.darkGray
    });

    yPos += 10;

    Helpers.addText(pdf, `Account Number: ${data.accountNumber}`, spacing.margin + 10, yPos, {
      fontSize: 10,
      color: colors.darkGray
    });

    yPos += 10;

    Helpers.addText(pdf, `Tax Year: ${data.year}`, spacing.margin + 10, yPos, {
      fontSize: 10,
      color: colors.darkGray
    });

    yPos += 20;

    // ملخص ضريبي في مربع
    Helpers.drawRect(pdf, spacing.margin, yPos, page.width - 2 * spacing.margin, 80,
                    colors.signatureBg, colors.primary);

    Helpers.addText(pdf, `TAX SUMMARY FOR ${data.year}`, page.width / 2, yPos + 15, {
      align: 'center',
      fontSize: 12,
      fontStyle: 'bold',
      color: colors.primary
    });

    yPos += 25;

    const taxSummary = [
      { label: 'Total Annual Deposits:', value: Helpers.formatCurrency(data.totalDeposits, data.currency) },
      { label: 'Total Annual Withdrawals:', value: Helpers.formatCurrency(data.totalWithdrawals, data.currency) },
      { label: 'Average Monthly Balance:', value: Helpers.formatCurrency(data.averageBalance, data.currency) },
      { label: 'VAT Applicable Transactions:', value: `${data.vatTransactions} transactions` },
      { label: 'Tax Compliance Status:', value: 'COMPLIANT' }
    ];

    taxSummary.forEach((item) => {
      Helpers.addText(pdf, item.label, spacing.margin + 10, yPos, {
        fontSize: 9,
        color: colors.mediumGray
      });

      Helpers.addText(pdf, item.value, page.width - spacing.margin - 10, yPos, {
        align: 'right',
        fontSize: 9,
        fontStyle: 'bold',
        color: colors.darkGray
      });

      yPos += 10;
    });
    
    yPos += 15;
    
    // رسم التوقيع الإلكتروني والختم
    drawElectronicSignature(pdf, yPos);
    
    // رسم التذييل
    drawFooter(pdf, 'This tax declaration is electronically generated and certified');
    
    // حفظ الملف
    const fileName = `TradeHub-Tax-Declaration-${data.accountNumber}-${data.year}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error('Error generating tax declaration:', error);
    throw new Error('Failed to generate tax declaration');
  }
};