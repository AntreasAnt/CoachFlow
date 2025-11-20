import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


export const GeneratePDF = async (tableData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Fetch and convert image to base64
  const response = await fetch('/MrRodosthenous.png');
  //convert object into raw binary image data
  const blob = await response.blob();
  const reader = new FileReader();
  //convert the blob into base64 string
  reader.readAsDataURL(blob);

  reader.onloadend = function () {
    const logoBase64 = reader.result;

    doc.addImage(logoBase64, 'PNG', 10, 10, 15, 15);
    doc.setFontSize(16);
    doc.text('Users Overview', pageWidth / 2, 25, { align: 'center' });

    // Table headers
    const headers = ['ID', 'User', 'Email', 'Role', 'Status', 'Created At', 'LastLogin'];

    // Generate table
    autoTable(doc, {
      startY: 40,
      head: [headers],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [13, 110, 253] },
      margin: { top: 20 },
      pageBreak: 'auto'
    });

    doc.save('αναφορά-χρηστών.pdf');
  };
};