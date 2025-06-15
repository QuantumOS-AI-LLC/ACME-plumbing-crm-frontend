import React, { useState, useEffect, useRef, useCallback } from "react";
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
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { fetchContacts } from "../services/api";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/common/PageHeader";
import CreateContactModalForm from "../components/contacts/CreateContactModalForm";

const ContactsPage = () => {
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    totalPages: 1,
    totalItems: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const navigate = useNavigate();

  const abortControllerRef = useRef(null);
  const searchAbortControllerRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  const pages = [...Array(pagination.totalPages).keys()];

  const loadContacts = useCallback(
    async (pageNumber = 1, search = "") => {
      try {
        setError(null);
        if (search) {
          setSearchLoading(true);
          setIsSearching(true);
        } else {
          setLoading(true);
          setIsSearching(false);
        }

        const params = {
          page: pageNumber,
          limit: pagination.limit,
        };

        if (search.trim()) {
          params.search = search.trim();
        }

        const response = await fetchContacts(params);

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
        setSearchLoading(false);
      }
    },
    [pagination.limit]
  );

  useEffect(() => {
    if (!isSearching) {
      loadContacts(pagination.page);
    }
  }, [pagination.page, isSearching, loadContacts]);

  useEffect(() => {
    // debounce search
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (searchTerm.trim() === "") {
      setIsSearching(false);
      if (contacts.length > 0) {
        setFilteredContacts(contacts);
      } else {
        loadContacts(1);
      }
    } else {
      searchTimeoutRef.current = setTimeout(() => {
        loadContacts(1, searchTerm);
      }, 300);
    }

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchTerm, loadContacts]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (searchAbortControllerRef.current)
        searchAbortControllerRef.current.abort();
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

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
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleContactCreated = (newContact) => {
    // Introduce a small delay to allow the backend to fully process and index the new contact
    // before reloading contacts to ensure accurate pagination information.
    setTimeout(() => {
      loadContacts(1); // Load the first page to ensure the new contact is visible immediately.
    }, 1000); // 1000ms delay, adjust as needed
  };

  const handlePageChange = (newPage) => {
    if (
      loading ||
      searchLoading ||
      newPage === pagination.page ||
      newPage < 1 ||
      newPage > pagination.totalPages
    ) {
      return;
    }
    setPagination((prev) => ({ ...prev, page: newPage }));
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

      {loading || searchLoading ? (
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
            onClick={() => loadContacts(pagination.page, searchTerm)}
          >
            Retry
          </Button>
        </Box>
      ) : filteredContacts.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="body1">
            {searchTerm
              ? "No contacts match your search."
              : "No contacts found."}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredContacts.map((contact) => (
            <Grid item xs={12} sm={6} md={4} key={contact.id}>
              <Card
                sx={{
                  cursor: "pointer",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  height: "100%",
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
          ))}
        </Grid>
      )}

      {/* Pagination */}
      <Box sx={{ textAlign: "center", mt: 4 }}>
        <Button
          variant="outlined"
          onClick={() => handlePageChange(pagination.page - 1)}
          disabled={pagination.page === 1 || loading || searchLoading}
          sx={{ px: 1, mr: 0.5, minWidth: "32px" }}
        >
          <ChevronLeftIcon />
        </Button>

        {pages.map((page) => (
          <Button
            key={page}
            variant={pagination.page === page + 1 ? "contained" : "outlined"}
            onClick={() => handlePageChange(page + 1)}
            disabled={pagination.page === page + 1 || loading || searchLoading}
            sx={{ px: 1, mx: 0.5, minWidth: "32px" }}
          >
            {page + 1}
          </Button>
        ))}

        <Button
          variant="outlined"
          onClick={() => handlePageChange(pagination.page + 1)}
          disabled={
            pagination.page === pagination.totalPages ||
            loading ||
            searchLoading
          }
          sx={{ px: 1, ml: 0.5, minWidth: "32px" }}
        >
          <ChevronRightIcon />
        </Button>
      </Box>

      <CreateContactModalForm
        open={openModal}
        onClose={handleCloseModal}
        onContactCreated={handleContactCreated}
      />
    </Box>
  );
};

export default ContactsPage;
