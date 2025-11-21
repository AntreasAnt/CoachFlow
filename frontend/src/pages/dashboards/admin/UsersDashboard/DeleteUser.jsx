import { BACKEND_ROUTES_API } from '../../../../config/config';

export async function confirmDeleteUser({
    selectedUsers,
    users,
    setUsers,
    setSelectedUsers,
    setShowDeleteModal,
    setError,
  }) {
    try {
      const response = await fetch(
        BACKEND_ROUTES_API +  "DeleteUser.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userIds: selectedUsers }),
          credentials: "include",
        }
      );
  
      const data = await response.json();
  
      if (data.success) {
        // Remove deleted users from UI
        setUsers(users.filter((user) => !selectedUsers.includes(user.id)));
        setSelectedUsers([]);
        setShowDeleteModal(false);
      } else {
        setError(data.message || "Failed to delete users");
      }
    } catch (error) {
      console.error("Error deleting users:", error);
      setError("Failed to delete users");
    }
  }