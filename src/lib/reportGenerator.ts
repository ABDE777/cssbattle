import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Document, Packer, Paragraph, TextRun, Table, TableCell, TableRow, HeadingLevel, AlignmentType } from "docx";
import * as XLSX from "xlsx";

interface ScoreHistory {
  id: string;
  player_id: string;
  score: number;
  previous_score: number | null;
  score_change: number | null;
  timestamp: string;
  reason: string | null;
}

interface Player {
  id: string;
  full_name: string;
  email: string;
  score: number | null;
  group_name: string | null;
}

interface PlayerStats {
  player: Player;
  totalChanges: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  totalGrowth: number;
  recentActivity: string;
}

// Helper function to load image as base64
const loadImageAsBase64 = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Failed to load image:", error);
    return "";
  }
};

// ============= INDIVIDUAL PLAYER REPORTS =============

export const generatePlayerPDF = async (player: Player, history: ScoreHistory[]) => {
  const doc = new jsPDF();
  
  // Add logo
  try {
    const logoBase64 = await loadImageAsBase64("/ofppt logo.png");
    if (logoBase64) {
      doc.addImage(logoBase64, "PNG", 15, 10, 30, 30);
    }
  } catch (error) {
    console.error("Failed to add logo:", error);
  }

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("OFPPT - Platform Report", 105, 25, { align: "center" });
  
  doc.setFontSize(16);
  doc.text("Player Performance Analysis", 105, 35, { align: "center" });

  // Player info
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Player: ${player.full_name}`, 15, 50);
  doc.text(`Email: ${player.email}`, 15, 57);
  doc.text(`Group: ${player.group_name || "N/A"}`, 15, 64);
  doc.text(`Current Score: ${player.score || 0}`, 15, 71);
  doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 15, 78);

  // Calculate stats
  const averageScore = history.length > 0 
    ? history.reduce((sum, h) => sum + h.score, 0) / history.length 
    : 0;
  const highestScore = history.length > 0 
    ? Math.max(...history.map(h => h.score)) 
    : 0;
  const lowestScore = history.length > 0 
    ? Math.min(...history.map(h => h.score)) 
    : 0;

  // Performance summary
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Performance Summary", 15, 90);
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Total Score Updates: ${history.length}`, 20, 98);
  doc.text(`Average Score: ${averageScore.toFixed(2)}`, 20, 105);
  doc.text(`Highest Score: ${highestScore}`, 20, 112);
  doc.text(`Lowest Score: ${lowestScore}`, 20, 119);

  // Detailed analysis
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Detailed Analysis", 15, 132);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  const analysisText = `This report provides a comprehensive overview of ${player.full_name}'s performance on the OFPPT platform. ` +
    `The player has recorded ${history.length} score updates, with an average score of ${averageScore.toFixed(2)}. ` +
    `The highest achievement reached ${highestScore} points, while the lowest recorded score was ${lowestScore} points. ` +
    (history.length > 0 
      ? `The player's journey shows ${history[0].score > history[history.length - 1].score ? "improvement" : "variation"} over time.`
      : "No historical data available yet.");
  
  const splitText = doc.splitTextToSize(analysisText, 180);
  doc.text(splitText, 15, 140);

  // Score history table
  if (history.length > 0) {
    autoTable(doc, {
      startY: 160,
      head: [["Date", "Score", "Change", "Reason"]],
      body: history.slice(0, 15).map(h => [
        new Date(h.timestamp).toLocaleDateString(),
        h.score.toString(),
        h.score_change ? (h.score_change > 0 ? `+${h.score_change}` : h.score_change.toString()) : "N/A",
        h.reason || "Update"
      ]),
      theme: "grid",
      headStyles: { fillColor: [147, 51, 234] },
    });
  }

  doc.save(`${player.full_name}_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generatePlayerWord = async (player: Player, history: ScoreHistory[]) => {
  const averageScore = history.length > 0 
    ? history.reduce((sum, h) => sum + h.score, 0) / history.length 
    : 0;
  const highestScore = history.length > 0 
    ? Math.max(...history.map(h => h.score)) 
    : 0;
  const lowestScore = history.length > 0 
    ? Math.min(...history.map(h => h.score)) 
    : 0;

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: "OFPPT - Platform Report",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          text: "Player Performance Analysis",
          heading: HeadingLevel.HEADING_2,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [
            new TextRun({ text: "Player: ", bold: true }),
            new TextRun(player.full_name),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Email: ", bold: true }),
            new TextRun(player.email),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Group: ", bold: true }),
            new TextRun(player.group_name || "N/A"),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Current Score: ", bold: true }),
            new TextRun(String(player.score || 0)),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Report Date: ", bold: true }),
            new TextRun(new Date().toLocaleDateString()),
          ],
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          text: "Performance Summary",
          heading: HeadingLevel.HEADING_3,
        }),
        new Paragraph({ text: `Total Score Updates: ${history.length}` }),
        new Paragraph({ text: `Average Score: ${averageScore.toFixed(2)}` }),
        new Paragraph({ text: `Highest Score: ${highestScore}` }),
        new Paragraph({ text: `Lowest Score: ${lowestScore}` }),
        new Paragraph({ text: "" }),
        new Paragraph({
          text: "Detailed Analysis",
          heading: HeadingLevel.HEADING_3,
        }),
        new Paragraph({
          text: `This report provides a comprehensive overview of ${player.full_name}'s performance on the OFPPT platform. ` +
            `The player has recorded ${history.length} score updates, with an average score of ${averageScore.toFixed(2)}. ` +
            `The highest achievement reached ${highestScore} points, while the lowest recorded score was ${lowestScore} points. ` +
            (history.length > 0 
              ? `The player's journey shows ${history[0].score > history[history.length - 1].score ? "improvement" : "variation"} over time.`
              : "No historical data available yet."),
        }),
        new Paragraph({ text: "" }),
        ...(history.length > 0 ? [
          new Paragraph({
            text: "Score History",
            heading: HeadingLevel.HEADING_3,
          }),
          new Table({
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Date", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Score", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Change", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Reason", bold: true })] })] }),
                ],
              }),
              ...history.slice(0, 20).map(h => new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph(new Date(h.timestamp).toLocaleDateString())] }),
                  new TableCell({ children: [new Paragraph(String(h.score))] }),
                  new TableCell({ children: [new Paragraph(h.score_change ? (h.score_change > 0 ? `+${h.score_change}` : String(h.score_change)) : "N/A")] }),
                  new TableCell({ children: [new Paragraph(h.reason || "Update")] }),
                ],
              })),
            ],
          }),
        ] : []),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${player.full_name}_Report_${new Date().toISOString().split('T')[0]}.docx`;
  link.click();
  URL.revokeObjectURL(url);
};

export const generatePlayerExcel = (player: Player, history: ScoreHistory[]) => {
  const averageScore = history.length > 0 
    ? history.reduce((sum, h) => sum + h.score, 0) / history.length 
    : 0;
  const highestScore = history.length > 0 
    ? Math.max(...history.map(h => h.score)) 
    : 0;
  const lowestScore = history.length > 0 
    ? Math.min(...history.map(h => h.score)) 
    : 0;

  // Player info sheet
  const playerInfoData = [
    ["OFPPT - Platform Report"],
    ["Player Performance Analysis"],
    [""],
    ["Player Name", player.full_name],
    ["Email", player.email],
    ["Group", player.group_name || "N/A"],
    ["Current Score", player.score || 0],
    ["Report Date", new Date().toLocaleDateString()],
    [""],
    ["Performance Summary"],
    ["Total Score Updates", history.length],
    ["Average Score", averageScore.toFixed(2)],
    ["Highest Score", highestScore],
    ["Lowest Score", lowestScore],
  ];

  // Score history sheet
  const historyData = [
    ["Date", "Score", "Previous Score", "Change", "Reason"],
    ...history.map(h => [
      new Date(h.timestamp).toLocaleDateString(),
      h.score,
      h.previous_score || "N/A",
      h.score_change || "N/A",
      h.reason || "Update"
    ])
  ];

  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.aoa_to_sheet(playerInfoData);
  const ws2 = XLSX.utils.aoa_to_sheet(historyData);

  XLSX.utils.book_append_sheet(wb, ws1, "Player Info");
  XLSX.utils.book_append_sheet(wb, ws2, "Score History");

  XLSX.writeFile(wb, `${player.full_name}_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// ============= MONTHLY ADMIN REPORTS =============

export const generateMonthlyPDF = async (playerStats: PlayerStats[], month: string) => {
  const doc = new jsPDF();
  
  // Add logo
  try {
    const logoBase64 = await loadImageAsBase64("/ofppt logo.png");
    if (logoBase64) {
      doc.addImage(logoBase64, "PNG", 15, 10, 30, 30);
    }
  } catch (error) {
    console.error("Failed to add logo:", error);
  }

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("OFPPT - Platform Report", 105, 25, { align: "center" });
  
  doc.setFontSize(16);
  doc.text("Monthly Performance Summary", 105, 35, { align: "center" });

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Report Period: ${month}`, 15, 50);
  doc.text(`Total Players: ${playerStats.length}`, 15, 57);
  doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 15, 64);

  // Overall statistics
  const totalActivePlayers = playerStats.filter(p => p.totalChanges > 0).length;
  const avgGrowth = playerStats.reduce((sum, p) => sum + p.totalGrowth, 0) / playerStats.length;
  const topPerformer = playerStats.reduce((max, p) => p.player.score! > (max.player.score || 0) ? p : max, playerStats[0]);

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Overall Statistics", 15, 75);
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Active Players: ${totalActivePlayers}`, 20, 83);
  doc.text(`Average Growth: ${avgGrowth.toFixed(2)}`, 20, 90);
  doc.text(`Top Performer: ${topPerformer?.player.full_name || "N/A"}`, 20, 97);

  // Detailed analysis
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Executive Summary", 15, 110);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  const analysisText = `This monthly report for ${month} provides insights into the OFPPT platform's performance. ` +
    `Out of ${playerStats.length} registered players, ${totalActivePlayers} showed activity during this period. ` +
    `The average score growth across all players was ${avgGrowth.toFixed(2)} points. ` +
    `${topPerformer ? `${topPerformer.player.full_name} emerged as the top performer with a current score of ${topPerformer.player.score} points.` : ""} ` +
    `The platform continues to demonstrate positive engagement trends with consistent player participation.`;
  
  const splitText = doc.splitTextToSize(analysisText, 180);
  doc.text(splitText, 15, 118);

  // Player statistics table
  autoTable(doc, {
    startY: 145,
    head: [["Player", "Group", "Score", "Growth", "Changes"]],
    body: playerStats.slice(0, 20).map(ps => [
      ps.player.full_name,
      ps.player.group_name || "N/A",
      String(ps.player.score || 0),
      ps.totalGrowth > 0 ? `+${ps.totalGrowth}` : String(ps.totalGrowth),
      String(ps.totalChanges)
    ]),
    theme: "grid",
    headStyles: { fillColor: [147, 51, 234] },
  });

  doc.save(`Monthly_Report_${month}.pdf`);
};

export const generateMonthlyWord = async (playerStats: PlayerStats[], month: string) => {
  const totalActivePlayers = playerStats.filter(p => p.totalChanges > 0).length;
  const avgGrowth = playerStats.reduce((sum, p) => sum + p.totalGrowth, 0) / playerStats.length;
  const topPerformer = playerStats.reduce((max, p) => p.player.score! > (max.player.score || 0) ? p : max, playerStats[0]);

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: "OFPPT - Platform Report",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          text: "Monthly Performance Summary",
          heading: HeadingLevel.HEADING_2,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [
            new TextRun({ text: "Report Period: ", bold: true }),
            new TextRun(month),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Total Players: ", bold: true }),
            new TextRun(String(playerStats.length)),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Report Date: ", bold: true }),
            new TextRun(new Date().toLocaleDateString()),
          ],
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          text: "Overall Statistics",
          heading: HeadingLevel.HEADING_3,
        }),
        new Paragraph({ text: `Active Players: ${totalActivePlayers}` }),
        new Paragraph({ text: `Average Growth: ${avgGrowth.toFixed(2)}` }),
        new Paragraph({ text: `Top Performer: ${topPerformer?.player.full_name || "N/A"}` }),
        new Paragraph({ text: "" }),
        new Paragraph({
          text: "Executive Summary",
          heading: HeadingLevel.HEADING_3,
        }),
        new Paragraph({
          text: `This monthly report for ${month} provides insights into the OFPPT platform's performance. ` +
            `Out of ${playerStats.length} registered players, ${totalActivePlayers} showed activity during this period. ` +
            `The average score growth across all players was ${avgGrowth.toFixed(2)} points. ` +
            `${topPerformer ? `${topPerformer.player.full_name} emerged as the top performer with a current score of ${topPerformer.player.score} points.` : ""} ` +
            `The platform continues to demonstrate positive engagement trends with consistent player participation.`,
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          text: "Player Statistics",
          heading: HeadingLevel.HEADING_3,
        }),
        new Table({
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Player", bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Group", bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Score", bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Growth", bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Changes", bold: true })] })] }),
              ],
            }),
            ...playerStats.map(ps => new TableRow({
              children: [
                new TableCell({ children: [new Paragraph(ps.player.full_name)] }),
                new TableCell({ children: [new Paragraph(ps.player.group_name || "N/A")] }),
                new TableCell({ children: [new Paragraph(String(ps.player.score || 0))] }),
                new TableCell({ children: [new Paragraph(ps.totalGrowth > 0 ? `+${ps.totalGrowth}` : String(ps.totalGrowth))] }),
                new TableCell({ children: [new Paragraph(String(ps.totalChanges))] }),
              ],
            })),
          ],
        }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Monthly_Report_${month}.docx`;
  link.click();
  URL.revokeObjectURL(url);
};

export const generateMonthlyExcel = (playerStats: PlayerStats[], month: string) => {
  const totalActivePlayers = playerStats.filter(p => p.totalChanges > 0).length;
  const avgGrowth = playerStats.reduce((sum, p) => sum + p.totalGrowth, 0) / playerStats.length;
  const topPerformer = playerStats.reduce((max, p) => p.player.score! > (max.player.score || 0) ? p : max, playerStats[0]);

  // Summary sheet
  const summaryData = [
    ["OFPPT - Platform Report"],
    ["Monthly Performance Summary"],
    [""],
    ["Report Period", month],
    ["Total Players", playerStats.length],
    ["Active Players", totalActivePlayers],
    ["Average Growth", avgGrowth.toFixed(2)],
    ["Top Performer", topPerformer?.player.full_name || "N/A"],
    ["Report Date", new Date().toLocaleDateString()],
  ];

  // Player stats sheet
  const statsData = [
    ["Player Name", "Email", "Group", "Current Score", "Total Changes", "Average Score", "Highest Score", "Lowest Score", "Total Growth"],
    ...playerStats.map(ps => [
      ps.player.full_name,
      ps.player.email,
      ps.player.group_name || "N/A",
      ps.player.score || 0,
      ps.totalChanges,
      ps.averageScore.toFixed(2),
      ps.highestScore,
      ps.lowestScore,
      ps.totalGrowth
    ])
  ];

  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
  const ws2 = XLSX.utils.aoa_to_sheet(statsData);

  XLSX.utils.book_append_sheet(wb, ws1, "Summary");
  XLSX.utils.book_append_sheet(wb, ws2, "Player Statistics");

  XLSX.writeFile(wb, `Monthly_Report_${month}.xlsx`);
};
