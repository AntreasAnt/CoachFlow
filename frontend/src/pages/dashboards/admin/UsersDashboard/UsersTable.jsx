import React from "react";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import defaultAvatar from "../../../../assets/images/default-avatar.png";
import { API_BASE_URL } from '../../../../config/config';
// Derive images base URL (adjust folder if backend serves images elsewhere)
const BACKEND_IMAGES_URL = `${API_BASE_URL}/backend/public/images/`;
import TrackUsersModal from "./TrackUsersModal";
import { BACKEND_ROUTES_API } from '../../../../config/config';
// Props destructuring in the component definition 
//Makes it clear what props the component expects
// isLoading instead of props.isLoading
export const UsersTable = ({
  users,
  isLoading,
  selectedUsers,
  setSelectedUsers,
  error,
  successMessage,
  totalUsers,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  setShowTrackedUsersModal,
}) => {
  // Υπολογίστε το επιπλέον ύψος βάσει της παρουσίας μηνύματος σφάλματος ή επιτυχίας
  const extraHeight = error || successMessage ? 58 : 0;
  // Τοπική συνάρτηση για να καθορίσει το χρώμα της σήμανσης βάσει του ρόλου
  const getRoleBadgeColor = (role) => {
    switch (parseInt(role)) {
      case 1:
        return "danger";
      case 2:
        return "warning";
      case 3:
        return "success";
      default:
        return "primary";
    }
  };
  const getRoleLabel = (role) => {
    switch (parseInt(role)) {
      case 1:
        return "Επικεφαλής";
      case 2:
        return "Διαχειριστής";
      case 3:
        return "Χρήστης";
      default:
        return "Άγνωστο";
    }
  };

  // Add this function at the top of your file, after the imports
  const getTimeElapsed = (timestamp) => {
    if (!timestamp) return "Never";

    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;

    const years = Math.floor(diff / (365 * 24 * 60 * 60));
    const days = Math.floor((diff % (365 * 24 * 60 * 60)) / (24 * 60 * 60));
    const hours = Math.floor((diff % (24 * 60 * 60)) / (60 * 60));

    if (years > 0) {
      return `${years}y ${days}d ago`;
    } else if (days > 0) {
      return `${days}d ${hours}h ago`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else {
      return "Just now";
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Never";
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString("el-GR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const columns = [
    {
      field: "__check",
      headerName: "",
      width: 50,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderHeader: () => (
        <input
          type="checkbox"
          className="form-check-input"
          checked={users.length > 0 && selectedUsers.length === users.length}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedUsers(users.map((user) => user.id));
            } else {
              setSelectedUsers([]);
            }
          }}
        />
      ),
      renderCell: (params) => (
        <input
          type="checkbox"
          className="form-check-input"
          checked={selectedUsers.includes(params.row.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedUsers([...selectedUsers, params.row.id]);
            } else {
              setSelectedUsers(
                selectedUsers.filter((id) => id !== params.row.id)
              );
            }
          }}
        />
      ),
    },
    { field: "id", headerName: "ID", width: 70 },
    {
      field: "username",
      headerName: "Όνομα Χρήστη",
      width: 220,
      renderCell: (params) => (
        <div className="d-flex align-items-center">
          <img
            src={
              params.row.image
                ? BACKEND_IMAGES_URL + params.row.image
                : defaultAvatar
            }
            alt=""
            className="rounded-circle me-2"
            style={{ width: "32px", height: "32px", objectFit: "cover" }}
          />
          <span>{params.row.username}</span>
        </div>
      ),
    },
    {
      field: "email",
      headerName: "Email",
      width: 200,
    },
    {
      field: "role",
      headerName: "Ρόλος",
      width: 100,
      renderCell: (params) => (
        <span className={`badge bg-${getRoleBadgeColor(params.row.role)}`}>
          {getRoleLabel(params.row.role)}
        </span>
      ),
    },
    {
      field: "lastlogin",
      headerName: "Τελευταία Σύνδεση",
      width: 150,
      renderCell: (params) => (
        <span title={new Date(params.value * 1000).toLocaleString()}>
          {getTimeElapsed(params.value)}
        </span>
      ),
    },
    {
      field: "registrationdate",
      headerName: "Εγγραφή",
      width: 100,
      renderCell: (params) => (
        <span title={new Date(params.value * 1000).toLocaleString()}>
          {formatDate(params.value)}
        </span>
      ),
    },
    {
      field: "user_self_tracking",
      headerName: "Παρακολούθηση Χρήστη",
      width: 150,
      renderCell: (params) => {
        const { trackmyself, trackothers } = params.row;
        // Hide button if there's no tracking data
        if (!trackmyself && !trackothers) return null;
        return (
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedUsers([params.row]);
              setShowTrackedUsersModal(true);
            }}
          >
            <i className="bi bi-eye-fill me-1"></i>
            Προβολή
          </button>
        );
      },
    },
  ];

  return (
    <Paper
      sx={{
        height: `calc(100vh - ${250 + extraHeight}px)`,
        width: "100%",
        minHeight: "200px !important",
      }}
    >
      <DataGrid
        rows={users}
        columns={columns.map((col) => ({
          ...col,
          sortable: false, // Disables sorting on each column
          filterable: false, // Disables filtering on each column
        }))}
        loading={isLoading}
        paginationMode="server"
        rowCount={totalUsers}
        paginationModel={{
          page: page - 1,
          pageSize: pageSize,
        }}
        onPaginationModelChange={({ page, pageSize }) => {
          onPageSizeChange(pageSize);
          onPageChange(page + 1);
        }}
        disableColumnMenu // Removes the column menu (filter & sort actions)
        rowsPerPageOptions={[25, 50, 100]}
        getRowId={(row) => row.id || `temp-${Math.random()}`}
        getRowClassName={(params) =>
          params.row.isdisabled === 1 ? "Mui-disabled-user" : ""
        }
        localeText={{
          MuiTablePagination: {
            labelRowsPerPage: "Γραμμές ανά σελίδα",
            labelDisplayedRows: ({ from, to, count }) =>
              `${from} - ${to} από ${count}`,
          },
          noRowsLabel: "Δεν βρέθηκαν δεδομένα",
          errorOverlayDefaultLabel: "Σφάλμα κατά την ανάκτηση δεδομένων",
        }}
        disableRowSelectionOnClick
        sx={{
          border: 0,
          height: "100%",
          ".MuiDataGrid-main": {
            maxHeight: "none !important",
          },
          ".Mui-disabled-user": {
            backgroundColor: "#f5f5f5",
            color: "#9e9e9e",
          },
        }}
        pagination
      />
    </Paper>
  );
};
