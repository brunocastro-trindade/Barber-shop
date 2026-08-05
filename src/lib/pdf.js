// Exportação em PDF, usada pelo botão de cada tela e pela tela Exportar Dados.
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function makePDF(nomeNegocio, sections) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const now = new Date().toLocaleString("pt-BR");

  doc.setFillColor(22, 27, 34);
  doc.rect(0, 0, W, 22, "F");
  doc.setTextColor(230, 232, 240);
  doc.setFontSize(13); doc.setFont("helvetica", "bold");
  doc.text("ControlCRM — Exportação de Dados", 14, 10);
  doc.setFontSize(8); doc.setFont("helvetica", "normal");
  doc.text(`${nomeNegocio} · Barbearia`, 14, 16);
  doc.text(`Gerado em ${now}`, W - 14, 16, { align: "right" });

  doc.setFontSize(8); doc.setTextColor(104, 116, 138);
  doc.text("Este arquivo foi gerado para migração de dados. Importe-o no seu novo sistema.", 14, 28);

  let y = 34;
  sections.forEach(({ title, columns, rows }) => {
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(40, 40, 40);
    doc.text(title, 14, y); y += 4;
    autoTable(doc, {
      startY: y, head: [columns], body: rows,
      theme: "grid", headStyles: { fillColor: [22, 27, 34], textColor: [230, 232, 240], fontSize: 8, fontStyle: "bold" },
      bodyStyles: { fontSize: 8, textColor: [40, 40, 40] },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 10;
  });

  doc.save(`ControlCRM_${nomeNegocio.replace(/\s+/g, "_")}_${Date.now()}.pdf`);
}
