import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


export const GeneratePDF = async (tableData) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Add title without requiring image
    doc.setFontSize(16);
    doc.text('Users Overview', pageWidth / 2, 20, { align: 'center' });

    // Table headers
    const headers = ['ID', 'User', 'Email', 'Role', 'Status', 'Created At', 'LastLogin'];

    // Generate table
    autoTable(doc, {
      startY: 30,
      head: [headers],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [13, 110, 253] },
      margin: { top: 20 },
      pageBreak: 'auto'
    });

    doc.save('users-report.pdf');
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Failed to generate PDF. Please try again.');
  }
};