import React, { useState, useMemo, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Divider,
  IconButton,
  Collapse,
  Grid,
  Card,
  CardContent,
  Badge,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Search as SearchIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  VideoCall as VideoCallIcon,
  Download as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  SmartToy as SmartToyIcon,
  DateRange as DateRangeIcon,
  GetApp as GetAppIcon,
} from "@mui/icons-material";
import { toast } from "sonner";

const ConversationHistory = ({ contactId, contactName }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedItems, setExpandedItems] = useState({});
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [showDateFilter, setShowDateFilter] = useState(false);

  // ====== API INTEGRATION POINT 1: CONVERSATION DATA ======
  // TODO: Replace this dummy data with API calls
  // API endpoints needed:
  // - GET /api/conversations/sms/{contactId}
  // - GET /api/conversations/calls/{contactId}
  // - GET /api/conversations/emails/{contactId}
  // - GET /api/conversations/videos/{contactId}
  // Consider using React Query or SWR for data fetching and caching
  const [conversationData, setConversationData] = useState({
    sms: [],
    calls: [],
    emails: [],
    videos: [],
    loading: false,
    error: null,
  });

  // Dummy data - REMOVE THIS WHEN IMPLEMENTING REAL APIs
  const dummyData = {
    sms: [
      {
        id: "sms_1",
        type: "SMS",
        date: "2024-01-15",
        time: "10:30 AM",
        participants: ["David Johnson", contactName],
        messages: [
          {
            sender: "David Johnson",
            message:
              "Hi! I need a plumber for my kitchen sink. It's been leaking for days.",
            timestamp: "10:30 AM",
          },
          {
            sender: contactName,
            message:
              "Hello David! I can help you with that. When would be a good time for me to come take a look?",
            timestamp: "10:32 AM",
          },
          {
            sender: "David Johnson",
            message:
              "How about tomorrow afternoon? I work from home so I'm flexible.",
            timestamp: "10:35 AM",
          },
          {
            sender: contactName,
            message:
              "Perfect! I can be there around 2 PM. What's your address?",
            timestamp: "10:36 AM",
          },
          {
            sender: "David Johnson",
            message: "123 Oak Street, Apartment 4B. Thank you so much!",
            timestamp: "10:38 AM",
          },
        ],
      },
      {
        id: "sms_2",
        type: "SMS",
        date: "2024-01-20",
        time: "3:15 PM",
        participants: ["Janet Smith", contactName],
        messages: [
          {
            sender: "Janet Smith",
            message:
              "The water heater repair you did last week is working great! Thank you!",
            timestamp: "3:15 PM",
          },
          {
            sender: contactName,
            message:
              "That's wonderful to hear, Janet! I'm glad everything is working well.",
            timestamp: "3:18 PM",
          },
          {
            sender: "Janet Smith",
            message:
              "I'll definitely recommend you to my neighbors. Do you have business cards?",
            timestamp: "3:20 PM",
          },
          {
            sender: contactName,
            message:
              "Yes, I do! I'll drop some off next time I'm in your area.",
            timestamp: "3:22 PM",
          },
        ],
      },
    ],
    calls: [
      {
        id: "call_1",
        type: "Phone Call",
        date: "2024-01-18",
        time: "9:45 AM",
        duration: "12 minutes",
        contact: "John Martinez",
        direction: "incoming",
        summary:
          "Emergency call about burst pipe in basement. Scheduled immediate visit.",
      },
      {
        id: "call_2",
        type: "Phone Call",
        date: "2024-01-22",
        time: "2:30 PM",
        duration: "8 minutes",
        contact: "Sarah Wilson",
        direction: "outgoing",
        summary:
          "Follow-up call about bathroom renovation estimate. Customer approved the quote.",
      },
      {
        id: "call_3",
        type: "Phone Call",
        date: "2024-01-25",
        time: "11:15 AM",
        duration: "15 minutes",
        contact: "Michael Brown",
        direction: "incoming",
        summary:
          "Consultation about whole-house repiping. Scheduled site visit for detailed estimate.",
      },
    ],
    emails: [
      {
        id: "email_1",
        type: "Email",
        date: "2024-01-16",
        time: "4:20 PM",
        contact: "David Johnson",
        subject: "Kitchen Sink Repair - Invoice and Receipt",
        preview:
          "Thank you for choosing our plumbing services. Please find attached the invoice for the kitchen sink repair completed today...",
        thread: [
          {
            sender: contactName,
            subject: "Kitchen Sink Repair - Invoice and Receipt",
            content:
              "Dear David,\n\nThank you for choosing our plumbing services. Please find attached the invoice for the kitchen sink repair completed today. The total amount is $150.\n\nBest regards,\n" +
              contactName,
            timestamp: "4:20 PM",
          },
          {
            sender: "David Johnson",
            subject: "Re: Kitchen Sink Repair - Invoice and Receipt",
            content:
              "Thank you for the quick service! Payment has been sent via the link you provided. Everything looks great!",
            timestamp: "5:45 PM",
          },
        ],
      },
      {
        id: "email_2",
        type: "Email",
        date: "2024-01-23",
        time: "10:00 AM",
        contact: "Jennifer Davis",
        subject: "Bathroom Renovation Estimate Request",
        preview:
          "I hope this email finds you well. I am interested in getting an estimate for a complete bathroom renovation...",
        thread: [
          {
            sender: "Jennifer Davis",
            subject: "Bathroom Renovation Estimate Request",
            content:
              "Hello,\n\nI hope this email finds you well. I am interested in getting an estimate for a complete bathroom renovation including new fixtures, tiling, and plumbing updates. When would be a good time to schedule a consultation?\n\nBest regards,\nJennifer Davis",
            timestamp: "10:00 AM",
          },
        ],
      },
    ],
    videos: [
      {
        id: "video_1",
        type: "Video Call",
        date: "2024-01-19",
        time: "1:00 PM",
        duration: "25 minutes",
        contact: "Robert Taylor",
        title: "Remote Plumbing Consultation",
        transcript: [
          {
            speaker: contactName,
            text: "Good afternoon, Robert. Can you show me the area where you're experiencing the issue?",
            timestamp: "00:00",
          },
          {
            speaker: "Robert Taylor",
            text: "Yes, let me turn the camera around. It's this pipe under the kitchen sink.",
            timestamp: "00:15",
          },
          {
            speaker: contactName,
            text: "I can see there's some corrosion on the joint. That's likely where the leak is coming from.",
            timestamp: "00:45",
          },
          {
            speaker: "Robert Taylor",
            text: "Is this something I can fix myself or do I need a professional?",
            timestamp: "01:10",
          },
          {
            speaker: contactName,
            text: "Given the extent of the corrosion, I'd recommend professional repair. I can schedule a visit for tomorrow.",
            timestamp: "01:25",
          },
        ],
      },
      {
        id: "video_2",
        type: "Video Call",
        date: "2024-01-24",
        time: "3:30 PM",
        duration: "18 minutes",
        contact: "Lisa Anderson",
        title: "Virtual Estimate - Water Heater Replacement",
        transcript: [
          {
            speaker: contactName,
            text: "Hi Lisa, thanks for scheduling this virtual consultation. Can you show me your current water heater?",
            timestamp: "00:00",
          },
          {
            speaker: "Lisa Anderson",
            text: "Sure, it's right here in the garage. It's been making strange noises lately.",
            timestamp: "00:20",
          },
          {
            speaker: contactName,
            text: "I can see it's quite old. What's the model number on the label?",
            timestamp: "00:35",
          },
          {
            speaker: "Lisa Anderson",
            text: "It says AO Smith, model GCV-40. Manufactured in 2015.",
            timestamp: "00:50",
          },
          {
            speaker: contactName,
            text: "That's definitely due for replacement. I can provide you with a detailed estimate for a new energy-efficient model.",
            timestamp: "01:15",
          },
        ],
      },
    ],
  };

  // ====== API INTEGRATION POINT 2: DATA FETCHING ======
  // TODO: Implement useEffect to fetch conversation data on component mount and when contactId changes
  useEffect(() => {
    // Example API integration:
    /*
    const fetchConversations = async () => {
      setConversationData(prev => ({ ...prev, loading: true }));
      try {
        const [smsRes, callsRes, emailsRes, videosRes] = await Promise.all([
          fetch(`/api/conversations/sms/${contactId}`),
          fetch(`/api/conversations/calls/${contactId}`),
          fetch(`/api/conversations/emails/${contactId}`),
          fetch(`/api/conversations/videos/${contactId}`)
        ]);

        const sms = await smsRes.json();
        const calls = await callsRes.json();
        const emails = await emailsRes.json();
        const videos = await videosRes.json();

        setConversationData({
          sms,
          calls,
          emails,
          videos,
          loading: false,
          error: null
        });
      } catch (error) {
        setConversationData(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }));
      }
    };

    if (contactId) {
      fetchConversations();
    }
    */
  }, [contactId]);

  const tabData = [
    {
      label: "All",
      icon: <SearchIcon />,
      count: Object.values(dummyData).flat().length, // TODO: Replace with conversationData
    },
    { label: "SMS", icon: <SmsIcon />, count: dummyData.sms.length }, // TODO: Replace with conversationData.sms.length
    { label: "Calls", icon: <PhoneIcon />, count: dummyData.calls.length }, // TODO: Replace with conversationData.calls.length
    { label: "Emails", icon: <EmailIcon />, count: dummyData.emails.length }, // TODO: Replace with conversationData.emails.length
    {
      label: "Videos",
      icon: <VideoCallIcon />,
      count: dummyData.videos.length, // TODO: Replace with conversationData.videos.length
    },
  ];

  // ====== API INTEGRATION POINT 3: SEARCH AND FILTERING ======
  // TODO: Consider implementing server-side search for better performance with large datasets
  // API endpoint: GET /api/conversations/search?contactId={contactId}&query={searchQuery}&type={type}&startDate={start}&endDate={end}
  const filteredData = useMemo(() => {
    let data = [];

    // TODO: Replace dummyData with conversationData when implementing real APIs
    if (activeTab === 0) {
      data = [
        ...dummyData.sms,
        ...dummyData.calls,
        ...dummyData.emails,
        ...dummyData.videos,
      ];
    } else if (activeTab === 1) {
      data = dummyData.sms;
    } else if (activeTab === 2) {
      data = dummyData.calls;
    } else if (activeTab === 3) {
      data = dummyData.emails;
    } else if (activeTab === 4) {
      data = dummyData.videos;
    }

    // Apply search filter
    if (searchQuery) {
      data = data.filter((item) => {
        const searchLower = searchQuery.toLowerCase();
        if (item.messages) {
          return item.messages.some((msg) =>
            msg.message.toLowerCase().includes(searchLower)
          );
        }
        if (item.summary) {
          return item.summary.toLowerCase().includes(searchLower);
        }
        if (item.subject) {
          return item.subject.toLowerCase().includes(searchLower);
        }
        if (item.transcript) {
          return item.transcript.some((entry) =>
            entry.text.toLowerCase().includes(searchLower)
          );
        }
        return item.contact?.toLowerCase().includes(searchLower);
      });
    }

    // Apply date filter
    if (dateRange.start || dateRange.end) {
      data = data.filter((item) => {
        const itemDate = new Date(item.date);
        const startDate = dateRange.start ? new Date(dateRange.start) : null;
        const endDate = dateRange.end ? new Date(dateRange.end) : null;

        if (startDate && itemDate < startDate) return false;
        if (endDate && itemDate > endDate) return false;
        return true;
      });
    }

    return data.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [activeTab, searchQuery, dateRange]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const toggleExpanded = (id) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // ====== API INTEGRATION POINT 4: FILE DOWNLOAD ======
  // TODO: Implement real file download functionality
  // API endpoint: POST /api/conversations/download
  const handleDownload = async (item) => {
    try {
      // Example API call:
      /*
      const response = await fetch('/api/conversations/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: item.id,
          type: item.type,
          format: 'pdf' // or 'txt', 'json', etc.
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `conversation_${item.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
      */

      // Temporary toast message - remove when implementing real download
      toast.success(
        `Downloaded ${item.type} conversation with ${
          item.contact || item.participants?.[0]
        }`,
        {
          duration: 3000,
        }
      );
    } catch (error) {
      toast.error("Failed to download conversation");
    }
  };

  // ====== API INTEGRATION POINT 5: BULK DOWNLOAD ======
  // TODO: Implement bulk download functionality
  // API endpoint: POST /api/conversations/download-bulk
  const handleDownloadAll = async () => {
    try {
      // Example API call:
      /*
      const response = await fetch('/api/conversations/download-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactId,
          conversationIds: filteredData.map(item => item.id),
          format: 'zip'
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `conversations_${contactName}_${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
      */

      // Temporary toast message - remove when implementing real download
      toast.success(`Downloaded all ${filteredData.length} conversations`, {
        duration: 3000,
      });
    } catch (error) {
      toast.error("Failed to download conversations");
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "SMS":
        return <SmsIcon />;
      case "Phone Call":
        return <PhoneIcon />;
      case "Email":
        return <EmailIcon />;
      case "Video Call":
        return <VideoCallIcon />;
      default:
        return <SearchIcon />;
    }
  };

  const renderSMSItem = (item) => (
    <Card
      key={item.id}
      sx={{ mb: 2, border: "1px solid", borderColor: "grey.200" }}
    >
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Avatar sx={{ bgcolor: "info.main", width: 32, height: 32 }}>
              <SmsIcon sx={{ fontSize: 18 }} />
            </Avatar>
            <Box>
              <Typography variant="subtitle2" fontWeight={600}>
                SMS with {item.participants[0]}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {item.date} at {item.time}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton size="small" onClick={() => handleDownload(item)}>
              <DownloadIcon />
            </IconButton>
            <IconButton size="small" onClick={() => toggleExpanded(item.id)}>
              {expandedItems[item.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {item.messages.length} messages
        </Typography>

        <Collapse in={expandedItems[item.id]}>
          <Box sx={{ mt: 2, maxHeight: 300, overflowY: "auto" }}>
            {item.messages.map((msg, idx) => (
              <Box
                key={idx}
                sx={{
                  mb: 2,
                  p: 1.5,
                  bgcolor:
                    msg.sender === contactName ? "primary.50" : "grey.50",
                  borderRadius: 2,
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={600}
                >
                  {msg.sender} • {msg.timestamp}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {msg.message}
                </Typography>
              </Box>
            ))}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );

  const renderCallItem = (item) => (
    <Card
      key={item.id}
      sx={{ mb: 2, border: "1px solid", borderColor: "grey.200" }}
    >
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Avatar sx={{ bgcolor: "primary.main", width: 32, height: 32 }}>
              <PhoneIcon sx={{ fontSize: 18 }} />
            </Avatar>
            <Box>
              <Typography variant="subtitle2" fontWeight={600}>
                {item.direction === "incoming" ? "Incoming" : "Outgoing"} call
                with {item.contact}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {item.date} at {item.time} • {item.duration}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton size="small" onClick={() => handleDownload(item)}>
              <DownloadIcon />
            </IconButton>
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary">
          {item.summary}
        </Typography>
      </CardContent>
    </Card>
  );

  const renderEmailItem = (item) => (
    <Card
      key={item.id}
      sx={{ mb: 2, border: "1px solid", borderColor: "grey.200" }}
    >
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Avatar sx={{ bgcolor: "secondary.main", width: 32, height: 32 }}>
              <EmailIcon sx={{ fontSize: 18 }} />
            </Avatar>
            <Box>
              <Typography variant="subtitle2" fontWeight={600}>
                Email with {item.contact}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {item.date} at {item.time}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton size="small" onClick={() => handleDownload(item)}>
              <DownloadIcon />
            </IconButton>
            <IconButton size="small" onClick={() => toggleExpanded(item.id)}>
              {expandedItems[item.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>

        <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
          {item.subject}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {item.preview}
        </Typography>

        <Collapse in={expandedItems[item.id]}>
          <Box sx={{ mt: 2, maxHeight: 300, overflowY: "auto" }}>
            {item.thread.map((email, idx) => (
              <Box
                key={idx}
                sx={{ mb: 2, p: 1.5, bgcolor: "grey.50", borderRadius: 2 }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={600}
                >
                  From: {email.sender} • {email.timestamp}
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  sx={{ mt: 0.5, mb: 1 }}
                >
                  {email.subject}
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                  {email.content}
                </Typography>
              </Box>
            ))}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );

  const renderVideoItem = (item) => (
    <Card
      key={item.id}
      sx={{ mb: 2, border: "1px solid", borderColor: "grey.200" }}
    >
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Avatar sx={{ bgcolor: "success.main", width: 32, height: 32 }}>
              <VideoCallIcon sx={{ fontSize: 18 }} />
            </Avatar>
            <Box>
              <Typography variant="subtitle2" fontWeight={600}>
                {item.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {item.date} at {item.time} • {item.duration} with {item.contact}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton size="small" onClick={() => handleDownload(item)}>
              <DownloadIcon />
            </IconButton>
            <IconButton size="small" onClick={() => toggleExpanded(item.id)}>
              {expandedItems[item.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Video transcript available
        </Typography>

        <Collapse in={expandedItems[item.id]}>
          <Box sx={{ mt: 2, maxHeight: 300, overflowY: "auto" }}>
            {item.transcript.map((entry, idx) => (
              <Box
                key={idx}
                sx={{
                  mb: 2,
                  p: 1.5,
                  bgcolor:
                    entry.speaker === contactName ? "primary.50" : "grey.50",
                  borderRadius: 2,
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={600}
                >
                  {entry.speaker} • {entry.timestamp}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {entry.text}
                </Typography>
              </Box>
            ))}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );

  const renderItem = (item) => {
    switch (item.type) {
      case "SMS":
        return renderSMSItem(item);
      case "Phone Call":
        return renderCallItem(item);
      case "Email":
        return renderEmailItem(item);
      case "Video Call":
        return renderVideoItem(item);
      default:
        return null;
    }
  };

  return (
    <Box>
      {/* ====== ADDED: Page Header ====== */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={600}>
          Conversation History
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          View all communication history with {contactName}
        </Typography>
      </Box>

      {/* Header with Search and Actions */}
      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 2,
            mb: 2,
          }}
        >
          <TextField
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ flex: 1 }}
          />
          <Button
            variant="outlined"
            startIcon={<DateRangeIcon />}
            onClick={() => setShowDateFilter(!showDateFilter)}
          >
            Date Filter
          </Button>
          <Button
            variant="contained"
            startIcon={<GetAppIcon />}
            onClick={handleDownloadAll}
            disabled={filteredData.length === 0}
          >
            Download All
          </Button>
        </Box>

        {/* Date Range Filter */}
        <Collapse in={showDateFilter}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Start Date"
                  type="date"
                  value={dateRange.start}
                  onChange={(e) =>
                    setDateRange((prev) => ({ ...prev, start: e.target.value }))
                  }
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="End Date"
                  type="date"
                  value={dateRange.end}
                  onChange={(e) =>
                    setDateRange((prev) => ({ ...prev, end: e.target.value }))
                  }
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button
                  variant="outlined"
                  onClick={() => setDateRange({ start: "", end: "" })}
                  fullWidth
                >
                  Clear Filter
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Collapse>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 4 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          {tabData.map((tab, index) => (
            <Tab
              key={index}
              icon={tab.icon}
              label={
                <Badge
                  badgeContent={tab.count}
                  color="primary"
                  sx={{ "& .MuiBadge-badge": { right: -6, top: -8 } }}
                >
                  {tab.label}
                </Badge>
              }
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Box>

      {/* Conversation List */}
      <Box>
        {/* TODO: Add loading state when conversationData.loading is true */}
        {/* TODO: Add error state when conversationData.error exists */}
        {filteredData.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No conversations found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchQuery || dateRange.start || dateRange.end
                ? "Try adjusting your search or date filters"
                : "No communication history available for this contact"}
            </Typography>
          </Paper>
        ) : (
          filteredData.map(renderItem)
        )}
      </Box>
    </Box>
  );
};

export default ConversationHistory;
