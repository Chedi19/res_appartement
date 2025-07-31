import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const exportCalendarToPDF = async (): Promise<void> => {
  try {
    const calendarElement = document.getElementById('calendar-container');
    
    if (!calendarElement) {
      throw new Error('Élément calendrier introuvable');
    }

    // Créer une notification de chargement
    const loadingNotification = document.createElement('div');
    loadingNotification.innerHTML = `
      <div style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 20px;
        border-radius: 8px;
        z-index: 10000;
        text-align: center;
      ">
        <div>Génération du PDF en cours...</div>
        <div style="margin-top: 10px; font-size: 14px; opacity: 0.8;">Veuillez patienter</div>
      </div>
    `;
    document.body.appendChild(loadingNotification);

    // Configuration pour html2canvas
    const canvas = await html2canvas(calendarElement, {
      scale: 2, // Haute résolution
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: calendarElement.scrollWidth,
      height: calendarElement.scrollHeight,
      scrollX: 0,
      scrollY: 0
    });

    // Supprimer la notification de chargement
    document.body.removeChild(loadingNotification);

    // Créer le PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Dimensions A4 en paysage
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Calculer les dimensions de l'image pour qu'elle s'adapte à la page
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    
    const scaledWidth = imgWidth * ratio;
    const scaledHeight = imgHeight * ratio;
    
    // Centrer l'image sur la page
    const x = (pdfWidth - scaledWidth) / 2;
    const y = (pdfHeight - scaledHeight) / 2;

    // Ajouter l'image au PDF
    pdf.addImage(imgData, 'PNG', x, y, scaledWidth, scaledHeight);
    
    // Ajouter un titre
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Calendrier des Réservations', 14, 14);
    
    // Ajouter la date de génération
    pdf.setFontSize(10);
    pdf.text(
      `Généré le ${format(new Date(), 'PPPP', { locale: fr })}`,
      14,
      pdfHeight - 10
    );

    // Télécharger le PDF
    const fileName = `calendrier-reservations-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    pdf.save(fileName);

    // Notification de succès
    showNotification('PDF généré avec succès !', 'success');

  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    showNotification('Erreur lors de la génération du PDF', 'error');
  }
};

// Fonction utilitaire pour afficher des notifications
const showNotification = (message: string, type: 'success' | 'error' = 'success'): void => {
  const notification = document.createElement('div');
  const backgroundColor = type === 'success' ? '#10B981' : '#EF4444';
  
  notification.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${backgroundColor};
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      max-width: 300px;
      animation: slideIn 0.3s ease-out;
    ">
      ${message}
    </div>
    <style>
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    </style>
  `;
  
  document.body.appendChild(notification);
  
  // Supprimer la notification après 3 secondes
  setTimeout(() => {
    if (document.body.contains(notification)) {
      document.body.removeChild(notification);
    }
  }, 3000);
};