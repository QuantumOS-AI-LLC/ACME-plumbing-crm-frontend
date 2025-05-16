import { 
  Modal, 
  Typography, 
  Box,
  Grid,
  Button,
  LinearProgress,
} from '@mui/material';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // Correct import for jspdf-autotable

const isDueDateApproaching = (dueDate) => {
  const today = new Date();
  const due = new Date(dueDate);
  const diffDays = (due - today) / (1000 * 60 * 60 * 24);
  return diffDays <= 7 && diffDays >= 0;
};

const JobDetailsModal = ({ handleClose, open, job }) => {
  const formatDate = (date) => {
    return date ? format(new Date(date), 'MMM dd, yyyy') : 'Not set';
  };

  const displayName = job?.leadName || job?.client?.name || 'Job Details';

  const generateInvoice = () => {
    const doc = new jsPDF();

    // Colors and Fonts
    const primaryColor = [0, 102, 204]; // RGB for a professional blue
    const secondaryColor = [100, 100, 100]; // Gray for secondary text
    doc.setFont('helvetica', 'bold');

    // Header
    doc.setFontSize(24);
    doc.setTextColor(...primaryColor);
    doc.text('INVOICE', 105, 20, { align: 'center' });

    // Company Info (Customize as needed)
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.text('Your Company Name', 20, 35);
    doc.text('123 Business St, City, Country', 20, 40);
    doc.text('Email: contact@company.com', 20, 45);
    doc.text('Phone: +123-456-7890', 20, 50);

    // Invoice Info (right-aligned)
    doc.setFontSize(10);
    doc.text(`Invoice #: INV-${Math.floor(Math.random() * 10000)}`, 140, 60);
    doc.text(`Invoice Date: ${formatDate(new Date())}`, 140, 65);
    doc.text(`Due Date: ${formatDate(job?.dueDate)}`, 140, 70);

    // Client Info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('Bill To:', 20, 65);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(job?.client?.name || 'N/A', 20, 72);
    doc.text(job?.address || 'N/A', 20, 77);

    // Table for Job Details using autoTable
    autoTable(doc, {
      startY: 90,
      head: [['Description', 'Amount']],
      body: [[
        'Job/Service',
        `$${job?.price?.toLocaleString() || 'N/A'}`
      ]],
      styles: {
        fontSize: 10,
        cellPadding: 3,
        textColor: [0, 0, 0],
      },
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 130 },
        1: { cellWidth: 40, halign: 'right' },
      },
      theme: 'striped',
    });

    // Total
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('Total:', 130, finalY);
    doc.setTextColor(0, 0, 0);
    doc.text(`$${job?.price?.toLocaleString() || 'N/A'}`, 170, finalY, { align: 'right' });

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(...secondaryColor);
    doc.text('Thank you for your business!', 105, finalY + 20, { align: 'center' });
    doc.text('Payment Terms: Due on receipt', 105, finalY + 25, { align: 'center' });

    // Add a decorative line
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(20, finalY + 15, 190, finalY + 15);

    // Save the PDF
    doc.save(`Invoice_${job?.client?.name || 'Job'}_${format(new Date(), 'yyyyMMdd')}.pdf`);
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="job-details-modal"
      sx={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        backdropFilter: "blur(2px)"
      }}
    >
      <Box
        sx={{
          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: 24,
          p: 4,
          maxWidth: 600,
          width: "90%",
          maxHeight: "80vh",
          overflowY: "auto",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography 
          id="job-details-modal" 
          variant="h5" 
          gutterBottom
          sx={{
            color: "primary.main",
            fontWeight: "bold",
            mb: 3,
            pb: 1,
            borderBottom: "2px solid",
            borderColor: "primary.light"
          }}
        >
          {displayName}
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: "medium" }}>
              Client
            </Typography>
            <Typography variant="body1" sx={{ color: "text.primary", fontWeight: "medium" }}>
              {job?.client?.name || "N/A"}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: "medium" }}>
              Address
            </Typography>
            <Typography variant="body1" sx={{ color: "text.primary" }}>
              {job?.address || "N/A"}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: "medium" }}>
              {job?.status === "completed" ? "Completed Date" : "Start Date"}
            </Typography>
            <Typography variant="body1" sx={{ color: "text.primary" }}>
              {formatDate(
                job?.status === "completed" ? job?.completedDate : job?.startDate
              )}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: "medium" }}>
              Price
            </Typography>
            <Typography variant="body1" sx={{ color: "success.main", fontWeight: "bold" }}>
              ${job?.price?.toLocaleString() || "N/A"}
            </Typography>
          </Grid>
          {job?.status === "in_progress" && typeof job?.progress === "number" && (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: "medium" }}>
                Progress
              </Typography>
              <Typography variant="body1" sx={{ color: "text.primary", mb: 1 }}>
                {job.progress}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={job.progress}
                sx={{ 
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "action.disabledBackground",
                  "& .MuiLinearProgress-bar": {
                    backgroundColor: job.progress >= 80 ? "success.main" : "primary.main",
                    borderRadius: 4
                  }
                }}
              />
            </Grid>
          )}
          {job?.dueDate && (
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: "medium" }}>
                Due Date
              </Typography>
              <Typography
                variant="body1"
                sx={{ 
                  color: isDueDateApproaching(job.dueDate) ? "warning.main" : "text.primary",
                  fontWeight: isDueDateApproaching(job.dueDate) ? "bold" : "normal"
                }}
              >
                {formatDate(job.dueDate)}
              </Typography>
            </Grid>
          )}
        </Grid>

        <Box sx={{ 
          mt: 4, 
          display: "flex", 
          justifyContent: "flex-end",
          pt: 2,
          borderTop: "1px solid",
          borderColor: "divider",
          gap: 2
        }}>
          <Button 
            variant="outlined" 
            onClick={generateInvoice}
            sx={{
              borderColor: "primary.main",
              color: "primary.main",
              "&:hover": {
                borderColor: "primary.dark",
                bgcolor: "primary.light",
                color:"white"
              },
              px: 4,
              py: 1,
              borderRadius: 1
            }}
            disabled={!job?.client?.name || !job?.price}
          >
            Generate Invoice
          </Button>
          <Button 
            variant="contained" 
            onClick={handleClose}
            sx={{
              bgcolor: "primary.main",
              "&:hover": {
                bgcolor: "primary.dark"
              },
              px: 4,
              py: 1,
              borderRadius: 1
            }}
          >
            Close
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default JobDetailsModal;