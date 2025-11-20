/**
 * UsersDashBoard Component
 *
 * Displays users and information and provides functionality managing users
 * - Delete User
 * - Add User
 * - Search User
 * - Filter User by Role
 * - Edit User
 * - Update User
 */

import { BACKEND_ROUTES_API } from '../../../../config/config';

import React, { useState, useEffect } from "react";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import AdminSidebar from "../../../../components/AdminSideBar";
import defaultAvatar from "../../../../assets/images/default-avatar.png";
import { GeneratePDF } from "./GeneratePdf";
import { AddUserModal } from "./AddUserModal";
import { DeleteModal } from "./DeleteModal";
import { EditUserModal } from "./EditUserModal";
import { UsersTable } from "./UsersTable";
import { saveUser } from "./SaveUser";
import { updateUser } from "./UpdateUser";
import { confirmDeleteUser } from "./DeleteUser";
import ActionsModal from "./ActionsModal";
import { forceReset } from "./ForceReset";
import { userDisable } from "./UserDisable";
import { userEnable } from "./UserEnable";
import { Search } from './Search';
import {RoleSearch} from './RoleSearch';
import  TrackUsersModal  from "./TrackUsersModal";

function UsersDashboard() {
  const [users, setUsers] = useState([]); //Users Info

  const [totalUsers, setTotalUsers] = useState(0);

  const [page, setPage] = useState(1);

  const [pageSize, setPageSize] = useState(25);

  const [isLoading, setIsLoading] = useState(true); //Loading state for button

  const [selectedUsers, setSelectedUsers] = useState([]); //Selected users

  const [showAddModal, setShowAddModal] = useState(false); //Add modal
  const [showDeleteModal, setShowDeleteModal] = useState(false); //Delete modal
  const [showEditModal, setShowEditModal] = useState(false); //Edit modal

  const [saveSuccess, setSaveSuccess] = useState(false); //Save success message

  const [resetSuccess, setResetSuccess] = useState(false); //Reset success message

  const [disableSuccess, setDisableSuccess] = useState(false); //Disable success message
  
  const [enableSuccess, setEnableSuccess] = useState(false); // Enable success message

  const [roleFilter, setRoleFilter] = useState(""); //Role filter

  const [originalFormData, setOriginalFormData] = useState({}); // Store original form data for when editing data(help us know what fields have been modified)

  const [showActionsModal, setShowActionsModal] = useState(false); //Actions modal

  const [pagination, setPagination] = useState({ page: 1, pageSize: 25 });

  const [searchQuery, setSearchQuery] = useState('');
  
  const [roleSearch,setroleSearch] = useState(''); // State to store the selected role for filtering

  const [  showTrackedUsersModal, setShowTrackedUsersModal] = useState(false); // State to control the visibility of the tracking modal
  // Function to handle opening the actions modal
const handleOpenActionsModal = () => {
  if (selectedUsers.length === 0) {
    setError("Παρακαλώ επιλέξτε έναν χρήστη για ενέργειες.");
    setTimeout(() => {
      setError(null);
    }, 5000);
  } else {
    setShowActionsModal(true);
  }
};

// Function to handle closing the actions modal
const handleCloseActionsModal = () => {
  setShowActionsModal(false);
};
const handleSearch = (query) => {
  setSearchQuery(query);
  setPage(1); // Reset to first page when searching
};
const handleRoleSearch = (role) => {
  setroleSearch(role);
  setPage(1); // Reset to first page when filtering by role
};
  // Placeholder handlers for disable and force reset actions.
  const handleDisable = async () => {
    if (selectedUsers.length === 0) {
      setError("Παρακαλώ επιλέξτε έναν χρήστη για να τον απενεργοποιήσετε.");
      setTimeout(() => setError(null), 5000);
      return;
    }
    await userDisable({
      selectedUsers,
      setError,
      setShowActionsModal,
      setDisableSuccess,
      setUsers
      
    });


  };

  const handleEnable = async () => {
    if (selectedUsers.length === 0) {
      setError("Παρακαλώ επιλέξτε έναν χρήστη για να τον ενεργοποιήσετε.");
      setTimeout(() => setError(null), 5000);
      return;
    }
    await userEnable({
      selectedUsers,
      setError,
      setShowActionsModal,
      setEnableSuccess,
      setUsers
      
    });
  }
  const handleForceReset = async () => {
    if (selectedUsers.length === 0) {
      setError("Παρακαλώ επιλέξτε έναν χρήστη για επαναφορά κωδικού.");
      setTimeout(() => setError(null), 5000);
      return;
    }
  
    await forceReset({
      selectedUsers,
      setError,
      setShowActionsModal,
      setResetSuccess,
      
    });
  };

  //Closes Add Modal
  const handleCloseModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    //clear form data
    setFormData({
      username: "",
      email: "",
      password: "",
      role: "3",
      lastlogin: "",
      registrationdate: "",
    });
    setErrors({
      username: "",
      email: "",
      password: "",
      confpassword: "",
      role: "",
    });
    setError(null);
  };


  //Change Handler for form inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  
    // Clear error message for the specific field when it changes
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  
    // If password is changed, also clear confirm password error
    if (name === "password" && errors.confpassword) {
      setErrors((prev) => ({
        ...prev,
        confpassword: "",
      }));
    }
  
    // Clear general error message when any field changes
    if (error) {
      setError(null);
    }
  };

    // State to handle form submission loading state
    const [isSubmitting, setIsSubmitting] = useState(false);
  //SIGN UP INFO
  // Initialize form state with empty values
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "3",
  });

  //General Error
  const [error, setError] = useState(null); //Error message

  // Initialize error state for form validation
  const [errors, setErrors] = useState({
    username: "",
    email: "",
    password: "",
    confpassword: "",
    countrycode: "",
    role: "",

  });

  //Fetch Users On page load
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        console.log("Role Search:", roleSearch);
        setIsLoading(true);
        const response = await fetch(
          `${BACKEND_ROUTES_API}FetchUsers.php?page=${page}&limit=${pageSize}&search=${searchQuery}&rolesearch=${roleSearch}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        );
        const data = await response.json();
   

        if (data.success) {
          setUsers(data.user.users.map(user => ({
            id: user.userid,
            username: user.username,
            email: user.email,
            role: user.userprivileges,
            lastlogin: user.lastlogin,
            registrationdate: user.registrationdate,
            isdisabled: user.isdisabled,
            trackmyself: user.trackmyself,
            trackothers: user.trackothers
          })));
          
          setTotalUsers(data.user.total);
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [page, pageSize, searchQuery, roleSearch]); 

  const handlePageChange = (newPage) => {
    console.log("Page changed to:", newPage);
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);

  };

  //Save User, when creating new user
  // Save User (wrapped using the external function)
  const handleSaveUser = async (e) => {
    await saveUser({
      event: e,
      formData,
      setIsSubmitting,
      setSaveSuccess,
      setErrors,
      setUsers,
      setFormData,
      setShowAddModal,
      setError,
    });
  };

  // UseEffect for clearing error message when selectedUsers changes
  useEffect(() => {
    // Clear error message if exactly one user is selected
    if (selectedUsers.length === 1) {
      setError(null);
    }
  }, [selectedUsers]); // Watch for changes in selectedUsers array


  //When Edit is clicked on a user
  const handleEdit = () => {
    if (selectedUsers.length === 0) {
      setError("Παρακαλώ επιλέξτε έναν χρήστη για επεξεργασία.");
      setTimeout(() => {
        setError(null);
      }, 5000);
      return;
    } else if (selectedUsers.length > 1) {
      setError(
        `Παρακαλώ επιλέξτε μόνο έναν χρήστη για επεξεργασία. Έχετε επιλέξει ${selectedUsers.length} χρήστες.`
      );
      setTimeout(() => {
        setError(null);
      }, 5000);
    } else if (selectedUsers.length === 1) {
      // Find the user data for the selected user and display them in the edit modal
      const userId = selectedUsers[0];
      const user = users.find((user) => user.id === userId);
      
      const userData = {
        username: user.username,
        email: user.email,
        role: user.role,
        password: "",
        confpassword: "",
        registrationdate: user.registrationdate,
        lastlogin: user.lastlogin,
      };
      setFormData(userData);
      setOriginalFormData(userData); // Store original values
      setShowEditModal(true);
      setError(null);
      setErrors({
        username: "",
        email: "",
        password: "",
        confpassword: "",
        role: "",
      });
    
    }
  };

  // Check if fields are modified on edit page to display them differently
  const isFieldModified = (fieldName) => {
    // Regular string comparison for other fields
    return formData[fieldName] !== originalFormData[fieldName];
  };


  // Update User
  const handleUpdateUser = async (e) => {
    // Pass the single selected user id (assuming selectedUsers[0]) as selectedUserId
    await updateUser({
      event: e,
      formData,
      setIsSubmitting,
      setSaveSuccess,
      setErrors,
      setUsers,
      setFormData,
      setShowEditModal,
      setError,
      selectedUserId: selectedUsers[0],
    });
  };



  // Delete User
  const handleDelete = () => {
    if (selectedUsers.length > 0) {
      setShowDeleteModal(true);
    } else {
      setError("Παρακαλώ επιλέξτε έναν χρήστη για διαγραφή.");
      setTimeout(() => {
        setError(null);
      }, 5000);
    }
  };

  // Confirm Delete
    // Confirm Delete using the external delete function
    const handleConfirmDelete = async () => {
      await confirmDeleteUser({
        selectedUsers,
        users,
        setUsers,
        setSelectedUsers,
        setShowDeleteModal,
        setError,
      });
    };


    const formatDate = (dateInput) => {
      if (!dateInput) return "Never";
    
      let date;
      if (typeof dateInput === "number") {
        // If it's a timestamp in seconds, convert to milliseconds
        if (dateInput < 1000000000000) { //(checks if its in seconds or milliseconds)
          date = new Date(dateInput * 1000); //turn it into milliseconds
        } else {
          date = new Date(dateInput);
        }
      } else {
        // If it's a string (like ISO string), parse normally
        date = new Date(dateInput);
      }
    
      if (isNaN(date)) return "Never";
    
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };
    
    

  //Generate PDF

  const handleGeneratePDF = () => {
    console.log("Generating PDF...");
  
    // Convert users objects into arrays and store in usersData
    const usersData = users.map((user) => [
      user.id,
      user.username,
      user.email,
      user.role === 1
        ? "Admin"
        : user.role === 2
          ? "Editor"
          : user.role === 3
            ? "Guest"
            : "Guest",
      user.isdisabled ? "Disabled" : "Enabled",
      formatDate(user.registrationdate),
      user.lastlogin ? formatDate(user.lastlogin) : "Never",
    ]);
  
    GeneratePDF(usersData);
  };
  

  
  return (
<div className="container-fluid" style={{ height: "100vh", overflow: "hidden" }}>
    <div className="row h-100">
      {/* Side Bar */}
      <AdminSidebar />
      <div className="col-xl-10 p-4" style={{ height: "100%", overflowY: "auto" }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Διαχείριση Χρηστών</h2>
          <button className="btn btn-primary ms-3" onClick={handleGeneratePDF}>
            Λήψη <i className="bi bi-file-earmark-pdf"></i>
          </button>
        </div>
          {/* Error and Success Messages */}
          {error && <div className="alert alert-danger">{error}</div>}
          {saveSuccess && (
            <div className="alert alert-success mt-3">
              Ο χρήστης αποθηκεύτηκε με επιτυχία!
            </div>
          )}
          {resetSuccess && (
            <div className="alert alert-success mt-3">
              Ο κωδικός πρόσβασης επαναφέρθηκε με επιτυχία!
            </div>
          )}

          {disableSuccess && (
            <div className="alert alert-success mt-3">
              Απενεργοποίηση με επιτυχία!
            </div>
          )}
          {enableSuccess && (
            <div className="alert alert-success mt-3">
              Ενεργοποίηση με επιτυχία!
            </div>
          )}

{/* Searching */}
          {/* Search Bar */}
          <div className="row">
            <div className="col-8">
          <Search onSearch={handleSearch} />
          </div>
          <div className="col-4">
          <RoleSearch handleRoleSearch={handleRoleSearch}
                       />
          </div>
          </div>


          {/* Add User Button */}
          <button
  className="btn btn-success btn-sm me-2 mb-2"
  onClick={() => setShowAddModal(true)}
>
  <i className="bi bi-plus-circle me-2"></i>
  Προσθήκη Χρήστη
</button>
          {/* Edit User Button */}
          <button
            className={`btn btn-sm mx-2 mb-2 ${
              selectedUsers.length != 1
                ? "btn-secondary  opacity-75"
                : "btn-warning"
            }`}
            onClick={handleEdit}
          >
            <i className="bi bi-pencil-square me-2"></i>
            Επεξεργασία
          </button>

         {/* Actions Button */}
         <button
            className={`btn btn-sm mx-2 mb-2 ${
              selectedUsers.length === 0 ? "btn-secondary opacity-75" : "btn-secondary opacity-100 text-light"
            }`}
            onClick={handleOpenActionsModal}
          >
            <i className={`bi bi-list me-2 s ${selectedUsers.length === 0 ? "" :"text-light"}`}></i>
            Ενέργειες
          </button>

    
 

          {/* Table With Users */}
       
          <UsersTable
 users={users}
 isLoading={isLoading}
 selectedUsers={selectedUsers}
 setSelectedUsers={setSelectedUsers}
 error={error}
 successMessage={saveSuccess}
 totalUsers={totalUsers}
 page={page}
 pageSize={pageSize}
 onPageChange={handlePageChange}
 onPageSizeChange={handlePageSizeChange}
 setShowTrackedUsersModal={setShowTrackedUsersModal}
/>


          {/* Add Modal */}
          <AddUserModal
            show={showAddModal}
            handleCloseModal={handleCloseModal}
            formData={formData}
            handleSaveUser={handleSaveUser}
            handleChange={handleChange}
            errors={errors}
            isSubmitting={isSubmitting}
          />
          {/* Backdrop Color to show gray behind the modal */}
          {showAddModal && <div className="modal-backdrop fade show"></div>}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteModal
        show={showDeleteModal}
        selectedCount={selectedUsers.length}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
      />

      {/* Delete Modal Backdrop */}
      {showDeleteModal && <div className="modal-backdrop fade show"></div>}

      

{/* Actions Modal */}
<ActionsModal
        show={showActionsModal}
        handleClose={handleCloseActionsModal}
        handleDelete={() => {
          handleDelete();
          setShowActionsModal(false);
        }}
        handleDisable={handleDisable}
        handleForceReset={handleForceReset}
         handleEnable={handleEnable}
      />


      {/* Edit Modal */}
      <EditUserModal
  show={showEditModal}
  formData={formData}
  errors={errors}
  handleCloseModal={handleCloseModal}
  isSubmitting={isSubmitting}
  isFieldModified={isFieldModified}
  handleChange={handleChange}
  handleUpdateUser={handleUpdateUser}
  originalFormData={originalFormData}
/>
      {showEditModal && <div className="modal-backdrop fade show"></div>}
      
      <TrackUsersModal 
          show={showTrackedUsersModal}
          setshowTrackedUsersModal={setShowTrackedUsersModal}
          user={selectedUsers}
          setSelectedUsers={setSelectedUsers}
        />
   
    </div>
  );
}

export default UsersDashboard;