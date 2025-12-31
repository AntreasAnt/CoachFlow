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
  // Calculate extra height based on error or success message presence
  const extraHeight = error || successMessage ? 58 : 0;
  // Local function to determine badge color based on role
  const getRoleBadgeColor = (role) => {
    const r = String(role).toLowerCase();
    switch (r) {
      case '1':
      case 'admin':
        return "danger";
      case '2':
      case 'manager':
        return "warning";
      case '3':
      case 'trainer':
        return "success";
      case '4':
      case 'trainee':
        return "primary";
      default:
        return "secondary";
    }
  };
  const getRoleLabel = (role) => {
    // Normalize role to string for mapping
    const r = String(role).toLowerCase();
    switch (r) {
      case '1':
      case 'admin':
        return 'Admin';
      case '2':
      case 'manager':
        return 'Manager';
      case '3':
      case 'trainer':
        return 'Trainer';
      case '4':
      case 'trainee':
        return 'Trainee';
      default:
        return 'User';
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
  headerName: "Username",
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
  headerName: "Role",
      width: 100,
      renderCell: (params) => (
        <span className={`badge bg-${getRoleBadgeColor(params.row.role)}`}>
          {getRoleLabel(params.row.role)}
        </span>
      ),
    },
    {
      field: "lastlogin",
  headerName: "Last Login",
      width: 150,
      renderCell: (params) => (
        <span title={new Date(params.value * 1000).toLocaleString()}>
          {getTimeElapsed(params.value)}
        </span>
      ),
    },
    {
      field: "registrationdate",
  headerName: "Registered",
      width: 100,
      renderCell: (params) => (
        <span title={new Date(params.value * 1000).toLocaleString()}>
          {formatDate(params.value)}
        </span>
      ),
    },
    {
      field: "user_self_tracking",
  headerName: "User Tracking",
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
            View
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
            labelRowsPerPage: "Rows per page",
            labelDisplayedRows: ({ from, to, count }) =>
              `${from} - ${to} of ${count}`,
          },
          noRowsLabel: "No data found",
          errorOverlayDefaultLabel: "Error loading data",
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
