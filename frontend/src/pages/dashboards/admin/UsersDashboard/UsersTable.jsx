import React from "react";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import defaultAvatar from "../../../../assets/images/default-avatar.png";
import { API_BASE_URL } from '../../../../config/config';
// Derive images base URL (adjust folder if backend serves images elsewhere)
const BACKEND_IMAGES_URL = `${API_BASE_URL}/backend/public/images/`;
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
      field: "full_name",
      headerName: "Name",
      width: 200,
      renderCell: (params) => params.row.full_name || params.row.name || '—',
    },
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
  ];

  return (
    <Paper
      sx={{
        height: `calc(100vh - ${250 + extraHeight}px)`,
        width: "100%",
        minHeight: "200px !important",
        backgroundColor: "#2d2d2d !important",
        border: "1px solid rgba(16, 185, 129, 0.2)",
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: "none !important",
      }}
    >
      <DataGrid
        rows={users}
        columns={columns.map((col) => ({
          ...col,
          sortable: false,
          filterable: false,
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
        disableColumnMenu
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
          backgroundColor: "#2d2d2d !important",
          color: "#fff",
          "--DataGrid-rowBorderColor": "rgba(16, 185, 129, 0.1) !important",
          ".MuiDataGrid-main": {
            maxHeight: "none !important",
          },
          ".MuiDataGrid-overlayWrapper": {
            backgroundColor: "#2d2d2d !important",
          },
          ".MuiDataGrid-overlay": {
            backgroundColor: "#2d2d2d !important",
            color: "#9ca3af !important",
          },
          ".MuiDataGrid-cell": {
            borderColor: "rgba(16, 185, 129, 0.1)",
            color: "#fff",
          },
          ".MuiDataGrid-columnHeaders": {
            backgroundColor: "#1a1a1a !important",
            color: "#fff !important",
            borderColor: "rgba(16, 185, 129, 0.2) !important",
            borderBottom: "1px solid rgba(16, 185, 129, 0.2) !important",
          },
          ".MuiDataGrid-columnHeader": {
            backgroundColor: "#1a1a1a !important",
            color: "#fff !important",
            borderBottom: "none !important",
          },
          ".MuiDataGrid-columnHeadersInner": {
            backgroundColor: "#1a1a1a !important",
          },
          ".MuiDataGrid-columnHeaderTitle": {
            color: "#fff !important",
            fontWeight: 600,
          },
          ".MuiDataGrid-columnHeaderTitleContainer": {
            color: "#fff !important",
          },
          ".MuiDataGrid-row--borderBottom .MuiDataGrid-columnHeader": {
            borderBottom: "none !important",
          },
          ".MuiDataGrid-row--borderBottom .MuiDataGrid-filler": {
            borderBottom: "none !important",
            backgroundColor: "#1a1a1a !important",
          },
          ".MuiDataGrid-row--borderBottom .MuiDataGrid-scrollbarFiller": {
            borderBottom: "none !important",
            backgroundColor: "#1a1a1a !important",
          },
          ".MuiDataGrid-row": {
            backgroundColor: "#2d2d2d",
            borderTop: "none !important",
            "&:hover": {
              backgroundColor: "rgba(16, 185, 129, 0.1)",
            },
            "&:first-of-type": {
              borderTop: "none !important",
            },
          },
          ".MuiDataGrid-footerContainer": {
            backgroundColor: "#1a1a1a",
            borderColor: "rgba(16, 185, 129, 0.2)",
            color: "#fff",
          },
          ".MuiTablePagination-root": {
            color: "#fff",
          },
          ".MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows": {
            color: "#9ca3af",
          },
          ".MuiTablePagination-select": {
            color: "#fff",
          },
          ".MuiTablePagination-selectIcon": {
            color: "#10b981",
          },
          ".MuiIconButton-root": {
            color: "#10b981",
          },
          ".Mui-disabled": {
            color: "#6b7280 !important",
          },
          ".Mui-disabled-user": {
            backgroundColor: "rgba(107, 114, 128, 0.2)",
            color: "#6b7280",
          },
          ".MuiDataGrid-columnSeparator": {
            color: "rgba(16, 185, 129, 0.1)",
          },
          ".MuiCircularProgress-root": {
            color: "#10b981",
          },
          ".MuiDataGrid-filler": {
            backgroundColor: "#1a1a1a !important",
          },
          ".MuiDataGrid-scrollbar": {
            backgroundColor: "#2d2d2d !important",
          },
          ".MuiDataGrid-scrollbarFiller": {
            backgroundColor: "#1a1a1a !important",
          },
          ".MuiDataGrid-virtualScroller": {
            backgroundColor: "#2d2d2d !important",
          },
          ".MuiDataGrid-virtualScrollerContent": {
            backgroundColor: "#2d2d2d !important",
          },
          ".MuiDataGrid-virtualScrollerRenderZone": {
            backgroundColor: "#2d2d2d !important",
          },
        }}
        pagination
      />
    </Paper>
  );
};
