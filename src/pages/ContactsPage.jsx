import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  TextField,
  InputAdornment,
  Chip,
  Button,
  CircularProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { fetchContacts } from "../services/api";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/common/PageHeader";

const ContactsPage = () => {
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 120,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const pages = [...Array(pagination.totalPages).keys()];

  useEffect(() => {
    const loadContacts = async () => {
      try {
        setLoading(true);
        const response = await fetchContacts({
          page: pagination.page,
          limit: pagination.limit,
        });
        console.log("get all contacts", response);
        if (response && response.data) {
          setContacts(response.data);
          setFilteredContacts(response.data);
          setPagination({
            page: response.pagination.page,
            limit: response.pagination.limit,
            totalPages: response.pagination.pages,
            totalItems: response.pagination.total,
          });
        }
      } catch (error) {
        console.error("Error loading contacts:", error);
        setError("Failed to load contacts. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadContacts();
  }, [pagination.page]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredContacts(contacts);
    } else {
      const filtered = contacts.filter((contact) => {
        const searchTermLower = searchTerm.toLowerCase();
        return (
          (contact.name &&
            contact.name.toLowerCase().includes(searchTermLower)) ||
          (contact.email &&
            contact.email.toLowerCase().includes(searchTermLower)) ||
          (contact.phone && contact.phone.includes(searchTerm))
        );
      });
      setFilteredContacts(filtered);
    }
  }, [searchTerm, contacts]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handleAddContact = () => {
    // Implement the add contact functionality
    console.log("Add contact clicked");
  };

  //for pagination
  const handlePageChange = (newPage) => {
    if (newPage !== pagination.page) {
      setPagination((prevState) => ({
        ...prevState,
        page: newPage,
      }));
    }
  };

  return (
    <Box>
      <PageHeader
        title="Contacts"
        action={true}
        actionText="Add Contact"
        onAction={handleAddContact}
      />

      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          placeholder="Search contacts by name, email, or phone"
          value={searchTerm}
          onChange={handleSearch}
          variant="outlined"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ bgcolor: "background.paper", borderRadius: 1 }}
        />
      </Box>

      {loading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: 200,
          }}
        >
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ textAlign: "center", py: 3 }}>
          <Typography color="error">{error}</Typography>
          <Button
            variant="outlined"
            color="primary"
            sx={{ mt: 2 }}
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredContacts.length === 0 ? (
            <Grid item xs={12}>
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography variant="body1">
                  {searchTerm
                    ? "No contacts match your search."
                    : "No contacts found."}
                </Typography>
              </Box>
            </Grid>
          ) : (
            filteredContacts.map((contact) => (
              <Grid item xs={12} sm={6} md={4} key={contact.id}>
                <Card
                  sx={{
                    cursor: "pointer",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: 3,
                    },
                  }}
                  onClick={() => navigate(`/contacts/${contact.id}`)}
                >
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: "primary.main",
                          width: 50,
                          height: 50,
                          mr: 2,
                        }}
                      >
                        {getInitials(contact.name)}
                      </Avatar>
                      <Box>
                        <Typography variant="h6">{contact.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {contact.type || "Contact"}
                        </Typography>
                      </Box>
                    </Box>

                    {contact.tags && contact.tags.length > 0 && (
                      <Box
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 1,
                          mt: 2,
                        }}
                      >
                        {contact.tags.map((tag, index) => (
                          <Chip
                            key={index}
                            label={tag}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}

      {/* pagination controller */}

      <Box sx={{ textAlign: "center", mt: 4 }}>
        <Button
          variant="outlined"
          onClick={() => handlePageChange(pagination.page - 1)}
          disabled={pagination.page === 1}
        >
          Previous
        </Button>

        {pages.map((page) => (
          <Button
            key={page}
            variant="outlined"
            onClick={() => handlePageChange(page + 1)}
            disabled={pagination.page === page + 1}
            sx={{ mx: 1 }}
          >
            {page + 1}
          </Button>
        ))}

        <Button
          variant="outlined"
          onClick={() => handlePageChange(pagination.page + 1)}
          disabled={pagination.page === pagination.totalPages}
        >
          Next
        </Button>
      </Box>
    </Box>
  );
};

export default ContactsPage;
