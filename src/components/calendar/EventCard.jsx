import React from "react";
import { Box, Typography, IconButton, Card, CardContent } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import LocationOnIcon from "@mui/icons-material/LocationOn";

const EventCard = ({ event, onEdit }) => {
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    if (onEdit) onEdit(event);
  };

  return (
    <Card
      sx={{
        display: "flex",
        flexDirection: "column",
        position: "relative",
        backgroundColor: "#F8F9FA",
        borderRadius: 2,
        boxShadow: "0 3px 8px rgba(0,0,0,0.1)",
        transition: "all 0.2s ease",
        "&:hover": {
          boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
          transform: "translateY(-3px)",
          "& .edit-button": {
            opacity: 1,
          },
        },
      }}
    >
      <CardContent
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          p: 2,
          "&:last-child": { pb: 2 },
        }}
      >
        {/* Edit button */}
        <IconButton
          className="edit-button"
          size="small"
          onClick={handleEdit}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            opacity: 0,
            transition: "opacity 0.2s ease",
            color: "#9d4ee9",
            bgcolor: "rgba(255, 255, 255, 0.9)",
            "&:hover": {
              bgcolor: "rgba(255, 255, 255, 1)",
              color: "primary.dark",
            },
          }}
          aria-label="Edit event"
        >
          <EditIcon fontSize="small" />
        </IconButton>

        {/* Event title */}
        <Typography
          variant="h6"
          sx={{
            fontSize: "1rem",
            fontWeight: 600,
            mb: 1,
            lineHeight: 1.2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {event.title}
        </Typography>

        {/* Time */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 1, fontWeight: 500 }}
        >
          {formatTime(event.start)} - {formatTime(event.end)}
        </Typography>

        {/* Location */}
        {event.location && (
          <Typography
            variant="body2"
            sx={{
              display: "flex",
              alignItems: "center",
              mb: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            <LocationOnIcon
              sx={{ fontSize: 16, mr: 0.5, color: "text.secondary" }}
            />{" "}
            {event.location}
          </Typography>
        )}

        {/* Description */}
        {event.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical",
              lineHeight: 1.4,
            }}
          >
            {event.description}
          </Typography>
        )}

        {/* Event type badge */}
        <Box sx={{ mt: "auto", pt: 1 }}>
          <Typography
            variant="caption"
            sx={{
              textTransform: "capitalize",
              bgcolor: "primary.light",
              color: "white",
              px: 1,
              py: 0.5,
              borderRadius: 1,
              fontSize: "0.75rem",
            }}
          >
            {event.eventType}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default EventCard;
